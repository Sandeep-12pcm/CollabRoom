import ConfirmDialog from "./ui/ConfirmDialog";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Share2, Plus, Users, Trash2, Copy, X, Edit2, LogOut as ExitIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./ui/sonner";

interface Participant {
  id: string;
  display_name: string;
  user_id: string;
}

interface Page {
  id: string;
  title: string | null;
  content: string | null;
  created_by: string | null;
}

interface SidebarProps {
  roomId: string | null;
  handleCopy: () => void;
  roomCode: string;
  roomName: string;
  pages: Page[];
  activePage: string | null; // pageId (UUID)
  participants: Participant[];
  currentUser: any;
  navigate: (path: string) => void;
  shareRoom: () => void;
  addPage: () => void;
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  setActivePage: (id: string | null) => void;
  showDeletePopup: boolean;
  setShowDeletePopup: (v: boolean) => void;
  deleteRoom: () => Promise<void> | void;
  setRoomName: (name: string) => void;
}

export default function Sidebar({
  roomId,
  roomName,
  roomCode,
  pages,
  setPages,
  activePage,
  participants,
  currentUser,
  navigate,
  handleCopy,
  shareRoom,
  addPage,
  setActivePage,
  showDeletePopup,
  setShowDeletePopup,
  deleteRoom,
  setRoomName,
  className,
}: SidebarProps & { className?: string }) {
  const [roomCreator, setRoomCreator] = useState<string | null>(null);
  const [deletingPageIds, setDeletingPageIds] = useState<Record<string, boolean>>({});
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Fetch room creator (to show/hide delete room)
  useEffect(() => {
    if (!roomId) {
      setRoomCreator(null);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("created_by")
        .eq("id", roomId)
        .maybeSingle();
      if (!mounted) return;
      if (!error && data) setRoomCreator(data.created_by);
    })();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  // Fetch pages once & subscribe for realtime changes.
  useEffect(() => {
    if (!roomId) {
      setPages([]);
      return;
    }

    let mounted = true;

    const fetchPages = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (error) {
        console.error("Error fetching pages:", error);
        toast.error("Error fetching Pages")
      } else {
        // Ensure unique by id
        const unique = (data ?? []).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
        setPages(unique);
      }
    };

    fetchPages();

    // Realtime channel for pages (dedupe on INSERT)
    const channel = supabase
      .channel(`room-${roomId}-pages`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          if (payload.eventType === "INSERT") {
            const newRow: Page = payload.new;
            setPages((prev) => {
              // Deduplicate by id (important: prevents the duplicate-show bug)
              if (prev.some((p) => p.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          } else if (payload.eventType === "UPDATE") {
            const newRow: Page = payload.new;
            setPages((prev) => prev.map((p) => (p.id === newRow.id ? newRow : p)));
          } else if (payload.eventType === "DELETE") {
            const oldRow: Page = payload.old;
            setPages((prev) => prev.filter((p) => p.id !== oldRow.id));

            // if the deleted page was active, pick a sensible replacement
            if (activePage === oldRow.id) {
              setActivePage((prev) => {
                // choose first remaining page or null
                const remaining = pages.filter((p) => p.id !== oldRow.id);
                return remaining.length ? remaining[0].id : null;
              });
            }
          }
        }
      )
      .subscribe();

    // Also watch room deletion server-side (redirect if room removed externally)
    const roomWatcher = supabase
      .channel(`room-${roomId}-watch`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          toast.error("This room was deleted.");
          navigate("/");
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      // unsubscribe
      try {
        channel.unsubscribe();
      } catch (e) {
        // ignore
      }
      try {
        roomWatcher.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [roomId, setPages, navigate, activePage, setActivePage, pages]);

  // Delete a page from the backend and update UI
  const deletePage = async (pageId: string) => {
    if (!pageId) return;
    if (!currentUser) {
      toast.warning("Login to delete pages.");
      return;
    }

    setDeletingPageIds((s) => ({ ...s, [pageId]: true }));
    try {
      const { error } = await supabase
        .from("pages")
        .delete()
        .eq("id", pageId)
        .select()
        .single(); // return the deleted row (if configured)

      if (error) {
        console.error("Error deleting page:", error);
        toast.error("Failed to delete page");
        setDeletingPageIds((s) => {
          const copy = { ...s };
          delete copy[pageId];
          return copy;
        });
        return;
      }

      // Immediately update local state (realtime delete will also fire but dedupe handles it)
      setPages((prev) => {
        const idx = prev.findIndex((p) => p.id === pageId);
        const next = prev.filter((p) => p.id !== pageId);
        // If the deleted page was active, set a new active page
        if (activePage === pageId) {
          if (next.length > 0) {
            // choose previous page if available, else first
            const newIndex = Math.max(0, Math.min(idx - 1, next.length - 1));
            setActivePage(next[newIndex].id);
          } else {
            setActivePage(null);
          }
        }
        return next;
      });

      toast.success("Page deleted successfully");
    } catch (err) {
      console.error("Unexpected error deleting page:", err);
      toast.error("Unexpected error deleting page");
    } finally {
      setDeletingPageIds((s) => {
        const copy = { ...s };
        delete copy[pageId];
        return copy;
      });
    }
  };

  const handleEditPage = async (pageId: string, newTitle: string) => {
    if (newTitle.trim() === "") {
      toast.error("Page title cannot be empty.");
      setEditingPageId(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pages")
        .update({ title: newTitle })
        .eq("id", pageId)
        .select()
        .single();

      if (error) {
        console.error("Error updating page title:", error);
        toast.error("Failed to update page title.");
      } else {
        setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, title: data.title } : p)));
        toast.success("Page title updated successfully.");
      }
    } catch (err) {
      console.error("Unexpected error updating page title:", err);
      toast.error("Unexpected error updating page title.");
    } finally {
      setEditingPageId(null);
    }
  };

  const handleEditRoomName = async (newName: string) => {
    if (newName.trim() === "") {
      toast.error("Room name cannot be empty.");
      setEditingRoomName(false);
      return;
    }

    try {
      if (!roomId) {
        toast.error("Room ID is missing.");
        return;
      }
      const { error } = await supabase
        .from("rooms")
        .update({ name: newName })
        .eq("id", roomId);

      if (error) {
        console.error("Error updating room name:", error);
        toast.error("Failed to update room name.");
      } else {
        setRoomName(newName);
        toast.success("Room name updated successfully.");
      }
    } catch (err) {
      console.error("Unexpected error updating room name:", err);
      toast.error("Unexpected error updating room name.");
    } finally {
      setEditingRoomName(false);
    }
  };

  const isAdmin = Boolean(currentUser && roomCreator === currentUser.id);

  return (
    <>
      <aside className={`border-r border-border bg-card p-4 flex flex-col h-full ${className}`}>
        {/* Room name + edit/delete icon (Admin Only) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {editingRoomName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem("room-name") as HTMLInputElement;
                  handleEditRoomName(input.value);
                }}
              >
                <input
                  type="text"
                  name="room-name"
                  defaultValue={roomName}
                  autoFocus
                  onBlur={(e) => handleEditRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEditRoomName((e.target as HTMLInputElement).value);
                    }
                    if (e.key === "Escape") {
                      setEditingRoomName(false);
                    }
                  }}
                  className="bg-transparent border-b border-gray-400 focus:outline-none focus:border-white text-lg font-semibold text-foreground"
                />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{roomName}</h2>
                {isAdmin && (
                  <Edit2
                    className="h-4 w-4 text-white cursor-pointer transition-colors hover:text-yellow-500"
                    onClick={() => setEditingRoomName(true)}
                  />
                )}
              </div>
            )}
            {isAdmin ? (
              <Trash2
                className="h-5 w-5 text-white cursor-pointer transition-colors hover:text-red-500"
                onClick={() => setShowDeletePopup(true)}
              />
            ) : (
              <ExitIcon
                className="h-5 w-5 text-white cursor-pointer transition-colors hover:text-red-500"
                onClick={() => setShowExitPopup(true)}
              />
            )}
          </div>

          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Room Id:</h2>
            <p className="p-1 text-muted-foreground">{roomCode}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-accent transition"
              aria-label="Copy Room ID"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={shareRoom} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Pages Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Pages</h3>
            <Button size="sm" variant="ghost" onClick={addPage}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm transition-colors ${activePage === page.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                  }`}
              >
                {editingPageId === page.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem("page-title") as HTMLInputElement;
                      handleEditPage(page.id, input.value);
                    }}
                  >
                    <input
                      type="text"
                      name="page-title"
                      defaultValue={page.title || `Untitled Page ${idx + 1}`}
                      autoFocus
                      onBlur={(e) => handleEditPage(page.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEditPage(page.id, (e.target as HTMLInputElement).value);
                        }
                        if (e.key === "Escape") {
                          setEditingPageId(null);
                        }
                      }}
                      className="bg-transparent border-b border-gray-400 focus:outline-none focus:border-white text-sm"
                    />
                  </form>
                ) : (
                  <button onClick={() => setActivePage(page.id)} className="flex-1 text-left truncate">
                    {page.title || `Untitled Page ${idx + 1}`}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <Edit2
                    className="h-4 w-4 text-muted-foreground hover:text-yellow-500 transition cursor-pointer"
                    onClick={() => setEditingPageId(page.id)}
                  />
                  {/* Delete page button */}
                  <X
                    className={`h-4 w-4 text-muted-foreground hover:text-red-500 transition cursor-pointer ${deletingPageIds[page.id] ? "opacity-50 pointer-events-none" : ""
                      }`}
                    onClick={() => {
                      setSelectedPageId(page.id);
                      setShowConfirm(true);
                    }}
                  />
                  <ConfirmDialog
                    isOpen={showConfirm}
                    onClose={() => setShowConfirm(false)}
                    onConfirm={() => {
                      if (selectedPageId) deletePage(selectedPageId);
                    }}
                    title="Delete Page?"
                    message="Are you sure you want to delete this page? This action cannot be undone."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              Active Users ({participants.length})
            </span>
          </div>

          <div className="space-y-2">
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users in room</p>
            ) : (
              participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-sm text-foreground">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {participant.display_name}
                  {currentUser && participant.user_id === currentUser.id && " (You)"}
                </div>
              ))
            )}
          </div>

          {!currentUser && (
            <div className="mt-3 pt-3 border-t border-border">
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                Sign in to join
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Delete confirmation popup (Admin Only) */}
      {showDeletePopup && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 bg-card text-center">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Are you sure you want to delete this room?</h3>
            <div className="flex justify-center gap-4">
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    if (deleteRoom) {
                      await deleteRoom();
                    } else if (roomId) {
                      const { error } = await supabase.from("rooms").delete().eq("id", roomId);
                      if (error) throw error;
                    }
                    setShowDeletePopup(false);
                  } catch (err) {
                    console.error("Failed to delete room:", err);
                    toast.error("Failed to delete room");
                  }
                }}
              >
                Yes, Delete
              </Button>
              <Button variant="outline" onClick={() => setShowDeletePopup(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Exit confirmation popup (Non-Admin Only) */}
      {showExitPopup && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 bg-card text-center">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Are you sure you want to exit the room?</h3>
            <div className="flex justify-center gap-4">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowExitPopup(false);
                  navigate("/");
                }}
              >
                Yes, Exit
              </Button>
              <Button variant="outline" onClick={() => setShowExitPopup(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}