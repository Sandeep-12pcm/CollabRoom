import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCollaborativePage } from "@/hooks/useCollaborativePage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIAssistant } from "@/components/AIAssistant";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import Editor from "@monaco-editor/react";
import LoadingScreen from "@/components/loading/LoadingScreen";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SEO } from "@/components/SEO";

interface Participant {
  id: string;
  display_name: string;
  user_id: string;
}

interface Page {
  id: string;
  title: string;
  content: string;
  created_by: string;
}

/**
 * Room Component
 * 
 * Handles the real-time collaboration interface, including:
 * - Code editor and Markdown preview
 * - Real-time participant tracking
 * - Page management
 * - Chat/AI assistant integration
 */
const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [copied, setCopied] = useState(false);
  const [roomName, setRoomName] = useState("Loading...");
  const [roomCode, setRoomCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const collaborative = useCollaborativePage(activePageId, id);

  const content = collaborative?.content ?? "";
  const isMobile = useIsMobile();

  const { editingUser } = collaborative;
  const setContent = collaborative?.setContent ?? (() => {});
  const activePage = pages.find((p) => p.id === activePageId);
  const defaultCodeTemplates: Record<string, string> = {
    javascript: `// Write your code here...

function example() {
  console.log('Hello, CollabRoom!');
}`,
    typescript: `// Write your code here...

function example(): void {
  console.log('Hello, CollabRoom!');
}`,
    python: `# Write your code here...

def example():
  print("Hello, CollabRoom!")`,
    java: `// Write your code here...

public class Example {
  public static void main(String[] args) {
      System.out.println("Hello, CollabRoom!");
  }
}`,
    cpp: `// Write your code here...

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CollabRoom!" << endl;
    return 0;
}`,
    html: `<!-- Write your code here... -->

<!DOCTYPE html>
<html>
  <head>
    <title>Hello CollabRoom</title>
  </head>
  <body>
    <h1>Hello, CollabRoom!</h1>
  </body>
</html>`,
    css: `/* Write your code here... */

body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}`,
    any: `// Write your code here...`,
    markdown: `# Welcome to CodeRoom!`,
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setContent(
      (prev) => ({
        ...prev,
        [lang]: prev[lang] ?? defaultCodeTemplates[lang],
      }),
      true // Pass the second argument as required by setContent
    );
  };

  /**
   * Effect to handle room data fetching and real-time participant updates.
   * Subscribes to 'room_participants' changes.
   */
  useEffect(() => {
    let channel: RealtimeChannel | undefined;

    const fetchRoom = async () => {
      if (!id) {
        toast({
          title: "Invalid Room",
          description: "No room ID provided",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (roomError || !room) {
        toast({
          title: "Room not found",
          description: "This room doesn't exist or has been deleted",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setRoomName(room.name);
      setRoomCode(room.room_code);
      setRoomOwnerId(room.created_by);

      if (user && !isJoining) {
        setIsJoining(true);
        console.log("Joining room participants for user:", user);
        const displayName =
          user.user_metadata?.display_name || user.user_metadata?.full_name ||
          
          "Anonymous";
        const { error: part_error } = await supabase
          .from("room_participants")
          .upsert(
            {
              room_id: id,
              user_id: user.id || "NAN",
              display_name: displayName,
              last_seen: new Date().toISOString(),
            },
            {
              onConflict: ["room_id", "user_id"], // <--- key here
              returning: "representation", // optional: returns the inserted/updated row
            }
          );

        if (part_error) {
           console.error("Failed to upsert participant:", part_error);
        }
      }

      const { data: initialParticipants } = await supabase
        .from("room_participants")
        .select("*")
        .eq("room_id", id);
      if (initialParticipants) setParticipants(initialParticipants);

      channel = supabase
        .channel(`room:${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_participants",
            filter: `room_id=eq.${id}`,
          },
          (payload) => {
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              setParticipants((prev) => {
                const exists = prev.find((p) => p.id === payload.new.id);
                if (exists) {
                  return prev.map((p) =>
                    p.id === payload.new.id ? (payload.new as Participant) : p
                  );
                }
                return [...prev, payload.new as Participant];
              });
            } else if (payload.eventType === "DELETE") {
              setParticipants((prev) =>
                prev.filter((p) => p.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    };
    fetchRoom();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id, navigate, toast, isJoining]);

  /**
   * Effect to handle pages data fetching and real-time updates.
   * Subscribes to 'pages' changes.
   */
  useEffect(() => {
    if (!id) return;

    const loadPages = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, content, created_by")
        .eq("room_id", id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setPages(data);
        if (data.length > 0) setActivePageId(data[0].id);
      }
    };
    loadPages();

    const channel = supabase
      .channel(`pages:room-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `room_id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPages((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev;
              return [...prev, payload.new as Page];
            });
          } else if (payload.eventType === "DELETE") {
            setPages((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setPages((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Page) : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  const addPage = async () => {
    if (!id) return;
    if (!currentUser) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to add a page",
        variant: "destructive",
      });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("pages")
        .insert({
          room_id: id,
          title: `Page ${pages.length + 1}`,
          content: JSON.stringify({
            [language]: defaultCodeTemplates[language],
          }),
          created_by: currentUser ? currentUser.id : null,
        })
        .select()
        .single();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add page",
          variant: "destructive",
        });
      } else if (data) {
        setActivePageId(data.id);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add page",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Copied!",
      description: "Room Code copied to clipboard.",
    });
  };

  const shareRoom = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Share Link Copied!",
      description: "Anyone with this link can join the room",
    });
  };

  const deleteRoom = async () => {
    if (!id) return;
    if (!currentUser || currentUser.id !== roomOwnerId) {
      toast({
        title: "Not Authorized",
        description: "You must be the room owner to delete this room",
        variant: "destructive",
      });
      return;
    }
    try {
      await supabase.from("room_participants").delete().eq("room_id", id);
      await supabase.from("pages").delete().eq("room_id", id);
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete room",
          variant: "destructive",
        });
        return;
      } else {
        toast({
          title: "Room Deleted",
          description: "The room has been deleted successfully.",
        });
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust as needed
    return () => clearTimeout(timer);
  }, []);

  const sidebarProps = {
    roomId: id!,
    roomName,
    roomCode,
    participants,
    currentUser,
    navigate,
    handleCopy,
    shareRoom,
    addPage,
    pages,
    setPages,
    activePage: activePageId,
    setActivePage: setActivePageId,
    showDeletePopup,
    setShowDeletePopup,
    deleteRoom,
    setRoomName,
  };



// ...

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={activePage?.title || roomName || "Room"}
        description={`Collaborate in real-time in ${roomName}`}
      />
      <div className="pt-16 flex flex-row h-screen overflow-hidden">
        <Navbar />
        {!isMobile && (
          <div className="md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border">
            <Sidebar {...sidebarProps} />
          </div>
        )}
          {/* AnimatePresence handles mount/unmount animations */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 z-50 bg-background"
              >
                <LoadingScreen />
              </motion.div>
            )}
          </AnimatePresence>

          <main className="flex-1 flex flex-col relative overflow-hidden">
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  {isMobile && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                          <Menu className="h-6 w-6" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-72">
                        <Sidebar {...sidebarProps} className="w-full h-full border-none" />
                      </SheetContent>
                    </Sheet>
                  )}
                  <h2 className="font-semibold text-foreground">
                    {activePage?.title || "Untitled Page"}
                  </h2>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="markdown">
                        Markdown (Docs/Table View)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      content[language] ?? ""
                    );
                    setCopied(true);
                    toast({
                      title: "Copied!",
                      description: "Code copied to clipboard",
                    });
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`transition-all duration-300 ${
                    copied
                      ? "bg-success hover:bg-success"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
                  
              <AIAssistant code={content[language] ?? ""} language={language} />
            </div>

            <div className="flex-1 p-4">
              <Card className="h-full bg-code-bg border-code-border">
                {language === "markdown" ? (
                  <div className="flex flex-col md:flex-row h-full">
                    {/* Markdown Collaborative Editor */}
                    <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-border p-3 bg-[#1e1e1e] text-white flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold">
                          ✏️ Markdown Editor (Collaborative)
                        </h3>
                        {editingUser && (
                          <span className="text-xs text-amber-400">
                            Currently being edited by {editingUser.display_name}
                          </span>
                        )}
                        {!editingUser && (
                          <span className="text-xs text-green-400">
                            You can edit now!
                          </span>
                        )}
                      </div>

                      <textarea
                        value={
                          (content && content[language]) ??
                          defaultCodeTemplates[language]
                        }
                        onChange={(e) => {
                          if (
                            !editingUser ||
                            editingUser.user_id === collaborative.socket?.id
                          ) {
                            setContent(language, e.target.value);
                          }
                        }}
                        disabled={
                          editingUser &&
                          editingUser.user_id !== collaborative.socket?.id
                        }
                        className={`flex-1 w-full resize-none p-3 rounded-md font-mono text-sm outline-none border ${
                          editingUser &&
                          editingUser.user_id !== collaborative.socket?.id
                            ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                            : "bg-[#252526] text-white border-gray-700 focus:border-gray-500"
                        }`}
                        placeholder={
                          editingUser &&
                          editingUser.user_id !== collaborative.socket?.id
                            ? `${editingUser.display_name} is editing...`
                            : "Write Markdown collaboratively..."
                        }
                      />
                    </div>

                    {/* Markdown Preview */}
                    <div className="w-full md:w-1/2 p-3 overflow-auto bg-white text-black rounded-b-md md:rounded-r-md">
                      <h3 className="text-sm font-semibold mb-2">👁️ Preview</h3>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {content?.[language] ?? ""}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    language={language === "any" ? "javascript" : language}
                    theme="vs-dark"
                    value={
                      (content && content[language]) ??
                      defaultCodeTemplates[language]
                    }
                    onChange={(value) => setContent(language, value ?? "")}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                )}
              </Card>
            </div>
          </main>
      </div>
    </div>
  );
};

export default Room;
