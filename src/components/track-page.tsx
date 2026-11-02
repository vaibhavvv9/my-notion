"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, HelpCircle, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_META, STATUSES, STATUS_META } from "@/lib/constants";
import { useDeleteTrack, useReorderTopics, useTopics, useTree, useUpdateTopic, useUpdateTrack } from "@/lib/hooks";
import type { TopicListItem } from "@/lib/types";
import { TopicDialog, TrackDialog } from "./dialogs";
import { EmojiPicker } from "./emoji-picker";
import { DifficultyPill, StatusSelect } from "./topic-bits";
import { Button, ConfirmDialog, EmptyState, ErrorState, IconButton, Input, MenuItem, MenuSeparator, PageSkeleton, Pill, Popover, Select, cn } from "./ui";

function Row({
  t,
  depth,
  childCount,
  open,
  onToggle,
  sortable,
}: {
  t: TopicListItem;
  depth: number;
  childCount: number;
  open: boolean;
  onToggle: () => void;
  sortable: boolean;
}) {
  const update = useUpdateTopic();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id, disabled: !sortable });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 border-b border-line bg-bg py-2 pr-2 transition-colors hover:bg-hover/50",
        isDragging && "relative z-10 shadow-pop",
      )}
    >
      <div style={{ width: depth * 20 }} className="shrink-0" />
      {sortable ? (
        <button
          type="button"
          aria-label={`Reorder ${t.title}`}
          className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-faint opacity-0 group-hover:opacity-100 focus:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      ) : (
        <span className="w-5 shrink-0" />
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Collapse subtopics" : "Expand subtopics"}
        className={cn("flex size-5 shrink-0 items-center justify-center rounded text-faint hover:bg-active", !childCount && "invisible")}
      >
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
      </button>
      <Link href={`/topics/${t.id}`} className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-5 shrink-0 text-center">{t.icon || "📄"}</span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium">{t.title}</span>
          {t.summary && <span className="hidden truncate text-xs text-muted sm:block">{t.summary}</span>}
        </span>
      </Link>
      <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
        {t.tags.slice(0, 2).map((tag) => (
          <Pill key={tag} tone="purple">
            {tag}
          </Pill>
        ))}
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-xs text-faint md:flex" title="Interview questions">
        <HelpCircle className="size-3.5" />
        {t.questionCount}
      </span>
      <span className="hidden shrink-0 sm:inline-flex">
        <DifficultyPill difficulty={t.difficulty} />
      </span>
      <StatusSelect align="end" value={t.status} onChange={(status) => update.mutate({ id: t.id, status })} />
    </div>
  );
}

export function TrackPage({ id }: { id: string }) {
  const router = useRouter();
  const tree = useTree();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const topicsQ = useTopics({ trackId: id });
  const reorder = useReorderTopics();
  const updateTrack = useUpdateTrack();
  const delTrack = useDeleteTrack();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [order, setOrder] = useState<Record<string, string[]>>({});

  const track = tree.data?.tracks.find((t) => t.id === id);
  const all = useMemo(() => topicsQ.data ?? [], [topicsQ.data]);

  useEffect(() => setOrder({}), [topicsQ.data]);
  useEffect(() => {
    if (track) document.title = `${track.name} · Interview Prep`;
  }, [track]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtering = !!(q || status || difficulty);
  const byParent = useMemo(() => {
    const m = new Map<string | null, TopicListItem[]>();
    for (const t of all) {
      const list = m.get(t.parentId) ?? [];
      list.push(t);
      m.set(t.parentId, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.position - b.position);
    return m;
  }, [all]);

  const siblings = (parentId: string | null) => {
    const list = byParent.get(parentId) ?? [];
    const o = order[parentId ?? "root"];
    if (!o) return list;
    const map = new Map(list.map((t) => [t.id, t]));
    return o.map((i) => map.get(i)!).filter(Boolean);
  };
  const roots = siblings(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return all.filter(
      (t) =>
        (!term || t.title.toLowerCase().includes(term) || t.summary.toLowerCase().includes(term) || t.tags.some((x) => x.includes(term))) &&
        (!status || t.status === status) &&
        (!difficulty || t.difficulty === difficulty),
    );
  }, [all, q, status, difficulty]);

  if (tree.isLoading || topicsQ.isLoading) return <PageSkeleton />;
  if (tree.error || topicsQ.error) return <ErrorState error={tree.error ?? topicsQ.error} onRetry={() => (tree.refetch(), topicsQ.refetch())} />;
  if (!track)
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <EmptyState icon="🔍" title="Track not found" description="It may have been deleted." action={<Link href="/"><Button>Back to dashboard</Button></Link>} />
      </div>
    );

  const counts = { total: all.length, completed: 0, in_progress: 0, not_started: 0 };
  all.forEach((t) => counts[t.status]++);
  const pct = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const dragged = all.find((t) => t.id === active.id);
    const target = all.find((t) => t.id === over.id);
    // Only reorder within the same parent; use "Move to…" to change parents.
    if (!dragged || !target || dragged.parentId !== target.parentId) return;
    const ids = siblings(dragged.parentId).map((r) => r.id);
    const next = arrayMove(ids, ids.indexOf(dragged.id), ids.indexOf(target.id));
    setOrder((o) => ({ ...o, [dragged.parentId ?? "root"]: next }));
    reorder.mutate(next);
  };

  const renderTree = (list: TopicListItem[], depth: number): React.ReactNode => (
    <SortableContext items={list.map((r) => r.id)} strategy={verticalListSortingStrategy}>
      {list.map((t) => {
        const kids = siblings(t.id);
        const open = expanded[t.id] ?? false;
        return (
          <div key={t.id}>
            <Row t={t} depth={depth} childCount={kids.length} open={open} onToggle={() => setExpanded((e) => ({ ...e, [t.id]: !open }))} sortable />
            {open && kids.length > 0 && <div>{renderTree(kids, depth + 1)}</div>}
          </div>
        );
      })}
    </SortableContext>
  );

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <EmojiPicker value={track.icon} onChange={(icon) => updateTrack.mutate({ id, icon })} size="lg" allowClear={false} />
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{track.name}</h1>
          {track.description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{track.description}</p>}
        </div>
        <Popover
          align="end"
          trigger={(p) => (
            <IconButton label="Track options" {...p}>
              <MoreHorizontal className="size-4" />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuItem
                icon={<Pencil />}
                onClick={() => {
                  close();
                  setEditing(true);
                }}
              >
                Edit name & description
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<Trash2 />}
                danger
                onClick={() => {
                  close();
                  setConfirm(true);
                }}
              >
                Delete track
              </MenuItem>
            </>
          )}
        </Popover>
      </div>

      {/* Progress */}
      <div className="mt-6 rounded-xl border border-line p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium">
            {pct}% complete <span className="font-normal text-muted">· {counts.completed} of {counts.total} topics</span>
          </span>
          <span className="flex gap-3 text-xs text-muted">
            <span>{counts.in_progress} in progress</span>
            <span>{counts.not_started} not started</span>
          </span>
        </div>
        <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-hover">
          <div className="bg-[var(--green-fg)] transition-[width] duration-500" style={{ width: `${counts.total ? (counts.completed / counts.total) * 100 : 0}%` }} />
          <div className="bg-[var(--blue-fg)] opacity-70 transition-[width] duration-500" style={{ width: `${counts.total ? (counts.in_progress / counts.total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter topics…" className="pl-8" aria-label="Filter topics" />
        </div>
        <Select label="Status" value={status} onChange={setStatus} options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]} />
        <Select
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[{ value: "", label: "All levels" }, ...DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))]}
        />
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          New topic
        </Button>
      </div>

      <div className="mt-4 border-t border-line">
        {all.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon="🗂️"
            title="No topics in this track yet"
            description="Add your first topic to start building your roadmap."
            action={
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                Add a topic
              </Button>
            }
          />
        ) : filtering ? (
          filtered.length ? (
            filtered.map((t) => <Row key={t.id} t={t} depth={0} childCount={0} open={false} onToggle={() => {}} sortable={false} />)
          ) : (
            <p className="py-10 text-center text-sm text-muted">No topics match these filters.</p>
          )
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            {renderTree(roots, 0)}
          </DndContext>
        )}
      </div>
      {!filtering && all.length > 1 && <p className="mt-3 text-xs text-faint">Drag the handle to reorder topics within the same level. Use “Move to…” on a topic page to change its parent.</p>}

      <TopicDialog open={creating} onClose={() => setCreating(false)} trackId={id} parentId={null} />
      <TrackDialog open={editing} onClose={() => setEditing(false)} track={track} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Delete “${track.name}”?`}
        message="This permanently deletes the track and every topic, note, question and checklist inside it."
        loading={delTrack.isPending}
        onConfirm={() => delTrack.mutate(id, { onSuccess: () => router.push("/") })}
      />
    </div>
  );
}
