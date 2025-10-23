import { supabase } from "@/integrations/supabase/client";
export const joinDemoRoom = async (navigate: (path: string) => void) => {
  try {
    // Try to find existing demo room
    let { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", "DEMO")
      .single();
    // If no demo room, create one
    if (!room) {
      const { data: newRoom, error: insertError } = await supabase
        .from("rooms")
        .insert({
          name: "Demo Room",
          room_code: "DEMO",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      room = newRoom;
    }

    if (room) {
      navigate(`/room/${room.id}`);
    }
  } catch (err) {
    console.error("Error joining demo room:", err);
  }
};
