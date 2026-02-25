import { supabase } from "@/integrations/supabase/client";

export const checkDatabaseHealth = async () => {
  try {
    const { error } = await supabase
      .from("rooms")
      .select("id")
      .limit(1);

    if (error) throw error;

    return true;
  } catch (err) {
    return false;
  }
};