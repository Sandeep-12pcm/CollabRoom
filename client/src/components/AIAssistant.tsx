// import React from "react";
import React, { useRef, useState, useMemo } from "react";

// import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Loader2, Send, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";

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

  // ✅ Track which code block was copied
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Something went wrong while copying",
        variant: "destructive",
      });
    }
  };

  const callAI = async (action: "explain" | "fix" | "optimize" | "custom") => {
    if (!code.trim()) {
      toast({
        title: "No code to analyze",
        description: "Please write some code first",
        variant: "destructive",
      });
      return;
    }

    if (action === "custom" && !additionalContext.trim()) {
      toast({
        title: "Add a question first",
        description: "Write your query about the code and press send.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse("");
    setIsOpen(true);

    try {
      const res = await fetch(base_url + "/api/ai-code-assistant", {
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
      toast({
        title: "AI Response Ready",
        description: `Code ${action === "custom" ? "analysis" : action} complete`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setResponse("⚠️ Sorry, I encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const rehypePlugins = useMemo(() => [rehypeHighlight], []);

  const components = useMemo(() => ({
    code({ inline, className, children, ...props }: any) {
      const preRef = useRef<HTMLPreElement>(null);

      if (inline) {
        return (
          <code
            className="bg-[#2D2D3A] px-1 py-0.5 rounded text-gray-200"
            {...props}
          >
            {children}
          </code>
        );
      }

      const handleCopy = async () => {
        if (preRef.current) {
          const textToCopy = preRef.current.innerText;
          try {
            await navigator.clipboard.writeText(textToCopy);
            setCopiedCode(textToCopy);
            toast({
              title: "Copied!",
              description: "Code copied to clipboard",
            });
            setTimeout(() => setCopiedCode(null), 2000);
          } catch {
            toast({
              title: "Copy failed",
              description: "Could not copy code to clipboard",
              variant: "destructive",
            });
          }
        }
      };

      return (
        <div className="relative group my-3">
          <pre
            ref={preRef}
            className="bg-[#111] border border-[#2A2A40] rounded-lg p-3 text-gray-200 overflow-x-auto"
          >
            <code {...props}>{children}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2A2A3E] hover:bg-[#3A3A4A] border border-[#3E3E55] text-gray-300 px-2 py-1 rounded-md flex items-center gap-1 text-xs"
          >
            {copiedCode && preRef.current?.innerText === copiedCode ? (
              <>
                <Check className="w-3 h-3 text-green-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
      );
    },
  }), [copiedCode, toast]);

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => callAI("explain")}
          disabled={loading}
          className="bg-primary/10 hover:bg-primary/20 border-primary/30 h-7 text-xs px-2 md:h-9 md:text-sm md:px-3"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Explain Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => callAI("fix")}
          disabled={loading}
          className="bg-accent/10 hover:bg-accent/20 border-accent/30 h-7 text-xs px-2 md:h-9 md:text-sm md:px-3"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Fix Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => callAI("optimize")}
          disabled={loading}
          className="bg-success/10 hover:bg-success/20 border-success/30 h-7 text-xs px-2 md:h-9 md:text-sm md:px-3"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Optimize
        </Button>
      </div>

      {/* AI Response Window */}
      {isOpen && (
        <Card className="absolute top-20 right-4 w-[480px] max-h-[80vh] overflow-hidden flex flex-col border border-[#2A2A40] shadow-2xl bg-[#1E1E2E]/95 backdrop-blur-xl rounded-xl animate-scale-in z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D2D40] bg-[#2A2A3E]">
            <div className="flex items-center gap-2 text-gray-200">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h3 className="font-semibold text-sm tracking-wide">AI Assistant</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 text-sm scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-300">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Analyzing your code...</p>
              </div>
            ) : response ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={remarkPlugins}
                  rehypePlugins={rehypePlugins}
                  components={components}
                >
                  {response}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                Ask AI to explain, fix, or optimize your code above
              </div>
            )}
          </div>

          {/* Footer / Query Input */}
          <div className="p-3 border-t border-[#2D2D40] bg-[#2A2A3E] flex items-center gap-2">
            <Textarea
              placeholder="Ask a specific question about your code..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="min-h-[50px] text-sm bg-[#1E1E2E] border border-[#333] text-gray-200 placeholder-gray-500 focus-visible:ring-1 focus-visible:ring-primary/40"
            />
            <Button
              size="icon"
              variant="outline"
              disabled={loading || !additionalContext.trim()}
              onClick={() => callAI("custom")}
              className="bg-primary/20 hover:bg-primary/30 border-primary/40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
