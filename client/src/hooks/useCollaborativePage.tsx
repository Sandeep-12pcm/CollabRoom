import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SOCKET_URL = import.meta.env.VITE_HOST_URL;
const EMIT_THROTTLE_MS = 150;
const SAVE_DEBOUNCE_MS = 2500;

interface Participant {
  user_id: string;
  display_name?: string;
  last_seen?: string;
}

interface Cursor {
  user_id: string;
  position: any;
  color?: string;
}

export function useCollaborativePage(pageId: string | null, roomId?: string | null) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [title, setTitle] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  // console.log("SocketURL:",SOCKET_URL);
  const socketRef = useRef<Socket | null>(null);
  const lastEmitRef = useRef<number>(0);
  const saveTimerRef = useRef<number | null>(null);
  const lastLocalChangeRef = useRef<string>(""); // JSON string of last content
  const isMountedRef = useRef(true);
  const { toast } = useToast();

  // 1. Load initial content + title
  useEffect(() => {
    if (!pageId || !roomId) return;
    isMountedRef.current = true;

    (async () => {
      const { data: page, error } = await supabase
        .from("pages")
        .select("id,title,content,created_by")
        .eq("id", pageId)
        .maybeSingle();

      if (!page || error) {
        // console.error("Failed to load page:", error);
        toast({ title: "Load error", description: "Failed to load page." });
        return;
      }

      let parsed: Record<string, string> = {};
      try {
        parsed =
          typeof page.content === "string"
            ? JSON.parse(page.content)
            : page.content || {};
      } catch (e) {
        // console.warn("Invalid JSON in page content, resetting to {}", e);
        console.warn("Invalid JSON in page content, resetting to {}");
      }

      if (!isMountedRef.current) return;
      setContent(parsed);
      setTitle(page.title ?? "");
      lastLocalChangeRef.current = JSON.stringify(parsed);
    })();

    // 2. Supabase realtime subscription
    const channel = supabase
      .channel(`public:pages:page-${pageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `id=eq.${pageId}`,
        },
        (payload) => {
          const ev = payload.eventType;
          if (ev === "UPDATE") {
            const newRow = payload.new;
            if (newRow.content) {
              const remoteStr =
                typeof newRow.content === "string"
                  ? newRow.content
                  : JSON.stringify(newRow.content);
              if (remoteStr !== lastLocalChangeRef.current) {
                try {
                  setContent(JSON.parse(remoteStr));
                  lastLocalChangeRef.current = remoteStr;
                } catch {
                  console.warn("Invalid JSON from DB update");
                }
              }
            }
            if (newRow.title && newRow.title !== title) {
              setTitle(newRow.title);
            }
          } else if (ev === "DELETE") {
            toast({
              title: "Page deleted",
              description: "This page was removed.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      channel.unsubscribe();
    };
  }, [roomId, pageId, title, toast]);

  // 3. Socket.IO connection
  useEffect(() => {
    let mounted = true;

    (async () => {
      const sessionResp = await supabase.auth.getSession();
      const token = sessionResp?.data?.session?.access_token;
      if (!token) {
        console.warn("No access token - socket requires auth");
        return;
      }

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        autoConnect: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (!mounted) return;
        socket.emit("join-page", pageId, roomId);
      });

      socket.on("content-change", ({ content: remoteContent }: any) => {
        if (!remoteContent) return;
        if (remoteContent === lastLocalChangeRef.current) return;

        try {
          const parsed = JSON.parse(remoteContent);
          setContent(parsed);
          lastLocalChangeRef.current = remoteContent;
        } catch {
          console.warn("Invalid JSON in content-change");
        }
      });

      socket.on("cursor-update", ({ user_id, cursor }) => {
        setCursors((prev) => ({
          ...prev,
          [user_id]: { user_id, position: cursor },
        }));
      });

      socket.on("participant-joined", (p: Participant) => {
        setParticipants((ps) => [...ps.filter((x) => x.user_id !== p.user_id), p]);
      });

      socket.on("participant-left", (p: Participant) => {
        setParticipants((ps) => ps.filter((x) => x.user_id !== p.user_id));
        setCursors((prev) => {
          const copy = { ...prev };
          delete copy[p.user_id];
          return copy;
        });
      });

      socket.on("disconnect", (reason: any) => {
        // console.log("socket disconnected:", reason);
      });
    })();

    return () => {
      mounted = false;
      try {
        socketRef.current?.emit("leave-page", pageId);
        socketRef.current?.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [pageId, roomId]);

  // 4. Emit throttled
  const emitContentChangeThrottled = useCallback(
    (nextContent: Record<string, string>) => {
      const jsonStr = JSON.stringify(nextContent);
      const now = Date.now();
      const last = lastEmitRef.current || 0;
      if (now - last >= EMIT_THROTTLE_MS) {
        socketRef.current?.emit("content-change", { pageId, content: jsonStr });
        lastEmitRef.current = now;
      } else {
        const wait = EMIT_THROTTLE_MS - (now - last);
        window.setTimeout(() => {
          socketRef.current?.emit("content-change", { pageId, content: jsonStr });
          lastEmitRef.current = Date.now();
        }, wait);
      }
    },
    [pageId]
  );

  // 5. Debounced save
  const scheduleSave = useCallback(
    (nextContent: Record<string, string>) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      const jsonStr = JSON.stringify(nextContent);
      saveTimerRef.current = window.setTimeout(() => {
        socketRef.current?.emit("save-page", { pageId, content: jsonStr });
        saveTimerRef.current = null;
      }, SAVE_DEBOUNCE_MS);
    },
    [pageId]
  );

  // 6. Setter from editor (per-language)
  const setContentFromEditor = useCallback(
    (lang: string, code: string) => {
      const newContent = { ...content, [lang]: code };
      setContent(newContent);
      lastLocalChangeRef.current = JSON.stringify(newContent);
      emitContentChangeThrottled(newContent);
      scheduleSave(newContent);
    },
    [content, emitContentChangeThrottled, scheduleSave]
  );

  // 7. Save on beforeunload
  useEffect(() => {
    const beforeunload = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        socketRef.current?.emit("save-page", {
          pageId,
          content: lastLocalChangeRef.current,
        });
      } else {
        socketRef.current?.emit("save-page", {
          pageId,
          content: lastLocalChangeRef.current,
        });
      }
    };
    window.addEventListener("beforeunload", beforeunload);
    return () => window.removeEventListener("beforeunload", beforeunload);
  }, [pageId]);

  // 8. Manual save
  const saveNow = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    socketRef.current?.emit("save-page", {
      pageId,
      content: lastLocalChangeRef.current,
    });
  }, [pageId]);

  // 9. Title updater
  const updateTitle = useCallback(
    async (nextTitle: string) => {
      setTitle(nextTitle);
      try {
        const { error } = await supabase
          .from("pages")
          .update({ title: nextTitle, updated_at: new Date().toISOString() })
          .eq("id", pageId);
        if (error) throw error;
      } catch {
        toast({
          title: "Save failed",
          description: "Could not update title",
          variant: "destructive",
        });
      }
    },
    [pageId, toast]
  );

  return {
    content, // JSON { lang: code }
    setContent: setContentFromEditor,
    title,
    updateTitle,
    participants,
    cursors,
    saveNow,
    socket: socketRef.current,
  };
}
