"use client";

import { BookOpen, ExternalLink, FileCode2, GraduationCap, FolderGit2, Link2, Newspaper, Pencil, Plus, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { RESOURCE_KINDS, RESOURCE_KIND_LABEL, type ResourceKind } from "@/lib/constants";
import { useCreateResource, useDeleteResource, useUpdateResource } from "@/lib/hooks";
import type { Resource } from "@/lib/types";
import { Button, EmptyState, IconButton, Input, Select } from "../ui";

const KIND_ICON: Record<ResourceKind, React.ComponentType<{ className?: string }>> = {
  article: Newspaper,
  docs: FileCode2,
  video: Video,
  course: GraduationCap,
  book: BookOpen,
  repo: FolderGit2,
  other: Link2,
};

function ResourceForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Resource;
  onSubmit: (v: { title: string; url: string; kind: ResourceKind }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [kind, setKind] = useState<ResourceKind>(initial?.kind ?? "article");
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-line-strong bg-subtle p-3 animate-fade-in sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        let u = url.trim();
        if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
        try {
          new URL(u);
        } catch {
          return setError("Enter a valid URL");
        }
        if (!title.trim()) return setError("Add a title");
        onSubmit({ title: title.trim(), url: u, kind });
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Link title" className="sm:w-56" maxLength={200} />
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" aria-label="URL" className="sm:flex-1" />
      <Select label="Type" value={kind} onChange={(v) => setKind(v as ResourceKind)} options={RESOURCE_KINDS.map((k) => ({ value: k, label: RESOURCE_KIND_LABEL[k] }))} />
      <div className="flex gap-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Save
        </Button>
      </div>
      {error && <p className="text-sm text-danger sm:hidden">{error}</p>}
      {error && <p className="hidden text-sm text-danger sm:block">{error}</p>}
    </form>
  );
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ResourcesPanel({ topicId, resources }: { topicId: string; resources: Resource[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const create = useCreateResource();
  const update = useUpdateResource();
  const del = useDeleteResource();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Docs, articles and videos worth revisiting.</p>
        <Button size="sm" variant="primary" icon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>
          Add link
        </Button>
      </div>
      {adding && (
        <ResourceForm
          loading={create.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={(v) => create.mutate({ topicId, ...v }, { onSuccess: () => setAdding(false) })}
        />
      )}
      {resources.length === 0 && !adding ? (
        <EmptyState icon="🔗" title="No resources yet" description="Save the best links you find so you don't have to search again." />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {resources.map((r) => {
            const Icon = KIND_ICON[r.kind];
            if (editing === r.id)
              return (
                <li key={r.id} className="p-2">
                  <ResourceForm
                    initial={r}
                    loading={update.isPending}
                    onCancel={() => setEditing(null)}
                    onSubmit={(v) => update.mutate({ id: r.id, ...v }, { onSuccess: () => setEditing(null) })}
                  />
                </li>
              );
            return (
              <li key={r.id} className="group flex items-center gap-3 px-3 py-2.5 hover:bg-hover/50">
                <Icon className="size-4 shrink-0 text-muted" />
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] hover:underline">{r.title}</span>
                  <span className="block truncate text-xs text-faint">
                    {RESOURCE_KIND_LABEL[r.kind]} · {host(r.url)}
                  </span>
                </a>
                <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label="Open link" className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-hover">
                    <ExternalLink className="size-3.5" />
                  </a>
                  <IconButton label="Edit link" onClick={() => setEditing(r.id)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton label="Delete link" onClick={() => del.mutate(r.id)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
