import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const base_url = import.meta.env.VITE_HOST_URL;
interface AIAssistantProps {
  code: string;
  language: string;
}

export const AIAssistant = ({ code, language }: AIAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const { toast } = useToast();
  const callAI = async (action: "explain" | "fix" | "optimize") => {
    if (!code.trim()) {
      toast({
        title: "No code to analyze",
        description: "Please write some code first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse("");
    setIsOpen(true);

    try {
      const res = await fetch((base_url+"/api/ai-code-assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          action,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResponse(data.response);

      // if (error) {
      //   throw error;
      // }

      // if (data?.error) {
      //   throw new Error(data.error);
      // }

      // setResponse(data.response);
      toast({
        title: "AI Response Ready",
        description: `Code ${action} complete`,
      });
    } catch (error) {
      // console.error("AI Assistant error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => callAI("explain")}
          disabled={loading}
          className="bg-primary/10 hover:bg-primary/20 border-primary/30"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Explain Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => callAI("fix")}
          disabled={loading}
          className="bg-accent/10 hover:bg-accent/20 border-accent/30"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Fix Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => callAI("optimize")}
          disabled={loading}
          className="bg-success/10 hover:bg-success/20 border-success/30"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Optimize
        </Button>
      </div>

      {isOpen && (
        <Card className="absolute top-20 right-4 w-96 max-h-[70vh] overflow-hidden flex flex-col shadow-glow border-primary/30 animate-scale-in z-50">
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Assistant</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing your code...
                </p>
              </div>
            ) : response ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-sm text-foreground whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Click a button above to get AI assistance with your code
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-card">
            <Textarea
              placeholder="Add context or specific questions (optional)..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
        </Card>
      )}
    </>
  );
};
