"use client";

import { Command } from "cmdk";
import { BookOpenCheck, FileText, HelpCircle, LayoutDashboard, Library, Repeat, Search, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearch, useTree } from "@/lib/hooks";
import { Spinner } from "./ui";

const PAGES = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics", label: "All topics", icon: Library },
  { href: "/practice", label: "Practice questions", icon: BookOpenCheck },
  { href: "/review", label: "Revision queue", icon: Repeat },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const itemCls =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm aria-selected:bg-hover data-[selected=true]:bg-hover";
const groupCls = "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faint";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const debounced = useDebounced(q, 150);
  const search = useSearch(debounced);
  const tree = useTree();

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const term = q.trim().toLowerCase();
  const pages = PAGES.filter((p) => !term || p.label.toLowerCase().includes(term));
  const tracks = (tree.data?.tracks ?? []).filter((t) => !term || t.name.toLowerCase().includes(term));
  const r = term ? search.data : undefined;
  const nothing = term && !search.isFetching && r && !r.topics.length && !r.notes.length && !r.questions.length && !pages.length && !tracks.length;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-start justify-center bg-black/40 p-4 pt-[12vh] animate-fade-in" onMouseDown={onClose}>
      <Command
        shouldFilter={false}
        label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl animate-pop-in overflow-hidden rounded-xl bg-elevated shadow-pop"
      >
        <div className="flex items-center gap-2 border-b border-line px-3.5">
          <Search className="size-4 text-muted" />
          <Command.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder="Search topics, notes and questions…"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          {search.isFetching && <Spinner />}
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-1.5">
          {nothing && <div className="px-3 py-8 text-center text-sm text-muted">No results for “{q}”</div>}

          {r && r.topics.length > 0 && (
            <Command.Group heading="Topics" className={groupCls}>
              {r.topics.map((t) => (
                <Command.Item key={t.id} value={`topic-${t.id}`} onSelect={() => go(`/topics/${t.id}`)} className={itemCls}>
                  <span className="w-5 text-center">{t.icon || "📄"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.title}</div>
                    {t.snippet && <div className="truncate text-xs text-muted">{t.snippet}</div>}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {r && r.questions.length > 0 && (
            <Command.Group heading="Interview questions" className={groupCls}>
              {r.questions.map((x) => (
                <Command.Item key={x.id} value={`q-${x.id}`} onSelect={() => go(`/topics/${x.topicId}?tab=questions&q=${x.id}`)} className={itemCls}>
                  <HelpCircle className="size-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{x.question}</div>
                    <div className="truncate text-xs text-muted">{x.topicTitle}</div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {r && r.notes.length > 0 && (
            <Command.Group heading="Notes" className={groupCls}>
              {r.notes.map((n) => (
                <Command.Item key={n.id} value={`n-${n.id}`} onSelect={() => go(`/topics/${n.topicId}?tab=notes&note=${n.id}`)} className={itemCls}>
                  <FileText className="size-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{n.title}</div>
                    <div className="truncate text-xs text-muted">
                      {n.topicTitle}
                      {n.snippet ? ` · ${n.snippet}` : ""}
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {tracks.length > 0 && (
            <Command.Group heading="Tracks" className={groupCls}>
              {tracks.map((t) => (
                <Command.Item key={t.id} value={`track-${t.id}`} onSelect={() => go(`/tracks/${t.id}`)} className={itemCls}>
                  <span className="w-5 text-center">{t.icon}</span>
                  {t.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {pages.length > 0 && (
            <Command.Group heading="Go to" className={groupCls}>
              {pages.map(({ href, label, icon: Icon }) => (
                <Command.Item key={href} value={`page-${href}`} onSelect={() => go(href)} className={itemCls}>
                  <Icon className="size-4 text-muted" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
        <div className="flex items-center gap-3 border-t border-line px-3.5 py-2 text-xs text-faint">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </Command>
    </div>,
    document.body,
  );
}
