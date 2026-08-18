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
        description: error.message || "Failed to create room, Please contact developer",
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
      
    });

    if (participantError) {
      toast({
        title: "Error",
        description: participantError.message || "Failed to add user to room, Please contact developer",
        variant: "destructive",
      });
      return;
    }

    setOpen(false);
    navigate(`/room/${room.id}`);
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to create room, Please contact developer",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
