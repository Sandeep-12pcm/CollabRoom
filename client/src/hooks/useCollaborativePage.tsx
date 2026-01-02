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

export function useCollaborativePage(
  pageId: string | null,
  roomId?: string | null
) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [title, setTitle] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const socketRef = useRef<Socket | null>(null);
  const lastEmitRef = useRef<number>(0);
  const saveTimerRef = useRef<number | null>(null);
  const lastLocalChangeRef = useRef<string>(""); // JSON string of last content
  const isMountedRef = useRef(true);
  const { toast } = useToast();
  const currentUserRef = useRef<any>(null);
  const [editingUser, setEditingUser] = useState<{
    user_id: string;
    display_name: string;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const editingTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load initial content and title from Supabase.
   */
  useEffect(() => {
    if (!pageId || !roomId) return;
    isMountedRef.current = true;

    (async () => {
      const { data: page, error } = await supabase
        .from("pages")
        .select("id,title,content,created_by,selected_language")
        .eq("id", pageId)
        .maybeSingle() as any;

      if (!page || error) {
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
        console.warn("Invalid JSON in page content, resetting to {}");
      }

      if (!isMountedRef.current) return;
      setContent(parsed);
      setTitle(page.title ?? "");
      if (page.selected_language) {
        setSelectedLanguage(page.selected_language);
      }
      lastLocalChangeRef.current = JSON.stringify(parsed);
    })();

    /**
     * Supabase realtime subscription for page updates.
     */
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
            if (newRow.selected_language && newRow.selected_language !== selectedLanguage) {
              setSelectedLanguage(newRow.selected_language);
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

  /**
   * Socket.IO connection handling.
   */
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
        setIsConnected(true);
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
        setParticipants((ps) => [
          ...ps.filter((x) => x.user_id !== p.user_id),
          p,
        ]);
      });

      socket.on("participant-left", (p: Participant) => {
        setParticipants((ps) => ps.filter((x) => x.user_id !== p.user_id));
        setCursors((prev) => {
          const copy = { ...prev };
          delete copy[p.user_id];
          return copy;
        });
      });
      socket.on("editing-started", ({ user_id, display_name }) => {
        setEditingUser({ user_id, display_name });
        console.log("Editing started:", { user_id, display_name });
      });

      socket.on("editing-stopped", () => {
        setEditingUser(null);
      });

      socket.on("disconnect", (reason: any) => {
        setIsConnected(false);
      });
    })();

    return () => {
      mounted = false;
      try {
        socketRef.current?.emit("leave-page", pageId);
        socketRef.current?.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
  }, [pageId, roomId]);

  /**
   * Emit content changes with throttling.
   */
  const emitContentChangeThrottled = useCallback(
    (nextContent: Record<string, string>) => {
      const jsonStr = JSON.stringify(nextContent);
      const now = Date.now();
      const last = lastEmitRef.current || 0;
      if (socketRef.current) {
        if (now - last >= EMIT_THROTTLE_MS) {
          socketRef.current.emit("content-change", {
            pageId,
            content: jsonStr,
          });
          lastEmitRef.current = now;
        } else {
          const wait = EMIT_THROTTLE_MS - (now - last);
          window.setTimeout(() => {
            socketRef.current?.emit("content-change", {
              pageId,
              content: jsonStr,
            });
            lastEmitRef.current = Date.now();
          }, wait);
        }
      }
    },
    [pageId]
  );

  /**
   * Schedule a debounced save to the database.
   */
  const scheduleSave = useCallback(
    (nextContent: Record<string, string>) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      const jsonStr = JSON.stringify(nextContent);
      saveTimerRef.current = window.setTimeout(() => {
        socketRef.current?.emit("save-page", { pageId, content: jsonStr });
        saveTimerRef.current = null;
      }, SAVE_DEBOUNCE_MS);
    },
    [pageId]
  );

  /**
   * Update content from the editor and handle editing locks.
   */
  const setContentFromEditor = useCallback(
    async (lang: string, code: string) => {

      const newContent = { ...content, [lang]: code };
      setContent(newContent);
      lastLocalChangeRef.current = JSON.stringify(newContent);
      console.log("setContentFromEditor called");
      // 🔥 Editing lock logic (only runs when socket exists)
      if (socketRef.current) {
        console.log("✅ Socket connected, executing editing lock logic");
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        socketRef.current.emit("editing-started", {
          pageId,
          user_id: user?.id,
          display_name:
            user?.user_metadata?.display_name || user?.email || "Someone",
        });

        if (editingTimerRef.current) clearTimeout(editingTimerRef.current);
        editingTimerRef.current = setTimeout(() => {
          socketRef.current?.emit("editing-stopped", { pageId });
        }, 5000);
      } else {
        console.log("Socket not connected, skipping editing lock logic");
      }

      emitContentChangeThrottled(newContent);
      scheduleSave(newContent);
    },
    [content, emitContentChangeThrottled, scheduleSave, pageId]
  );

  /**
   * Save content before unloading the page.
   */
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

  /**
   * Manually trigger a save.
   */
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

  /**
   * Update the page title.
   */
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

  /**
   * Update the selected language.
   */
  const updateLanguage = useCallback(
    async (lang: string) => {
      setSelectedLanguage(lang);
      try {
        const { error } = await supabase
          .from("pages")
          .update({ selected_language: lang, updated_at: new Date().toISOString() } as any)
          .eq("id", pageId);
        if (error) throw error;
      } catch {
        toast({
          title: "Save failed",
          description: "Could not update language",
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
    editingUser,
    cursors,
    saveNow,
    socket: socketRef.current,
    selectedLanguage,
    updateLanguage,
    isConnected,
  };
}
