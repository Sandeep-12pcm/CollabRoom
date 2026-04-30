import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table,
  Code,
  Quote,
  Minus,
  Link,
  Sparkles,
  Eye,
  PenLine,
  Undo,
  Redo,
} from "lucide-react";


// ─── Types ───────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

type EditorMode = "split" | "smart";

// ─── HTML → Markdown Serialiser ──────────────────────────────────────────────

function nodeToMarkdown(node: Node, ctx: { inTable: boolean } = { inTable: false }): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = () =>
    Array.from(el.childNodes)
      .map((n) => nodeToMarkdown(n, ctx))
      .join("");

  switch (tag) {
    case "h1": return `# ${children()}\n\n`;
    case "h2": return `## ${children()}\n\n`;
    case "h3": return `### ${children()}\n\n`;
    case "h4": return `#### ${children()}\n\n`;
    case "h5": return `##### ${children()}\n\n`;
    case "h6": return `###### ${children()}\n\n`;
    case "p":  return `${children()}\n\n`;
    case "br": return `\n`;
    case "strong":
    case "b":  return `**${children()}**`;
    case "em":
    case "i":  return `*${children()}*`;
    case "s":
    case "del":
    case "strike": return `~~${children()}~~`;
    case "code": {
      const parent = el.parentElement?.tagName.toLowerCase();
      if (parent === "pre") return children();
      return `\`${children()}\``;
    }
    case "pre": {
      const codeEl = el.querySelector("code");
      const lang = codeEl?.className.replace("language-", "") ?? "";
      const code = codeEl ? codeEl.textContent ?? "" : el.textContent ?? "";
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }
    case "blockquote": return children()
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n") + "\n\n";
    case "hr": return `---\n\n`;
    case "a": {
      const href = el.getAttribute("href") ?? "";
      return `[${children()}](${href})`;
    }
    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      return `![${alt}](${src})`;
    }
    case "ul": {
      return (
        Array.from(el.children)
          .map((li) => {
            const liEl = li as HTMLElement;
            const nested = liEl.querySelector("ul, ol");
            let text = Array.from(liEl.childNodes)
              .filter((n) => n !== nested)
              .map((n) => nodeToMarkdown(n, ctx))
              .join("")
              .trim();
            let result = `- ${text}\n`;
            if (nested) {
              const nestedMd = nodeToMarkdown(nested, ctx)
                .split("\n")
                .map((l) => (l ? `  ${l}` : ""))
                .join("\n");
              result += nestedMd;
            }
            return result;
          })
          .join("") + "\n"
      );
    }
    case "ol": {
      return (
        Array.from(el.children)
          .map((li, idx) => {
            const liEl = li as HTMLElement;
            const nested = liEl.querySelector("ul, ol");
            let text = Array.from(liEl.childNodes)
              .filter((n) => n !== nested)
              .map((n) => nodeToMarkdown(n, ctx))
              .join("")
              .trim();
            let result = `${idx + 1}. ${text}\n`;
            if (nested) {
              const nestedMd = nodeToMarkdown(nested, ctx)
                .split("\n")
                .map((l) => (l ? `   ${l}` : ""))
                .join("\n");
              result += nestedMd;
            }
            return result;
          })
          .join("") + "\n"
      );
    }
    case "li": return children();
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (rows.length === 0) return "";
      const headerRow = rows[0];
      const bodyRows = rows.slice(1);
      const getCells = (row: Element, cellTag: string) =>
        Array.from(row.querySelectorAll(cellTag)).map(
          (c) => (c as HTMLElement).innerText.replace(/\|/g, "\\|").trim()
        );
      const headers = getCells(headerRow, "th").length
        ? getCells(headerRow, "th")
        : getCells(headerRow, "td");
      const headerLine = `| ${headers.join(" | ")} |`;
      const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
      const bodyLines = bodyRows.map((r) => {
        const cells = getCells(r, "td");
        return `| ${cells.join(" | ")} |`;
      });
      return [headerLine, separatorLine, ...bodyLines].join("\n") + "\n\n";
    }
    case "thead":
    case "tbody":
    case "tr":
    case "th":
    case "td":
      return children();
    case "div":
    case "section":
    case "article":
    case "main": {
      const inner = children();
      // avoid double blank lines
      return inner.endsWith("\n\n") ? inner : inner + (inner.trim() ? "\n" : "");
    }
    case "span": return children();
    default: return children();
  }
}

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const md = nodeToMarkdown(doc.body, { inTable: false });
  // Collapse >2 consecutive blank lines
  return md.replace(/\n{3,}/g, "\n\n").trimEnd();
}

// ─── Toolbar actions using execCommand ───────────────────────────────────────

function execFmt(command: string, value?: string) {
  document.execCommand(command, false, value);
}

function insertAtCursor(html: string) {
  document.execCommand("insertHTML", false, html);
}

// ─── ToolbarButton ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}
const ToolbarButton = ({ icon, label, onClick, active }: ToolbarButtonProps) => (
  <button
    title={label}
    onMouseDown={(e) => {
      e.preventDefault(); // don't lose focus
      onClick();
    }}
    className={`
      p-1.5 rounded-md transition-all duration-150 
      ${active
        ? "bg-primary/20 text-primary shadow-inner"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }
    `}
    aria-label={label}
  >
    {icon}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MarkdownEditor = ({ value, onChange, readOnly = false }: MarkdownEditorProps) => {
  const [mode, setMode] = useState<EditorMode>("split");
  // editorRef is a plain mutable ref; we assign it via the callback ref below
  const editorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // This hidden div always renders the markdown via ReactMarkdown so we can
  // steal its innerHTML for the Smart Edit contenteditable.
  const hiddenPreviewRef = useRef<HTMLDivElement>(null);

  // Track the last value we ourselves emitted so we can ignore round-trips
  const lastEmittedValue = useRef(value);
  // Track whether the contenteditable is currently focused (user is typing)
  const smartEditorFocused = useRef(false);
  // Keep a stable ref to the latest value so the callback ref can read it
  const valueRef = useRef(value);
  valueRef.current = value;

  const remarkPlugins = useMemo(() => [remarkGfm, remarkBreaks], []);
  const rehypePlugins = useMemo(() => [rehypeRaw], []);

  /** Returns the best available HTML for the current markdown value. */
  const getRenderedHtml = useCallback((): string => {
    // Prefer the ReactMarkdown output (full GFM support)
    if (hiddenPreviewRef.current && hiddenPreviewRef.current.innerHTML.trim()) {
      return hiddenPreviewRef.current.innerHTML;
    }
    // Fallback: basic regex converter (same as before)
    return markdownToContentEditableHtml(valueRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);;

  // ── Sync textarea (uncontrolled) when value changes externally ─────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // Only update if the change is truly external (not our own keystroke)
    if (value === lastEmittedValue.current) return;
    lastEmittedValue.current = value;
    // Preserve cursor position across the update
    const { selectionStart, selectionEnd } = ta;
    ta.value = value;
    ta.setSelectionRange(selectionStart, selectionEnd);
  }, [value]);

  // ── Callback ref: fires the instant the div is inserted into the DOM ───────
  const smartEditorCallbackRef = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node) {
      node.innerHTML = getRenderedHtml();
      lastEmittedValue.current = valueRef.current;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getRenderedHtml]);

  // ── Sync markdown → contenteditable when value changes externally ──────────
  useEffect(() => {
    if (mode !== "smart") return;
    if (smartEditorFocused.current) return;
    if (value === lastEmittedValue.current) return;
    lastEmittedValue.current = value;
    if (editorRef.current) {
      // Use the freshly-rendered HTML from the hidden ReactMarkdown div
      editorRef.current.innerHTML = getRenderedHtml();
    }
  }, [value, mode, getRenderedHtml]);

  // ── Convert markdown string to basic HTML for contenteditable ─────────────
  // We use a hidden <div> with ReactMarkdown rendered, then grab its innerHTML
  // But since that's async, we do a synchronous regex-based quick render for
  // the contenteditable which handles common cases.
  function markdownToContentEditableHtml(md: string): string {
    let html = md;

    // Code blocks (must be first)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre><code class="language-${lang}">${escHtml(code.trimEnd())}</code></pre>`
    );
    // Headings
    html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
    html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    // Horizontal rules
    html = html.replace(/^(---|\*\*\*|___)\s*$/gm, "<hr/>");
    // Blockquote
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
    // Tables (GFM)
    html = parseMarkdownTables(html);
    // Unordered lists
    html = parseMarkdownLists(html);
    // Bold / italic / strikethrough / inline-code
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
    html = html.replace(/`(.+?)`/g, "<code>$1</code>");
    // Links / images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2"/>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Paragraphs (double newline)
    html = html
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        // Already a block element
        if (/^<(h[1-6]|ul|ol|blockquote|pre|hr|table)/i.test(trimmed)) return trimmed;
        // Convert single newlines to <br>
        return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
      })
      .filter(Boolean)
      .join("\n");

    return html;
  }

  function escHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function parseMarkdownTables(html: string): string {
    return html.replace(
      /(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*)/g,
      (tableBlock) => {
        const rows = tableBlock.trim().split("\n");
        const headers = rows[0]
          .split("|")
          .slice(1, -1)
          .map((h) => `<th>${h.trim()}</th>`)
          .join("");
        const bodyRows = rows
          .slice(2)
          .map((r) => {
            const cells = r
              .split("|")
              .slice(1, -1)
              .map((c) => `<td>${c.trim()}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
        return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
      }
    );
  }

  function parseMarkdownLists(html: string): string {
    // Unordered
    html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((l) => `<li>${l.replace(/^- /, "")}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    });
    // Ordered
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block
        .trim()
        .split("\n")
        .map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`)
        .join("");
      return `<ol>${items}</ol>`;
    });
    return html;
  }

  // ── Handle contenteditable input → emit markdown ───────────────────────────
  const handleSmartInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const md = htmlToMarkdown(el.innerHTML);
    lastEmittedValue.current = md;
    onChange(md);
  }, [onChange]);

  const handleSmartFocus = useCallback(() => {
    smartEditorFocused.current = true;
  }, []);

  const handleSmartBlur = useCallback(() => {
    smartEditorFocused.current = false;
  }, []);

  // ── Toolbar actions ────────────────────────────────────────────────────────
  const toolbar = {
    bold: () => execFmt("bold"),
    italic: () => execFmt("italic"),
    strikethrough: () => execFmt("strikethrough"),
    h1: () => execFmt("formatBlock", "<h1>"),
    h2: () => execFmt("formatBlock", "<h2>"),
    h3: () => execFmt("formatBlock", "<h3>"),
    ul: () => execFmt("insertUnorderedList"),
    ol: () => execFmt("insertOrderedList"),
    blockquote: () => {
      const sel = window.getSelection()?.toString() || "quote";
      insertAtCursor(`<blockquote>${sel}</blockquote>`);
    },
    code: () => {
      const sel = window.getSelection()?.toString() || "code";
      insertAtCursor(`<code>${sel}</code>`);
    },
    codeBlock: () => {
      insertAtCursor(
        `<pre><code>// code block</code></pre><p><br></p>`
      );
    },
    hr: () => insertAtCursor(`<hr/><p><br></p>`),
    link: () => {
      const url = prompt("Enter URL:", "https://");
      if (!url) return;
      const sel = window.getSelection()?.toString() || "link";
      execFmt("createLink", url);
    },
    table: () => {
      insertAtCursor(
        `<table>
          <thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead>
          <tbody>
            <tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>
            <tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>
          </tbody>
        </table><p><br></p>`
      );
    },
    undo: () => execFmt("undo"),
    redo: () => execFmt("redo"),
  };

  // ── Mode switch ────────────────────────────────────────────────────────────
  const handleModeSwitch = (newMode: EditorMode) => {
    setMode(newMode); // useEffect on mode handles DOM initialisation
  };

  return (
    <div className="flex flex-col h-full">
      {/*
        Hidden ReactMarkdown render — always in the DOM so its innerHTML is
        ready the moment the Smart Edit canvas mounts. Uses the exact same
        remark/rehype pipeline as the split-mode preview for full GFM support.
      */}
      <div
        ref={hiddenPreviewRef}
        aria-hidden
        className="prose prose-sm dark:prose-invert max-w-none"
        style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", zIndex: -1, width: 0, height: 0, overflow: "hidden" }}
      >
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
          {value || ""}
        </ReactMarkdown>
      </div>
      {/* ── Mode Toggle Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          {/* Split mode pill */}
          <button
            onClick={() => handleModeSwitch("split")}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${mode === "split"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            <PenLine className="h-3.5 w-3.5" />
            Editor / Preview
          </button>

          {/* Smart mode pill */}
          <button
            onClick={() => handleModeSwitch("smart")}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${mode === "smart"
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Smart Edit
          </button>
        </div>

        {mode === "smart" && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-muted-foreground hidden sm:flex items-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Edit live — changes sync to markdown
          </motion.span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ──────────────────── SPLIT MODE ──────────────────────────── */}
        {mode === "split" && (
          <motion.div
            key="split"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden"
          >
            {/* Raw Markdown Textarea */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-border flex flex-col bg-[#1e1e1e]">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                <PenLine className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-white/80">Markdown Source</span>
                <span className="ml-auto text-[10px] text-white/30 font-mono">collaborative</span>
              </div>
              <textarea
                ref={textareaRef}
                defaultValue={value}
                onChange={(e) => {
                  lastEmittedValue.current = e.target.value;
                  onChange(e.target.value);
                }}
                readOnly={readOnly}
                spellCheck={false}
                className="flex-1 w-full resize-none p-4 font-mono text-sm outline-none bg-transparent text-white/90 placeholder-white/20 scrollbar-thin"
                placeholder="# Start writing markdown…"
              />
            </div>

            {/* Live Preview */}
            <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-background">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground/80">Preview</span>
              </div>
              <div className="flex-1 overflow-auto p-4 scrollbar-thin">
                <div className="prose prose-sm dark:prose-invert max-w-none markdown-preview">
                  <ReactMarkdown
                    remarkPlugins={remarkPlugins}
                    rehypePlugins={rehypePlugins}
                  >
                    {value || "*Nothing to preview yet…*"}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ──────────────────── SMART EDIT MODE ────────────────────── */}
        {mode === "smart" && (
          <motion.div
            key="smart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
              {/* History */}
              <ToolbarButton icon={<Undo className="h-3.5 w-3.5" />} label="Undo" onClick={toolbar.undo} />
              <ToolbarButton icon={<Redo className="h-3.5 w-3.5" />} label="Redo" onClick={toolbar.redo} />
              <div className="w-px h-4 bg-border mx-1" />

              {/* Text style */}
              <ToolbarButton icon={<Bold className="h-3.5 w-3.5" />} label="Bold (Ctrl+B)" onClick={toolbar.bold} />
              <ToolbarButton icon={<Italic className="h-3.5 w-3.5" />} label="Italic (Ctrl+I)" onClick={toolbar.italic} />
              <ToolbarButton icon={<Strikethrough className="h-3.5 w-3.5" />} label="Strikethrough" onClick={toolbar.strikethrough} />
              <div className="w-px h-4 bg-border mx-1" />

              {/* Headings */}
              <ToolbarButton icon={<Heading1 className="h-3.5 w-3.5" />} label="Heading 1" onClick={toolbar.h1} />
              <ToolbarButton icon={<Heading2 className="h-3.5 w-3.5" />} label="Heading 2" onClick={toolbar.h2} />
              <ToolbarButton icon={<Heading3 className="h-3.5 w-3.5" />} label="Heading 3" onClick={toolbar.h3} />
              <div className="w-px h-4 bg-border mx-1" />

              {/* Lists */}
              <ToolbarButton icon={<List className="h-3.5 w-3.5" />} label="Bullet List" onClick={toolbar.ul} />
              <ToolbarButton icon={<ListOrdered className="h-3.5 w-3.5" />} label="Numbered List" onClick={toolbar.ol} />
              <div className="w-px h-4 bg-border mx-1" />

              {/* Blocks */}
              <ToolbarButton icon={<Quote className="h-3.5 w-3.5" />} label="Blockquote" onClick={toolbar.blockquote} />
              <ToolbarButton icon={<Code className="h-3.5 w-3.5" />} label="Inline Code" onClick={toolbar.code} />
              <ToolbarButton icon={<Minus className="h-3.5 w-3.5" />} label="Divider" onClick={toolbar.hr} />
              <ToolbarButton icon={<Link className="h-3.5 w-3.5" />} label="Link" onClick={toolbar.link} />
              <ToolbarButton icon={<Table className="h-3.5 w-3.5" />} label="Insert Table" onClick={toolbar.table} />
            </div>

            {/* Contenteditable WYSIWYG canvas */}
            <div className="flex-1 overflow-auto p-1 bg-background">
              <div
                ref={smartEditorCallbackRef}
                contentEditable={!readOnly}
                suppressContentEditableWarning
                onInput={handleSmartInput}
                onFocus={handleSmartFocus}
                onBlur={handleSmartBlur}
                data-placeholder="Start typing… use the toolbar above for rich formatting"
                className="
                  min-h-full p-6 outline-none
                  prose prose-sm dark:prose-invert max-w-none
                  focus:outline-none
                  [&_table]:border-collapse [&_table]:w-full
                  [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left
                  [&_td]:border [&_td]:border-border [&_td]:p-2
                  [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic
                  [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto
                  [&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono
                  [&_pre_code]:bg-transparent [&_pre_code]:p-0
                  [&_a]:text-primary [&_a]:underline
                  [&_hr]:border-border
                  [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
                  [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2
                  [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                  [&_ul]:list-disc [&_ul]:pl-5
                  [&_ol]:list-decimal [&_ol]:pl-5
                  smart-editor-canvas
                "
              />
            </div>

            {/* Live markdown output bar */}
            <div className="border-t border-border bg-[#1e1e1e] h-24 overflow-auto scrollbar-thin">
              <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 bg-[#1e1e1e] border-b border-white/10">
                <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest">Generated Markdown</span>
              </div>
              <pre className="px-3 py-2 text-[11px] font-mono text-white/50 whitespace-pre-wrap break-all">
                {value}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles for the Smart Edit contenteditable canvas */}
      <style>{`
        .smart-editor-canvas:empty::before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        /* Lists — explicit CSS so Tailwind purging can't remove them */
        .smart-editor-canvas ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .smart-editor-canvas ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .smart-editor-canvas li {
          display: list-item !important;
          margin: 0.25rem 0 !important;
        }
        /* Nested lists */
        .smart-editor-canvas ul ul,
        .smart-editor-canvas ol ul { list-style-type: circle !important; }
        .smart-editor-canvas ul ul ul,
        .smart-editor-canvas ol ul ul { list-style-type: square !important; }
        /* Task lists */
        .smart-editor-canvas input[type="checkbox"] {
          margin-right: 0.4rem;
        }
        /* Lists — preview panel */
        .markdown-preview ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .markdown-preview ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .markdown-preview li {
          display: list-item !important;
          margin: 0.25rem 0 !important;
        }
        .markdown-preview ul ul,
        .markdown-preview ol ul { list-style-type: circle !important; }
        .markdown-preview ul ul ul,
        .markdown-preview ol ul ul { list-style-type: square !important; }
        .markdown-preview input[type="checkbox"] { margin-right: 0.4rem; }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
