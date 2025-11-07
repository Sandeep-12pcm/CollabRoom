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
import { set } from "date-fns";
import LoadingScreen from "@/components/loading/LoadingScreen";

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
  const [isLoading, setIsLoading] = useState(false);
  const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null);
  const { toast } = useToast();
  const collaborative = useCollaborativePage(activePageId, id);
  const content = collaborative?.content ?? "";
  const setContent = collaborative?.setContent ?? (() => {});
  const activePage = pages.find((p) => p.id === activePageId);
  const defaultCodeTemplates: Record<string, string> = {
    javascript: `// Write your code here...

function example() {
  console.log('Hello, DevRoom!');
}`,
    typescript: `// Write your code here...

function example(): void {
  console.log('Hello, DevRoom!');
}`,
    python: `# Write your code here...

def example():
    print("Hello, DevRoom!")`,
    java: `// Write your code here...

public class Example {
    public static void main(String[] args) {
        System.out.println("Hello, DevRoom!");
    }
}`,
    cpp: `// Write your code here...

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, DevRoom!" << endl;
    return 0;
}`,
    html: `<!-- Write your code here... -->

<!DOCTYPE html>
<html>
  <head>
    <title>Hello DevRoom</title>
  </head>
  <body>
    <h1>Hello, DevRoom!</h1>
  </body>
</html>`,
    css: `/* Write your code here... */

body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}`,
    any: `// Write your code here...`,
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

  // ---------------- Room & participants realtime ----------------
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
      setIsLoading(true);
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
        const displayName =
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
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
          console.log("room_participants error: ", part_error);
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
        // setIsLoading(false);
    };
    fetchRoom();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id, navigate, toast, isJoining]);

  // ---------------- Pages realtime ----------------
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
        // console.error("Error adding page:", error);
        toast({
          title: "Error",
          description: "Failed to add page",
          variant: "destructive",
        });
      } else if (data) {
        setActivePageId(data.id);
      }
    } catch (err) {
      // console.error("Unexpected error adding page:", err);
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
if (isLoading) {
  return <LoadingScreen />;
}

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 flex h-screen">
        <Sidebar
          roomId={id!}
          roomName={roomName}
          roomCode={roomCode}
          participants={participants}
          currentUser={currentUser}
          navigate={navigate}
          handleCopy={handleCopy}
          shareRoom={shareRoom}
          addPage={addPage}
          pages={pages}
          setPages={setPages}
          activePage={activePageId}
          setActivePage={setActivePageId}
          showDeletePopup={showDeletePopup}
          setShowDeletePopup={setShowDeletePopup}
          deleteRoom={deleteRoom}
          setRoomName={setRoomName}
        />

        <main className="flex-1 flex flex-col relative">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
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
                  </SelectContent>
                </Select>
              </div>

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
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Room;
