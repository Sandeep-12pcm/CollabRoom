import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Download } from "lucide-react";

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
  const theme = localStorage.getItem("theme") as "light" | "dark" | null;

  const { isConnected, selectedLanguage, updateLanguage } = collaborative;
  const setContent = collaborative?.setContent ?? (() => { });
  const language = selectedLanguage || "javascript";
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
    updateLanguage(lang);
    // If content for this language doesn't exist, initialize it
    if (!content?.[lang]) {
      setContent(lang, defaultCodeTemplates[lang] || "");
    }
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
              onConflict: "room_id, user_id",
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

    return () => { supabase.removeChannel(channel); };
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
      // Calculate next page number
      const pageNumbers = pages
        .map((p) => {
          const match = p.title?.match(/^Page (\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));
      const nextNum = pageNumbers.length > 0 ? Math.max(...pageNumbers) + 1 : 1;

      const { data, error } = await supabase
        .from("pages")
        .insert({
          room_id: id,
          title: `Page ${nextNum}`,
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

  const handlezip = () => {
    console.log("clicked download")
  }

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

  const sidebarProps = useMemo(() => ({
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
  }), [
    id, roomName, roomCode, participants, currentUser, navigate,
    handleCopy, shareRoom, addPage, pages, setPages,
    activePageId, setActivePageId, showDeletePopup, setShowDeletePopup,
    deleteRoom, setRoomName
  ]);

  const editorOptions = useMemo(() => ({
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
  }), []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setContent(language, value ?? "");
  }, [setContent, language]);

  const editorWrapperProps = useMemo(() => ({}), []);
  const markdownRemarkPlugins = useMemo(() => [remarkGfm, remarkBreaks], []);
  const markdownRehypePlugins = useMemo(() => [rehypeRaw], []);



  // ...

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={activePage?.title || roomName || "Room"}
        description={`Collaborate in real-time in ${roomName}`}
      />
      <div className="pt-16 flex flex-row min-h-screen">
        <Navbar />
        {!isMobile && (
          <div className="md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
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

        <main className="flex-1 flex flex-col relative">
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
                      <Sidebar
                        {...sidebarProps}
                        className="w-full h-full border-none pt-12"
                      />
                    </SheetContent>
                  </Sheet>
                )}
                <h2 className="font-semibold text-foreground ">
                  {activePage?.title || "Untitled Page"}
                </h2>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[100px] md:w-[180px]">
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
                    <SelectItem value="markdown">Markdown (Docs/Table View)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* ✅ REQUIRED FIX: group right-side buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlezip}
                  className="transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs px-2 md:h-10 md:text-sm md:px-4"
                >
                  <Download className="md:h-4 md:w-4 h-2 w-2 md:mr-2" />
                  Download ZIP
                </Button>

                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(content[language] ?? "");
                    setCopied(true);
                    toast({
                      title: "Copied!",
                      description: "Code copied to clipboard",
                    });
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`transition-all duration-300 ${copied
                    ? "bg-success hover:bg-success"
                    : "bg-primary hover:bg-primary/90"
                    } h-8 text-xs px-2 md:h-10 md:text-sm md:px-4`}
                >
                  {copied ? (
                    <>
                      <Check className="md:h-4 md:w-4 h-2 w-2 md:mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="md:h-4 md:w-4 h-2 w-2 md:mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
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
                    </div>

                    <textarea
                      value={
                        (content && content[language]) ??
                        defaultCodeTemplates[language]
                      }
                      onChange={(e) => setContent(language, e.target.value)}
                      className="flex-1 w-full resize-none p-3 rounded-md font-mono text-sm outline-none border bg-[#252526] text-white border-gray-700 focus:border-gray-500"
                      placeholder="Write Markdown collaboratively..."
                    />
                  </div>

                  {/* Markdown Preview */}
                  <div className="w-full md:w-1/2 p-3 overflow-auto bg-white text-black rounded-b-md md:rounded-r-md">
                    <h3 className="text-sm font-semibold mb-2">👁️ Preview</h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={markdownRemarkPlugins}
                        rehypePlugins={markdownRehypePlugins}
                      >
                        {content?.[language] ?? ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <Editor
                  height="80vh"
                  language={language === "any" ? "javascript" : language}
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  value={
                    (content && content[language]) ??
                    defaultCodeTemplates[language]
                  }
                  onChange={handleEditorChange}
                  options={editorOptions}
                  wrapperProps={editorWrapperProps}
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
