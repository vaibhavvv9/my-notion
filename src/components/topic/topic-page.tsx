"use client";

import {
  BookMarked,
  CalendarClock,
  ChevronRight,
  CircleDot,
  FolderInput,
  Gauge,
  ListTree,
  MoreHorizontal,
  Plus,
  Repeat,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CONFIDENCE_LABELS, SECTION_KEYS, SECTION_META } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { useDeleteTopic, useReviewTopic, useTopic, useUpdateTopic, type TopicPatch } from "@/lib/hooks";
import { api } from "@/lib/api";
import { MoveTopicDialog, TopicDialog } from "../dialogs";
import { EmojiPicker } from "../emoji-picker";
import { MarkdownEditor } from "../markdown-editor";
import { ConfidenceDots, DifficultyPill, DifficultySelect, DueBadge, StatusPill, StatusSelect, TagEditor } from "../topic-bits";
import { Button, ConfirmDialog, EmptyState, ErrorState, IconButton, MenuItem, MenuSeparator, PageSkeleton, Popover, cn } from "../ui";
import { ChecklistPanel } from "./checklist";
import { NotesPanel } from "./notes";
import { QuestionsPanel } from "./questions";
import { ResourcesPanel } from "./resources";

const TABS = ["guide", "questions", "checklist", "notes", "resources", "subtopics"] as const;
type Tab = (typeof TABS)[number];

function Property({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-2 text-sm">
      <div className="flex w-32 shrink-0 items-center gap-2 text-muted sm:w-36 [&>svg]:size-4">
        {icon}
        {label}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function TitleInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setV(value), [value]);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [v]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={v}
      aria-label="Topic title"
      maxLength={160}
      onChange={(e) => setV(e.target.value.replace(/\n/g, ""))}
      onBlur={() => {
        const t = v.trim();
        if (!t) setV(value);
        else if (t !== value) onSave(t);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className="w-full resize-none overflow-hidden bg-transparent text-3xl leading-tight font-bold tracking-tight outline-none placeholder:text-faint sm:text-[40px]"
      placeholder="Untitled"
    />
  );
}

function SummaryInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setV(value), [value]);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [v]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={v}
      onChange={(e) => setV(e.target.value.replace(/\n/g, " "))}
      onBlur={() => v.trim() !== value && onSave(v.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      maxLength={500}
      aria-label="Summary"
      placeholder="Add a one-line summary…"
      className="w-full resize-none overflow-hidden bg-transparent text-[15px] text-muted outline-none placeholder:text-faint"
    />
  );
}

export function TopicPage({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isLoading, error, refetch } = useTopic(id);
  const update = useUpdateTopic();
  const review = useReviewTopic();
  const del = useDeleteTopic();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [moving, setMoving] = useState(false);
  const [addingSub, setAddingSub] = useState(false);

  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "guide";
  const noteId = params.get("note");
  const focusQuestion = params.get("q");

  const setTab = (t: Tab, extra: Record<string, string> = {}) => {
    const sp = new URLSearchParams({ ...(t !== "guide" ? { tab: t } : {}), ...extra });
    const s = sp.toString();
    router.replace(`/topics/${id}${s ? `?${s}` : ""}`, { scroll: false });
  };

  // Record the visit for "recently studied"
  useEffect(() => {
    api.post(`/api/topics/${id}/visit`).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (data) document.title = `${data.topic.title} · Interview Prep`;
  }, [data]);

  if (isLoading) return <PageSkeleton />;
  if (error) {
    const notFound = (error as { status?: number }).status === 404;
    return notFound ? (
      <div className="mx-auto max-w-md px-6 py-24">
        <EmptyState
          icon="🔍"
          title="This topic doesn't exist"
          description="It may have been deleted. Pick another topic from the sidebar."
          action={
            <Link href="/">
              <Button>Back to dashboard</Button>
            </Link>
          }
        />
      </div>
    ) : (
      <ErrorState error={error} onRetry={() => refetch()} />
    );
  }
  if (!data) return null;

  const { topic, track, ancestors, children, questions, checklist, notes, resources } = data;
  const save = (patch: TopicPatch) => update.mutate({ id, ...patch });
  const saveAsync = (patch: TopicPatch) => update.mutateAsync({ id, ...patch });

  const filledSections = SECTION_KEYS.filter((k) => topic.sections[k]?.trim()).length;
  const checklistDone = checklist.filter((c) => c.done).length;

  const tabMeta: Record<Tab, { label: string; count?: string }> = {
    guide: { label: "Study guide", count: `${filledSections}/${SECTION_KEYS.length}` },
    questions: { label: "Interview Q&A", count: String(questions.length) },
    checklist: { label: "Checklist", count: checklist.length ? `${checklistDone}/${checklist.length}` : "0" },
    notes: { label: "My notes", count: String(notes.length) },
    resources: { label: "Resources", count: String(resources.length) },
    subtopics: { label: "Subtopics", count: String(children.length) },
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Top bar: breadcrumbs + actions */}
      <div className="sticky top-0 z-20 flex h-11 items-center justify-between gap-2 bg-bg/90 px-3 backdrop-blur sm:px-4">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted">
          <Link href={`/tracks/${track.id}`} className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 hover:bg-hover hover:text-fg">
            <span>{track.icon}</span>
            <span className="hidden max-w-40 truncate sm:inline">{track.name}</span>
          </Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0 text-faint" />
              <Link href={`/topics/${a.id}`} className="truncate rounded px-1 py-0.5 hover:bg-hover hover:text-fg">
                {a.icon} {a.title}
              </Link>
            </span>
          ))}
          <ChevronRight className="size-3.5 shrink-0 text-faint" />
          <span className="truncate px-1 text-fg">{topic.title}</span>
        </nav>
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="mr-2 hidden text-xs text-faint lg:inline">Edited {timeAgo(topic.updatedAt)}</span>
          <Popover
            align="end"
            trigger={(p) => (
              <Button size="sm" variant="ghost" icon={<Repeat className="size-3.5" />} {...p}>
                <span className="hidden sm:inline">Log revision</span>
              </Button>
            )}
          >
            {(close) => (
              <div className="w-64 p-2">
                <p className="text-sm font-medium">How well do you know this now?</p>
                <p className="mb-2 text-xs text-muted">Lower confidence brings the next review sooner.</p>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        close();
                        review.mutate({ id, confidence: n });
                      }}
                      className="flex flex-col items-center rounded-md border border-line py-1.5 text-sm hover:bg-hover"
                      title={CONFIDENCE_LABELS[n]}
                    >
                      <span className="font-semibold">{n}</span>
                      <span className="text-[10px] text-muted">{CONFIDENCE_LABELS[n]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Popover>
          <IconButton
            label={topic.pinned ? "Remove from favourites" : "Add to favourites"}
            onClick={() => save({ pinned: !topic.pinned })}
            className={cn(topic.pinned && "text-[var(--amber-fg)] hover:text-[var(--amber-fg)]")}
          >
            <Star className={cn("size-4", topic.pinned && "fill-current")} />
          </IconButton>
          <Popover
            align="end"
            trigger={(p) => (
              <IconButton label="More actions" {...p}>
                <MoreHorizontal className="size-4" />
              </IconButton>
            )}
          >
            {(close) => (
              <>
                <MenuItem
                  icon={<Plus />}
                  onClick={() => {
                    close();
                    setAddingSub(true);
                  }}
                >
                  Add subtopic
                </MenuItem>
                <MenuItem
                  icon={<FolderInput />}
                  onClick={() => {
                    close();
                    setMoving(true);
                  }}
                >
                  Move to…
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={<Trash2 />}
                  danger
                  onClick={() => {
                    close();
                    setConfirmDelete(true);
                  }}
                >
                  Delete topic
                </MenuItem>
              </>
            )}
          </Popover>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[860px] px-5 pt-8 sm:px-12 sm:pt-14">
        {/* Header */}
        <EmojiPicker value={topic.icon} onChange={(icon) => save({ icon })} size="lg" />
        <div className="mt-2">
          <TitleInput value={topic.title} onSave={(title) => save({ title })} />
        </div>
        <div className="mt-1">
          <SummaryInput value={topic.summary} onSave={(summary) => save({ summary })} />
        </div>

        {/* Properties */}
        <div className="mt-5 space-y-0.5 border-b border-line pb-5">
          <Property icon={<CircleDot />} label="Status">
            <StatusSelect value={topic.status} onChange={(status) => save({ status })} />
          </Property>
          <Property icon={<Gauge />} label="Difficulty">
            <DifficultySelect value={topic.difficulty} onChange={(difficulty) => save({ difficulty })} />
          </Property>
          <Property icon={<Tag />} label="Tags">
            <TagEditor tags={topic.tags} onChange={(tags) => save({ tags })} />
          </Property>
          <Property icon={<BookMarked />} label="Confidence">
            <div className="px-1">
              <ConfidenceDots value={topic.confidence} onChange={(confidence) => review.mutate({ id, confidence })} />
            </div>
          </Property>
          <Property icon={<CalendarClock />} label="Next review">
            <span className="px-1">
              <DueBadge ts={topic.nextReviewAt} />
            </span>
            {topic.reviewCount > 0 && <span className="text-xs text-faint">Revised {topic.reviewCount}×</span>}
            {topic.nextReviewAt && (
              <button type="button" className="text-xs text-faint hover:text-muted hover:underline" onClick={() => save({ nextReviewAt: null })}>
                Clear
              </button>
            )}
          </Property>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Topic sections" className="sticky top-11 z-10 -mx-1 mt-4 flex gap-0.5 overflow-x-auto border-b border-line bg-bg/95 px-1 backdrop-blur">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "relative flex h-10 shrink-0 items-center gap-1.5 px-2.5 text-sm transition-colors",
                tab === t ? "font-medium text-fg" : "text-muted hover:text-fg",
              )}
            >
              {tabMeta[t].label}
              <span className="rounded bg-hover px-1 text-[11px] tabular-nums text-muted">{tabMeta[t].count}</span>
              {tab === t && <span className="absolute inset-x-1.5 -bottom-px h-0.5 rounded-full bg-fg" />}
            </button>
          ))}
        </div>

        <div className="pt-6" role="tabpanel">
          {tab === "guide" && (
            <div className="space-y-8">
              {SECTION_KEYS.map((key) => (
                <section key={key} aria-labelledby={`sec-${key}`}>
                  <h2 id={`sec-${key}`} className="mb-2 flex items-center gap-2 text-lg font-semibold">
                    <span>{SECTION_META[key].emoji}</span>
                    {SECTION_META[key].label}
                  </h2>
                  <MarkdownEditor
                    key={`${id}-${key}`}
                    value={topic.sections[key] ?? ""}
                    placeholder={SECTION_META[key].placeholder}
                    emptyHint={`${SECTION_META[key].placeholder} Click to write.`}
                    onSave={(v) => saveAsync({ sections: { [key]: v } })}
                  />
                </section>
              ))}
              <div className="flex flex-wrap gap-2 rounded-lg bg-subtle p-4 text-sm text-muted">
                <span>Continue with</span>
                <button className="font-medium text-fg underline-offset-2 hover:underline" onClick={() => setTab("questions")}>
                  {questions.length} interview questions
                </button>
                <span>·</span>
                <button className="font-medium text-fg underline-offset-2 hover:underline" onClick={() => setTab("checklist")}>
                  the prep checklist
                </button>
                <span>·</span>
                <button className="font-medium text-fg underline-offset-2 hover:underline" onClick={() => setTab("resources")}>
                  resources
                </button>
              </div>
            </div>
          )}
          {tab === "questions" && <QuestionsPanel topicId={id} questions={questions} focusId={focusQuestion} />}
          {tab === "checklist" && <ChecklistPanel topicId={id} items={checklist} />}
          {tab === "notes" && (
            <NotesPanel topicId={id} notes={notes} openId={noteId} onOpen={(nid) => setTab("notes", nid ? { note: nid } : {})} />
          )}
          {tab === "resources" && <ResourcesPanel topicId={id} resources={resources} />}
          {tab === "subtopics" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">Break big topics into focused pages.</p>
                <Button size="sm" variant="primary" icon={<Plus className="size-3.5" />} onClick={() => setAddingSub(true)}>
                  Add subtopic
                </Button>
              </div>
              {children.length === 0 ? (
                <EmptyState icon={<ListTree />} title="No subtopics" description="Nest topics as deep as you like, e.g. React → Hooks → useEffect." />
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {children.map((c) => (
                    <li key={c.id}>
                      <Link href={`/topics/${c.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-hover/50">
                        <span className="w-5 text-center">{c.icon || "📄"}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{c.title}</span>
                          {c.summary && <span className="block truncate text-xs text-muted">{c.summary}</span>}
                        </span>
                        <span className="hidden sm:inline-flex">
                          <DifficultyPill difficulty={c.difficulty} />
                        </span>
                        <StatusPill status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <TopicDialog open={addingSub} onClose={() => setAddingSub(false)} trackId={topic.trackId} parentId={topic.id} />
      <MoveTopicDialog open={moving} onClose={() => setMoving(false)} topic={topic} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${topic.title}”?`}
        message={
          children.length
            ? "This topic, its subtopics and all their notes, questions and checklists will be permanently deleted."
            : "This topic and all its notes, questions and checklist items will be permanently deleted."
        }
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(id, {
            onSuccess: () => {
              setConfirmDelete(false);
              router.push(topic.parentId ? `/topics/${topic.parentId}` : `/tracks/${topic.trackId}`);
            },
          })
        }
      />
    </div>
  );
}
