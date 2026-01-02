import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Profile {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  is_pro?: boolean | null;
  joined_at?: string | null;
  last_login?: string | null;
}

interface Room {
  id: string;
  room_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  name?: string | null;
  expiry_hours?: number | null;
}

export function useProfile() {
  const queryClient = useQueryClient();

  // 1. Fetch Auth User
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const userId = user?.id;

  // 2. Fetch Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, is_pro, joined_at, last_login")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newP, error: insertErr } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: user?.email,
            name: user?.user_metadata?.name || user?.user_metadata?.display_name || null,
            avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null,
            joined_at: user?.created_at,
          })
          .select()
          .maybeSingle();
        if (insertErr) throw insertErr;
        return newP as Profile;
      }
      return data as Profile;
    },
    enabled: !!userId,
  });

  // 3. Fetch Rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["rooms", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_code, created_at, updated_at, name, expiry_hours")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // 4. Real-time Subscription for Rooms
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`public:rooms:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `created_by=eq.${userId}`,
        },
        () => {
          // Invalidate rooms query on any change
          queryClient.invalidateQueries({ queryKey: ["rooms", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, queryClient]);

  const loading = userLoading || profileLoading || roomsLoading;

  return {
    loading,
    user,
    profile,
    rooms,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["rooms", userId] });
    },
    setProfile: (newProfile: Profile) => {
      queryClient.setQueryData(["profile", userId], newProfile);
    },
    setRooms: (updater: (old: Room[]) => Room[]) => {
      queryClient.setQueryData(["rooms", userId], (old: Room[] | undefined) => updater(old || []));
    },
  };
}
