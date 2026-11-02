"use client";

import { ChevronRight, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_META, QUESTION_STATUSES, QUESTION_STATUS_META, type Difficulty } from "@/lib/constants";
import { useCreateQuestion, useDeleteQuestion, useUpdateQuestion } from "@/lib/hooks";
import type { Question } from "@/lib/types";
import { Markdown } from "../markdown";
import { DifficultyPill } from "../topic-bits";
import { AutoTextarea, Button, ConfirmDialog, EmptyState, Field, IconButton, Input, MenuItem, MenuSeparator, Pill, Popover, Select, cn } from "../ui";

function QuestionForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  initial?: Partial<Question>;
  onSubmit: (v: { question: string; answer: string; followUps: string; difficulty: Difficulty }) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel: string;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [followUps, setFollowUps] = useState(initial?.followUps ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "intermediate");
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-3 rounded-lg border border-line-strong bg-subtle p-4 animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        if (!question.trim()) return setError("Write the question first");
        onSubmit({ question: question.trim(), answer, followUps, difficulty });
      }}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <Field label="Question">
        <Input autoFocus value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Explain the virtual DOM" maxLength={1000} />
      </Field>
      <Field label="Model answer" hint="Markdown supported. Write it the way you'd say it in the interview.">
        <AutoTextarea value={answer} onChange={(e) => setAnswer(e.target.value)} minRows={4} className="font-mono text-[13px]" />
      </Field>
      <Field label="Likely follow-up questions" hint="One per line, e.g. '- How does reconciliation work?'">
        <AutoTextarea value={followUps} onChange={(e) => setFollowUps(e.target.value)} minRows={2} className="font-mono text-[13px]" />
      </Field>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Difficulty">
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(v) => setDifficulty(v as Difficulty)}
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}

function QuestionCard({ q, index, defaultOpen }: { q: Question; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const update = useUpdateQuestion();
  const del = useDeleteQuestion();

  useEffect(() => {
    if (defaultOpen) document.getElementById(`q-${q.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [defaultOpen, q.id]);

  if (editing) {
    return (
      <QuestionForm
        initial={q}
        submitLabel="Save question"
        loading={update.isPending}
        onCancel={() => setEditing(false)}
        onSubmit={(v) => update.mutate({ id: q.id, ...v }, { onSuccess: () => setEditing(false) })}
      />
    );
  }

  return (
    <div id={`q-${q.id}`} className={cn("group rounded-lg border border-line transition-colors", open && "bg-subtle/60", defaultOpen && "ring-2 ring-accent-soft")}>
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronRight className={cn("mt-0.5 size-4 shrink-0 text-faint transition-transform", open && "rotate-90")} />
          <span className="mr-1 shrink-0 text-sm tabular-nums text-faint">{index + 1}.</span>
          <span className="text-[15px] font-medium leading-snug">{q.question}</span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden sm:inline-flex">
            <DifficultyPill difficulty={q.difficulty} />
          </span>
          <Popover
            align="end"
            trigger={(p) => (
              <button type="button" {...p} className="rounded px-0.5 hover:bg-hover" aria-label={`Status: ${QUESTION_STATUS_META[q.status].label}`}>
                <Pill tone={QUESTION_STATUS_META[q.status].tone}>{QUESTION_STATUS_META[q.status].label}</Pill>
              </button>
            )}
          >
            {(close) =>
              QUESTION_STATUSES.map((s) => (
                <MenuItem
                  key={s}
                  active={s === q.status}
                  onClick={() => {
                    close();
                    update.mutate({ id: q.id, question: q.question, status: s });
                  }}
                >
                  <Pill tone={QUESTION_STATUS_META[s].tone}>{QUESTION_STATUS_META[s].label}</Pill>
                </MenuItem>
              ))
            }
          </Popover>
          <Popover
            align="end"
            trigger={(p) => (
              <IconButton label="Question options" {...p}>
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
                  Edit
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
                  Delete
                </MenuItem>
              </>
            )}
          </Popover>
        </div>
      </div>
      {open && (
        <div className="animate-fade-in space-y-4 border-t border-line px-4 py-4 sm:pl-12">
          {q.answer.trim() ? (
            <Markdown>{q.answer}</Markdown>
          ) : (
            <p className="text-sm text-faint">
              No answer yet.{" "}
              <button className="underline" onClick={() => setEditing(true)}>
                Write one
              </button>
            </p>
          )}
          {q.followUps.trim() && (
            <div className="rounded-md border-l-2 border-[var(--amber-fg)] bg-[var(--amber-bg)]/40 py-2 pr-3 pl-3">
              <p className="mb-1 text-xs font-semibold tracking-wide text-[var(--amber-fg)] uppercase">Likely follow-ups</p>
              <Markdown className="text-[14.5px]">{q.followUps}</Markdown>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this question?"
        message={`“${q.question}” and its answer will be permanently deleted.`}
        loading={del.isPending}
        onConfirm={() => del.mutate(q.id, { onSuccess: () => setConfirm(false) })}
      />
    </div>
  );
}

export function QuestionsPanel({ topicId, questions, focusId }: { topicId: string; questions: Question[]; focusId?: string | null }) {
  const [adding, setAdding] = useState(false);
  const create = useCreateQuestion();
  const mastered = questions.filter((q) => q.status === "mastered").length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {questions.length ? `${mastered} of ${questions.length} mastered` : "Common interview questions with model answers and follow-ups."}
        </p>
        <div className="flex gap-2">
          {questions.length > 0 && (
            <Link href={`/practice?topicId=${topicId}`}>
              <Button size="sm" icon={<Play className="size-3.5" />}>
                Practice these
              </Button>
            </Link>
          )}
          <Button size="sm" variant="primary" icon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>
            Add question
          </Button>
        </div>
      </div>
      {adding && (
        <QuestionForm
          submitLabel="Add question"
          loading={create.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={(v) => create.mutate({ topicId, ...v }, { onSuccess: () => setAdding(false) })}
        />
      )}
      {questions.length === 0 && !adding ? (
        <EmptyState
          icon="❓"
          title="No questions yet"
          description="Add the questions you expect to be asked, with your best answer, so you can drill them in Practice."
          action={
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              Add the first question
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} defaultOpen={focusId === q.id} />
          ))}
        </div>
      )}
    </div>
  );
}
