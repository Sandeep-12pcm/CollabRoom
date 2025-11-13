import { supabase } from "@/integrations/supabase/client";
export const handleCreateRoom = async (e: React.FormEvent, roomName: string, setLoading: (loading: boolean) => void, toast: (options: any) => void, navigate: (path: string) => void) => {
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
        navigate("/auth");
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

      if (error) throw error;

      toast({
        title: "Room created!",
        description: `Share this code with others to join: ${roomCode}`,
      });

      setOpen(false);
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };