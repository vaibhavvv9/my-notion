"use client";

import { ArrowLeft, FileText, MoreHorizontal, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/format";
import { useCreateNote, useDeleteNote, useUpdateNote } from "@/lib/hooks";
import type { Note } from "@/lib/types";
import { MarkdownEditor } from "../markdown-editor";
import { Button, ConfirmDialog, EmptyState, IconButton, MenuItem, MenuSeparator, Popover, cn } from "../ui";

function NoteView({ note, onBack }: { note: Note; onBack: () => void }) {
  const update = useUpdateNote();
  const del = useDeleteNote();
  const [title, setTitle] = useState(note.title);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => setTitle(note.title), [note.title]);
  const commitTitle = () => {
    const t = title.trim();
    if (!t) return setTitle(note.title);
    if (t !== note.title) update.mutate({ id: note.id, title: t });
  };
  return (
    <div className="animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="size-3.5" />} onClick={onBack}>
          All notes
        </Button>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-faint">Edited {timeAgo(note.updatedAt)}</span>
          <IconButton label={note.pinned ? "Unpin note" : "Pin note to dashboard"} active={note.pinned} onClick={() => update.mutate({ id: note.id, pinned: !note.pinned })}>
            {note.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </IconButton>
          <IconButton label="Delete note" onClick={() => setConfirm(true)}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        aria-label="Note title"
        maxLength={160}
        className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-faint"
        placeholder="Untitled"
      />
      <MarkdownEditor
        value={note.content}
        startEditing={!note.content}
        minRows={10}
        placeholder="Write your note in Markdown. Code blocks, lists, links and tables all work."
        emptyHint="Empty note. Click to start writing."
        onSave={(content) => update.mutateAsync({ id: note.id, content })}
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this note?"
        message={`“${note.title}” will be permanently deleted.`}
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(note.id, {
            onSuccess: () => {
              setConfirm(false);
              onBack();
            },
          })
        }
      />
    </div>
  );
}

export function NotesPanel({
  topicId,
  notes,
  openId,
  onOpen,
}: {
  topicId: string;
  notes: Note[];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const create = useCreateNote();
  const update = useUpdateNote();
  const del = useDeleteNote();
  const [deleting, setDeleting] = useState<Note | null>(null);
  const open = notes.find((n) => n.id === openId);

  if (open) return <NoteView note={open} onBack={() => onOpen(null)} />;

  const newNote = () =>
    create.mutate(
      { topicId, title: `Note ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, content: "" },
      { onSuccess: (n) => onOpen(n.id) },
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Your own notes, explanations and snippets for this topic.</p>
        <Button size="sm" variant="primary" icon={<Plus className="size-3.5" />} onClick={newNote} loading={create.isPending}>
          New note
        </Button>
      </div>
      {notes.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No notes yet"
          description="Capture explanations in your own words, gotchas you discovered, and code you want to remember."
          action={
            <Button size="sm" variant="primary" onClick={newNote} loading={create.isPending}>
              Write the first note
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id} className="group relative">
              <button
                type="button"
                onClick={() => onOpen(n.id)}
                className="flex h-full w-full flex-col rounded-lg border border-line p-3 text-left transition-colors hover:bg-hover/50"
              >
                <span className="flex items-center gap-1.5 pr-8 font-medium">
                  {n.pinned && <Pin className="size-3.5 shrink-0 text-[var(--amber-fg)]" />}
                  <span className="truncate">{n.title}</span>
                </span>
                <span className={cn("mt-1 line-clamp-2 text-sm", n.content ? "text-muted" : "text-faint")}>
                  {n.content.replace(/[#*_`>]/g, "").slice(0, 200) || "Empty note"}
                </span>
                <span className="mt-2 text-xs text-faint">Edited {timeAgo(n.updatedAt)}</span>
              </button>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                <Popover
                  align="end"
                  trigger={(p) => (
                    <IconButton label="Note options" {...p}>
                      <MoreHorizontal className="size-4" />
                    </IconButton>
                  )}
                >
                  {(close) => (
                    <>
                      <MenuItem
                        icon={n.pinned ? <PinOff /> : <Pin />}
                        onClick={() => {
                          close();
                          update.mutate({ id: n.id, pinned: !n.pinned });
                        }}
                      >
                        {n.pinned ? "Unpin" : "Pin to dashboard"}
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        icon={<Trash2 />}
                        danger
                        onClick={() => {
                          close();
                          setDeleting(n);
                        }}
                      >
                        Delete
                      </MenuItem>
                    </>
                  )}
                </Popover>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this note?"
        message={`“${deleting?.title}” will be permanently deleted.`}
        loading={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
