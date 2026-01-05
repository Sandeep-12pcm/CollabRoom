import ConfirmDialog from "./ui/ConfirmDialog";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Plus, Users, Trash2, Copy, X, Edit2, LogOut as ExitIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./ui/sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { AdSlot } from "./AdSlot";

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
  setActivePage: (id: string | null) => void;
  showDeletePopup: boolean;
  setShowDeletePopup: (v: boolean) => void;
  deleteRoom: () => Promise<void> | void;
  setRoomName: (name: string) => void;
  roomCreatorId?: string | null;
}

export default function Sidebar({
  roomId,
  roomName,
  roomCode,
  pages,
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
  roomCreatorId,
  className,
}: SidebarProps & { className?: string }) {
  const [deletingPageIds, setDeletingPageIds] = useState<Record<string, boolean>>({});
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const { isFree } = useSubscription();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // redundant effect removed (Room.tsx handles fetching and subscription)

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

      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ["room-pages", roomId] });

      // If the deleted page was active, set a new active page
      if (activePage === pageId) {
        const next = pages.filter((p) => p.id !== pageId);
        if (next.length > 0) {
          const idx = pages.findIndex((p) => p.id === pageId);
          const newIndex = Math.max(0, Math.min(idx - 1, next.length - 1));
          setActivePage(next[newIndex].id);
        } else {
          setActivePage(null);
        }
      }

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
        queryClient.invalidateQueries({ queryKey: ["room-pages", roomId] });
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

  const isAdmin = Boolean(currentUser && roomCreatorId === currentUser.id);

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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground transition-colors hover:text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => setEditingRoomName(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {isAdmin ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground transition-colors hover:text-red-500 hover:bg-red-500/10"
                onClick={() => setShowDeletePopup(true)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground transition-colors hover:text-red-500 hover:bg-red-500/10"
                onClick={() => setShowExitPopup(true)}
              >
                <ExitIcon className="h-5 w-5" />
              </Button>
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
        <div className="flex-1 overflow-y-auto min-h-0 mb-4">
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => setEditingPageId(page.id)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 ${deletingPageIds[page.id] ? "opacity-50 pointer-events-none" : ""
                      }`}
                    onClick={() => {
                      setSelectedPageId(page.id);
                      setShowConfirm(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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

          {/* Ad Slot at bottom */}
          <div className="mt-auto pt-4">
            <AdSlot size="medium" format="vertical" slot="7494183840" />
          </div>
        </div>
      </aside>

      {/* Delete Room Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        onConfirm={async () => {
          try {
            if (deleteRoom) {
              await deleteRoom();
            } else if (roomId) {
              const { error } = await supabase.from("rooms").delete().eq("id", roomId);
              if (error) throw error;
            }
          } catch (err) {
            console.error("Failed to delete room:", err);
            toast.error("Failed to delete room");
          }
        }}
        title="Delete Room?"
        message="Are you sure you want to delete this room? This action cannot be undone."
      />

      {/* Exit Room Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showExitPopup}
        onClose={() => setShowExitPopup(false)}
        onConfirm={() => {
          navigate("/");
        }}
        title="Exit Room?"
        message="Are you sure you want to exit the room?"
      />

      {/* Page Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          if (selectedPageId) deletePage(selectedPageId);
        }}
        title="Delete Page?"
        message="Are you sure you want to delete this page? This action cannot be undone."
      />
    </>
  );
}