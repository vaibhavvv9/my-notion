"use client";

import { Bold, Check, Code, Heading2, Italic, Link2, List, ListChecks, ListOrdered, Loader2, SquareCode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "./markdown";
import { AutoTextarea, Button, IconButton, cn } from "./ui";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Notion-style block: renders markdown, click to edit in place.
 * While editing, changes autosave after a short pause. Esc or "Done" exits.
 */
export function MarkdownEditor({
  value,
  onSave,
  placeholder = "Click to add content…",
  emptyHint,
  autosave = true,
  startEditing = false,
  minRows = 4,
  onDone,
}: {
  value: string;
  onSave: (v: string) => Promise<unknown> | void;
  placeholder?: string;
  emptyHint?: string;
  autosave?: boolean;
  startEditing?: boolean;
  minRows?: number;
  onDone?: () => void;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(value);
  const [state, setState] = useState<SaveState>("idle");
  const lastSaved = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  // Sync external changes when not editing
  useEffect(() => {
    if (!editing) {
      setDraft(value);
      lastSaved.current = value;
    }
  }, [value, editing]);

  const save = useCallback(
    async (text: string) => {
      if (text === lastSaved.current) return;
      setState("saving");
      try {
        await onSave(text);
        lastSaved.current = text;
        setState("saved");
      } catch {
        setState("error");
      }
    },
    [onSave],
  );

  useEffect(() => {
    if (!editing || !autosave) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(draft), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, editing, autosave, save]);

  useEffect(() => {
    if (editing) {
      const el = ta.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [editing]);

  const finish = async () => {
    if (timer.current) clearTimeout(timer.current);
    await save(draft);
    setEditing(false);
    setState("idle");
    onDone?.();
  };

  const wrap = (before: string, after = before, placeholderText = "text") => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = draft.slice(s, e) || placeholderText;
    const next = draft.slice(0, s) + before + selected + after + draft.slice(e);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  };

  const prefixLines = (prefix: string | ((i: number) => string)) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const lineStart = draft.lastIndexOf("\n", s - 1) + 1;
    const block = draft.slice(lineStart, e);
    const replaced = block
      .split("\n")
      .map((l, i) => (typeof prefix === "function" ? prefix(i) : prefix) + l)
      .join("\n");
    setDraft(draft.slice(0, lineStart) + replaced + draft.slice(e));
    requestAnimationFrame(() => el.focus());
  };

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button, input")) return;
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target === e.currentTarget) {
            e.preventDefault();
            setEditing(true);
          }
        }}
        className="-mx-2 cursor-text rounded-md px-2 py-1 transition-colors hover:bg-hover/60 focus-visible:bg-hover/60"
        title="Click to edit"
      >
        {value.trim() ? (
          <Markdown>{value}</Markdown>
        ) : (
          <p className="text-[15px] text-faint">{emptyHint ?? placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-lg border border-line-strong bg-elevated focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-soft">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1">
        <IconButton label="Bold (⌘B)" onClick={() => wrap("**")}>
          <Bold className="size-3.5" />
        </IconButton>
        <IconButton label="Italic (⌘I)" onClick={() => wrap("_")}>
          <Italic className="size-3.5" />
        </IconButton>
        <IconButton label="Inline code" onClick={() => wrap("`", "`", "code")}>
          <Code className="size-3.5" />
        </IconButton>
        <IconButton label="Code block" onClick={() => wrap("\n```js\n", "\n```\n", "// code")}>
          <SquareCode className="size-3.5" />
        </IconButton>
        <IconButton label="Link" onClick={() => wrap("[", "](https://)", "link text")}>
          <Link2 className="size-3.5" />
        </IconButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <IconButton label="Heading" onClick={() => prefixLines("### ")}>
          <Heading2 className="size-3.5" />
        </IconButton>
        <IconButton label="Bulleted list" onClick={() => prefixLines("- ")}>
          <List className="size-3.5" />
        </IconButton>
        <IconButton label="Numbered list" onClick={() => prefixLines((i) => `${i + 1}. `)}>
          <ListOrdered className="size-3.5" />
        </IconButton>
        <IconButton label="Checklist" onClick={() => prefixLines("- [ ] ")}>
          <ListChecks className="size-3.5" />
        </IconButton>
        <div className="ml-auto flex items-center gap-2 pr-1">
          <span className={cn("flex items-center gap-1 text-xs", state === "error" ? "text-danger" : "text-faint")}>
            {state === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin" /> Saving
              </>
            )}
            {state === "saved" && (
              <>
                <Check className="size-3" /> Saved
              </>
            )}
            {state === "error" && "Not saved. Retrying on Done"}
          </span>
          <Button size="sm" variant="primary" onClick={finish}>
            Done
          </Button>
        </div>
      </div>
      <AutoTextarea
        ref={ta}
        value={draft}
        minRows={minRows}
        onChange={(e) => {
          setDraft(e.target.value);
          if (state === "saved") setState("idle");
        }}
        onKeyDown={(e) => {
          const mod = e.metaKey || e.ctrlKey;
          if (e.key === "Escape" || (mod && e.key === "Enter")) {
            e.preventDefault();
            finish();
          } else if (mod && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save(draft);
          } else if (mod && e.key.toLowerCase() === "b") {
            e.preventDefault();
            wrap("**");
          } else if (mod && e.key.toLowerCase() === "i") {
            e.preventDefault();
            wrap("_");
          } else if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const s = el.selectionStart;
            setDraft(draft.slice(0, s) + "  " + draft.slice(el.selectionEnd));
            requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
          }
        }}
        placeholder={placeholder}
        className="rounded-none border-0 bg-transparent font-mono text-[13.5px] focus:ring-0"
      />
      <div className="border-t border-line px-3 py-1.5 text-[11px] text-faint">
        Markdown supported · Esc or ⌘↵ to finish · autosaves as you type
      </div>
    </div>
  );
}
