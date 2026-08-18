import { supabase } from "@/integrations/supabase/client";

const generateRoomCode = (length = 6) => {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
};

interface CreateRoomParams {
  e: React.FormEvent;
  roomName: string;
  setLoading: (loading: boolean) => void;
  toast: (options: any) => void;
  navigate: (path: string) => void;
  setOpen: (open: boolean) => void;
}

export const createRoom = async ({
  e,
  roomName,
  setLoading,
  toast,
  navigate,
  setOpen,
}: CreateRoomParams) => {
  e.preventDefault();
  setLoading(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a room.",
        variant: "destructive",
      });
      navigate(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const roomCode = generateRoomCode(6);

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        name: roomName,
        created_by: user.id,
        room_code: roomCode,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create room, Please contact developer",
        variant: "destructive",
      });
      return;
    };

    toast({
      title: "Room created!",
      description: `Share this code with others to join: ${roomCode}`,
    });

    // Add user to room participants
    const { error: participantError } = await supabase.from("room_participants").insert({
      room_id: room.id,
      user_id: user.id,
      role: 'owner',
      display_name: user.user_metadata.full_name,
    });

    if (participantError) {
      toast({
        title: "Error",
        description: "Failed to add user to room, Please contact developer",
        variant: "destructive",
      });
      return;
    }

    setOpen(false);
    navigate(`/room/${room.id}`);
    try {
      const { error: pageError } = await supabase.from("pages").insert({
        room_id: room.id,
        title: "Getting Started",
        selected_language: "any",
        content: "# Getting Started\n\n## Welcome to CollabRoom!\n\nThis is your collaborative workspace.\n\nTo invite others, share your Room Code.\n\nHappy coding! 🚀",
        created_by: user.id,
      });

      if (pageError) {
        console.error("Error creating initial page:", pageError);
      }
    } catch (error: any) {
      console.error("Error creating initial page:", error);
    }
  } catch (error: any) {
    toast({
      title: "Error",
      description: "Failed to create room, Please contact developer",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
