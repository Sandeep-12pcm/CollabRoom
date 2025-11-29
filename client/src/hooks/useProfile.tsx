import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user: suser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !suser) {
        setUser(null);
        setProfile(null);
        setRooms([]);
        setLoading(false);
        return;
      }
      setUser(suser);

      // Fetch profile details
      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, is_pro, joined_at, last_login")
        .eq("id", suser.id)
        .maybeSingle(); // safe if no row yet

      if (pErr) throw pErr;

      if (!pData) {
        // create blank profile row if not present
        const { data: newP, error: insertErr } = await supabase
          .from("profiles")
          .insert({
            id: suser.id,
            email: suser.email,
            name:
              suser.user_metadata?.name ||
              suser.user_metadata?.display_name ||
              null,
            avatar_url:
              suser.user_metadata?.avatar_url ||
              suser.user_metadata?.picture ||
              null,
            joined_at: suser.created_at,
          })
          .select()
          .maybeSingle();
        if (insertErr) throw insertErr;
        console.log("No profile found; created new profile.", suser);
        console.log("Created new profile for user:", newP);
        setProfile(newP || null);
      } else {
        setProfile(pData as Profile);
      }

      // Fetch user's rooms
      const { data: rData, error: rErr } = await supabase
        .from("rooms")
        .select("id, room_code, created_at, updated_at, name, expiry_hours")
        .eq("created_by", suser.id)
        .order("created_at", { ascending: false });

      if (rErr) throw rErr;
      setRooms(rData || []);
    } catch (err) {
      console.error("useProfile fetchAll error", err);
      // do not toast here - let callers handle it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // real-time listener for rooms changes for this user
    let subscription: any;
    (async () => {
      const {
        data: { user: suser },
      } = await supabase.auth.getUser();
      if (!suser) return;
      subscription = supabase
        .channel("public:rooms")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rooms",
            filter: `created_by=eq.${suser.id}`,
          },
          (payload) => {
            setRooms((r) => [payload.new, ...r]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rooms",
            filter: `created_by=eq.${suser.id}`,
          },
          (payload) => {
            setRooms((r) =>
              r.map((it) => (it.id === payload.new.id ? payload.new : it))
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "rooms",
            filter: `created_by=eq.${suser.id}`,
          },
          (payload) => {
            setRooms((r) => r.filter((it) => it.id !== payload.old.id));
          }
        )
        .subscribe();
    })();

    return () => {
      try {
        if (subscription) supabase.removeChannel(subscription);
      } catch (e) {}
    };
  }, [fetchAll]);

  return {
    loading,
    user,
    profile,
    rooms,
    refresh: fetchAll,
    setProfile,
    setRooms,
  };
}