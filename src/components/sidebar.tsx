"use client";

import {
  BookOpenCheck,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Library,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat,
  Search,
  Settings,
  Sun,
  Monitor,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDeleteTrack, useReorderTracks, useTree } from "@/lib/hooks";
import type { Track, TreeTopic } from "@/lib/types";
import { useLocalStorage } from "@/lib/use-local-storage";
import { TopicDialog, TrackDialog } from "./dialogs";
import { useTheme } from "./theme";
import { ConfirmDialog, IconButton, Kbd, MenuItem, MenuSeparator, Popover, Skeleton, cn } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics", label: "All topics", icon: Library },
  { href: "/practice", label: "Practice", icon: BookOpenCheck },
  { href: "/review", label: "Revision", icon: Repeat },
  { href: "/notes", label: "Notes", icon: FileText },
];

const STATUS_DOT: Record<TreeTopic["status"], string> = {
  not_started: "border border-[var(--fg-faint)]",
  in_progress: "bg-[var(--blue-fg)]",
  completed: "bg-[var(--green-fg)]",
};

export function Sidebar({ onSearch, onNavigate }: { onSearch: () => void; onNavigate?: () => void }) {
  const pathname = usePathname();
  const tree = useTree();
  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>("sidebar-expanded", {});
  const [trackDialog, setTrackDialog] = useState<{ open: boolean; track?: Track }>({ open: false });
  const [topicDialog, setTopicDialog] = useState<{ open: boolean; trackId?: string; parentId?: string | null }>({ open: false });
  const [deleting, setDeleting] = useState<Track | null>(null);
  const del = useDeleteTrack();
  const reorderTracks = useReorderTracks();
  const router = useRouter();
  const moveTrack = (id: string, dir: -1 | 1) => {
    const ids = (tree.data?.tracks ?? []).map((t) => t.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderTracks.mutate(ids);
  };

  const childrenOf = useMemo(() => {
    const m = new Map<string, TreeTopic[]>();
    for (const t of tree.data?.topics ?? []) {
      const key = t.parentId ?? `track:${t.trackId}`;
      const list = m.get(key) ?? [];
      list.push(t);
      m.set(key, list);
    }
    return m;
  }, [tree.data]);

  const toggle = (key: string, def = false) => setExpanded((e) => ({ ...e, [key]: !(e[key] ?? def) }));
  const isOpen = (key: string, def = false) => expanded[key] ?? def;

  const renderTopic = (t: TreeTopic, depth: number) => {
    const kids = childrenOf.get(t.id) ?? [];
    const open = isOpen(t.id);
    const active = pathname === `/topics/${t.id}`;
    return (
      <li key={t.id}>
        <div
          className={cn(
            "group flex h-7 items-center gap-1 rounded-md pr-1 text-sm transition-colors hover:bg-hover",
            active ? "bg-active font-medium text-fg" : "text-[var(--fg)]/80",
          )}
          style={{ paddingLeft: 4 + depth * 14 }}
        >
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={() => toggle(t.id)}
            className={cn("flex size-5 shrink-0 items-center justify-center rounded text-faint hover:bg-active", !kids.length && "invisible")}
          >
            <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
          </button>
          <Link href={`/topics/${t.id}`} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-1.5 py-1">
            <span className="w-4 shrink-0 text-center text-[13px]">{t.icon || "📄"}</span>
            <span className="truncate">{t.title}</span>
          </Link>
          <span className={cn("size-2 shrink-0 rounded-full group-hover:hidden", STATUS_DOT[t.status])} title={t.status.replace("_", " ")} />
          <button
            type="button"
            aria-label={`Add subtopic to ${t.title}`}
            title="Add subtopic"
            onClick={() => {
              setTopicDialog({ open: true, trackId: t.trackId, parentId: t.id });
              setExpanded((e) => ({ ...e, [t.id]: true }));
            }}
            className="hidden size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-active group-hover:flex"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        {open && kids.length > 0 && <ul>{kids.map((k) => renderTopic(k, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="flex size-6 items-center justify-center rounded bg-fg text-[13px] font-bold text-bg">IP</div>
        <span className="truncate text-sm font-semibold">Interview Prep</span>
      </div>

      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm text-muted transition-colors hover:bg-hover"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search</span>
          <Kbd>⌘K</Kbd>
        </button>
        <nav className="mt-0.5 space-y-px">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href) && !pathname.startsWith("/topics/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex h-7 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-hover",
                  active ? "bg-active font-medium text-fg" : "text-muted",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <div className="group/h flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-medium text-faint">Learning tracks</span>
          <IconButton label="New track" className="size-5 opacity-0 group-hover/h:opacity-100 focus:opacity-100" onClick={() => setTrackDialog({ open: true })}>
            <Plus className="size-3.5" />
          </IconButton>
        </div>

        {tree.isLoading && (
          <div className="space-y-1.5 px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-5" />
            ))}
          </div>
        )}
        {tree.isError && (
          <p className="px-2 text-xs text-danger">
            Couldn&apos;t load tracks.{" "}
            <button className="underline" onClick={() => tree.refetch()}>
              Retry
            </button>
          </p>
        )}

        <ul className="space-y-px">
          {tree.data?.tracks.map((track, tIndex) => {
            const key = `track:${track.id}`;
            const open = isOpen(key, true);
            const topics = childrenOf.get(key) ?? [];
            const active = pathname === `/tracks/${track.id}`;
            return (
              <li key={track.id}>
                <div
                  className={cn(
                    "group flex h-7 items-center gap-1 rounded-md pr-1 text-sm transition-colors hover:bg-hover",
                    active ? "bg-active font-medium" : "",
                  )}
                >
                  <button
                    type="button"
                    aria-label={open ? `Collapse ${track.name}` : `Expand ${track.name}`}
                    onClick={() => toggle(key, true)}
                    className="flex size-5 shrink-0 items-center justify-center rounded text-faint hover:bg-active"
                  >
                    <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
                  </button>
                  <Link href={`/tracks/${track.id}`} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-1.5 py-1 font-medium">
                    <span className="w-4 shrink-0 text-center text-[13px]">{track.icon}</span>
                    <span className="truncate">{track.name}</span>
                  </Link>
                  <div className="hidden items-center group-hover:flex group-focus-within:flex">
                    <Popover
                      align="end"
                      trigger={(p) => (
                        <IconButton label={`${track.name} options`} className="size-5" {...p}>
                          <MoreHorizontal className="size-3.5" />
                        </IconButton>
                      )}
                    >
                      {(close) => (
                        <>
                          <MenuItem
                            icon={<Pencil />}
                            onClick={() => {
                              close();
                              setTrackDialog({ open: true, track });
                            }}
                          >
                            Edit track
                          </MenuItem>
                          <MenuItem
                            icon={<Plus />}
                            onClick={() => {
                              close();
                              setTopicDialog({ open: true, trackId: track.id, parentId: null });
                            }}
                          >
                            Add topic
                          </MenuItem>
                          {tIndex > 0 && (
                            <MenuItem
                              icon={<ArrowUp />}
                              onClick={() => {
                                close();
                                moveTrack(track.id, -1);
                              }}
                            >
                              Move up
                            </MenuItem>
                          )}
                          {tIndex < (tree.data?.tracks.length ?? 0) - 1 && (
                            <MenuItem
                              icon={<ArrowDown />}
                              onClick={() => {
                                close();
                                moveTrack(track.id, 1);
                              }}
                            >
                              Move down
                            </MenuItem>
                          )}
                          <MenuSeparator />
                          <MenuItem
                            danger
                            icon={<Trash2 />}
                            onClick={() => {
                              close();
                              setDeleting(track);
                            }}
                          >
                            Delete track
                          </MenuItem>
                        </>
                      )}
                    </Popover>
                    <IconButton
                      label={`Add topic to ${track.name}`}
                      className="size-5"
                      onClick={() => setTopicDialog({ open: true, trackId: track.id, parentId: null })}
                    >
                      <Plus className="size-3.5" />
                    </IconButton>
                  </div>
                </div>
                {open && (
                  <ul className="space-y-px">
                    {topics.map((t) => renderTopic(t, 1))}
                    {topics.length === 0 && <li className="py-1 pl-9 text-xs text-faint">No topics yet</li>}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => setTrackDialog({ open: true })}
          className="mt-1 flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm text-muted transition-colors hover:bg-hover"
        >
          <Plus className="size-4" />
          New track
        </button>
      </div>

      <SidebarFooter onNavigate={onNavigate} />

      <TrackDialog open={trackDialog.open} track={trackDialog.track} onClose={() => setTrackDialog({ open: false })} />
      <TopicDialog
        open={topicDialog.open}
        trackId={topicDialog.trackId}
        parentId={topicDialog.parentId}
        onClose={() => setTopicDialog({ open: false })}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        message="This permanently deletes the track and every topic, note, question and checklist inside it."
        loading={del.isPending}
        onConfirm={() =>
          deleting &&
          del.mutate(deleting.id, {
            onSuccess: () => {
              if (pathname === `/tracks/${deleting.id}`) router.push("/");
              setDeleting(null);
            },
          })
        }
      />
    </div>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <div className="flex items-center gap-1 border-t border-line px-2 py-2">
      <Link
        href="/settings"
        onClick={onNavigate}
        className={cn(
          "flex h-7 flex-1 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-hover",
          pathname === "/settings" ? "bg-active text-fg" : "text-muted",
        )}
      >
        <Settings className="size-4" />
        Settings
      </Link>
      <IconButton label={`Theme: ${theme}. Switch to ${next}`} onClick={() => setTheme(next)}>
        <Icon className="size-4" />
      </IconButton>
    </div>
  );
}
