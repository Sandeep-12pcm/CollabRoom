import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface UserPresence {
  user_id: string;
  display_name: string;
  cursor: CursorPosition | null;
  color: string;
  online_at: string;
}

// Distinct colors for different users
const CURSOR_COLORS = [
  "#FF6B6B", // coral red
  "#4ECDC4", // teal
  "#FFE66D", // yellow
  "#95E1D3", // mint
  "#F38181", // salmon
  "#AA96DA", // lavender
  "#FCBAD3", // pink
  "#A8D8EA", // sky blue
  "#FF9F43", // orange
  "#6A0572", // purple
];

export function useCursorPresence(
  roomId: string | null,
  pageId: string | null,
  currentUserId: string | null,
  displayName: string
) {
  const [presenceState, setPresenceState] = useState<Record<string, UserPresence[]>>({});
  const [otherCursors, setOtherCursors] = useState<UserPresence[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const colorRef = useRef<string>(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  // Initialize presence channel
  useEffect(() => {
    if (!roomId || !pageId || !currentUserId) return;

    const channelName = `cursor-presence:${roomId}:${pageId}`;
    console.log("Joining cursor presence channel:", channelName);

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState<UserPresence>();
        console.log("Presence sync:", newState);
        setPresenceState(newState);

        // Extract other users' cursors
        const others: UserPresence[] = [];
        Object.entries(newState).forEach(([key, presences]) => {
          if (key !== currentUserId) {
            presences.forEach((p) => others.push(p));
          }
        });
        setOtherCursors(others);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
        setOtherCursors((prev) => prev.filter((p) => p.user_id !== key));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track initial presence
          await channel.track({
            user_id: currentUserId,
            display_name: displayName || "Anonymous",
            cursor: null,
            color: colorRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log("Leaving cursor presence channel");
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, pageId, currentUserId, displayName]);

  // Update cursor position
  const updateCursor = useCallback(
    async (position: CursorPosition | null) => {
      if (!channelRef.current || !currentUserId) return;

      try {
        await channelRef.current.track({
          user_id: currentUserId,
          display_name: displayName || "Anonymous",
          cursor: position,
          color: colorRef.current,
          online_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating cursor:", error);
      }
    },
    [currentUserId, displayName]
  );

  return {
    otherCursors,
    updateCursor,
    myColor: colorRef.current,
  };
}
