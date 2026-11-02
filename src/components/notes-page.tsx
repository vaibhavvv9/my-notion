"use client";

import { FileText, Pin, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";
import { useNotes, useTree } from "@/lib/hooks";
import { Button, EmptyState, ErrorState, Input, Select, Skeleton } from "./ui";

export function NotesPage() {
  const tree = useTree();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [trackId, setTrackId] = useState("");
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isLoading, error, refetch } = useNotes({ q: debounced || undefined, trackId: trackId || undefined, pinned: pinned || undefined });

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
      <p className="mt-1 text-[15px] text-muted">Every note you&apos;ve written, across all topics.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="pl-8" aria-label="Search notes" />
        </div>
        <Select
          label="Track"
          value={trackId}
          onChange={setTrackId}
          options={[{ value: "", label: "All tracks" }, ...(tree.data?.tracks ?? []).map((t) => ({ value: t.id, label: `${t.icon} ${t.name}` }))]}
        />
        <Button variant={pinned ? "primary" : "secondary"} icon={<Pin className="size-3.5" />} onClick={() => setPinned(!pinned)} aria-pressed={pinned}>
          Pinned
        </Button>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : !data?.length ? (
          <EmptyState
            icon={<FileText />}
            title={debounced || trackId || pinned ? "No notes match" : "No notes yet"}
            description={
              debounced || trackId || pinned
                ? "Try a different search or filter."
                : "Open any topic, switch to the “My notes” tab and write your first note in your own words."
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/topics/${n.topicId}?tab=notes&note=${n.id}`}
                  className="flex h-full flex-col rounded-lg border border-line p-4 transition-colors hover:bg-hover/50"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {n.pinned && <Pin className="size-3.5 shrink-0 text-[var(--amber-fg)]" />}
                    <span className="truncate">{n.title}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-3 flex-1 text-sm text-muted">{n.content.replace(/[#*_`>]/g, "").slice(0, 240) || "Empty note"}</span>
                  <span className="mt-3 flex items-center justify-between gap-2 text-xs text-faint">
                    <span className="truncate">
                      {n.topicIcon} {n.topicTitle}
                    </span>
                    <span className="shrink-0">{timeAgo(n.updatedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
