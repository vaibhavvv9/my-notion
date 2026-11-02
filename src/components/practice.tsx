"use client";

import { ArrowLeft, Eye, RotateCcw, Shuffle, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_META, QUESTION_STATUS_META } from "@/lib/constants";
import { usePracticeQuestion, useQuestions, useTree } from "@/lib/hooks";
import type { QuestionListItem } from "@/lib/types";
import { Markdown } from "./markdown";
import { DifficultyPill } from "./topic-bits";
import { Button, EmptyState, ErrorState, Kbd, Pill, ProgressBar, Select, Skeleton } from "./ui";

type Result = "again" | "good" | "easy";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Practice() {
  const params = useSearchParams();
  const router = useRouter();
  const topicId = params.get("topicId") ?? "";
  const tree = useTree();
  const [trackId, setTrackId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [scope, setScope] = useState<"unmastered" | "all" | "new" | "learning" | "mastered">("unmastered");
  const [shuffled, setShuffled] = useState(true);

  const query = useQuestions({ trackId: trackId || undefined, topicId: topicId || undefined, difficulty: difficulty || undefined });
  const practice = usePracticeQuestion();

  const pool = useMemo(
    () =>
      (query.data ?? []).filter((q) =>
        scope === "all" ? true : scope === "unmastered" ? q.status !== "mastered" : q.status === scope,
      ),
    [query.data, scope],
  );

  const [deck, setDeck] = useState<QuestionListItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});

  const start = () => {
    setDeck(shuffled ? shuffle(pool) : pool);
    setIndex(0);
    setRevealed(false);
    setResults({});
  };

  const current = deck?.[index];
  const finished = deck && index >= deck.length;

  const rate = useCallback(
    (r: Result) => {
      if (!current) return;
      practice.mutate({ id: current.id, result: r });
      setResults((x) => ({ ...x, [current.id]: r }));
      setRevealed(false);
      setIndex((i) => i + 1);
    },
    [current, practice],
  );

  useEffect(() => {
    if (!deck || finished) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
      } else if (revealed && ["1", "2", "3"].includes(e.key)) {
        rate((["again", "good", "easy"] as const)[Number(e.key) - 1]);
      } else if (e.key === "Escape") {
        setDeck(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, finished, revealed, rate]);

  const topicTitle = topicId ? query.data?.[0]?.topicTitle : undefined;

  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  /* ---------------- Session finished */
  if (deck && finished) {
    const vals = Object.values(results);
    const count = (r: Result) => vals.filter((v) => v === r).length;
    const again = deck.filter((q) => results[q.id] === "again");
    return (
      <div className="mx-auto w-full max-w-2xl animate-fade-in px-5 py-12 text-center sm:py-20">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold">Session complete</h1>
        <p className="mt-1 text-muted">You went through {deck.length} questions.</p>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
          {(
            [
              ["again", "Review again", "red"],
              ["good", "Good", "blue"],
              ["easy", "Easy", "green"],
            ] as const
          ).map(([k, label, tone]) => (
            <div key={k} className="rounded-xl border border-line p-3">
              <div className="text-2xl font-semibold tabular-nums">{count(k)}</div>
              <Pill tone={tone}>{label}</Pill>
            </div>
          ))}
        </div>
        {again.length > 0 && (
          <div className="mx-auto mt-6 max-w-md text-left">
            <p className="mb-2 text-sm font-medium">Worth another look</p>
            <ul className="space-y-1">
              {again.map((q) => (
                <li key={q.id}>
                  <Link href={`/topics/${q.topicId}?tab=questions&q=${q.id}`} className="block truncate rounded px-2 py-1 text-sm hover:bg-hover">
                    {q.topicIcon} {q.question}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-8 flex justify-center gap-2">
          {again.length > 0 && (
            <Button
              icon={<RotateCcw className="size-4" />}
              onClick={() => {
                setDeck(shuffle(again));
                setIndex(0);
                setResults({});
              }}
            >
              Retry {again.length} missed
            </Button>
          )}
          <Button variant="primary" onClick={() => setDeck(null)}>
            New session
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- Card */
  if (deck && current) {
    return (
      <div className="mx-auto flex w-full max-w-3xl animate-fade-in flex-col px-5 py-6 sm:py-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<X className="size-3.5" />} onClick={() => setDeck(null)}>
            End
          </Button>
          <ProgressBar value={(index / deck.length) * 100} className="flex-1" />
          <span className="text-sm tabular-nums text-muted">
            {index + 1}/{deck.length}
          </span>
        </div>

        <div key={current.id} className="mt-8 animate-pop-in rounded-2xl border border-line p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Link href={`/topics/${current.topicId}`} className="hover:underline">
              {current.topicIcon} {current.topicTitle}
            </Link>
            <DifficultyPill difficulty={current.difficulty} />
            <Pill tone={QUESTION_STATUS_META[current.status].tone}>{QUESTION_STATUS_META[current.status].label}</Pill>
          </div>
          <h2 className="mt-4 text-xl leading-snug font-semibold sm:text-2xl">{current.question}</h2>

          {!revealed ? (
            <div className="mt-8">
              <p className="text-sm text-muted">Answer out loud first, as if you were in the interview. Then reveal.</p>
              <Button className="mt-4" variant="primary" icon={<Eye className="size-4" />} onClick={() => setRevealed(true)}>
                Reveal answer <span className="ml-1 opacity-70">(Space)</span>
              </Button>
            </div>
          ) : (
            <div className="mt-6 animate-fade-in space-y-5 border-t border-line pt-6">
              {current.answer.trim() ? <Markdown>{current.answer}</Markdown> : <p className="text-sm text-faint">No model answer saved for this question.</p>}
              {current.followUps.trim() && (
                <div className="rounded-md border-l-2 border-[var(--amber-fg)] bg-[var(--amber-bg)]/40 py-2 pr-3 pl-3">
                  <p className="mb-1 text-xs font-semibold tracking-wide text-[var(--amber-fg)] uppercase">Be ready for follow-ups</p>
                  <Markdown className="text-[14.5px]">{current.followUps}</Markdown>
                </div>
              )}
            </div>
          )}
        </div>

        {revealed && (
          <div className="mt-5 animate-fade-in">
            <p className="mb-2 text-center text-sm text-muted">How did you do?</p>
            <div className="grid grid-cols-3 gap-2">
              <Button className="h-11" onClick={() => rate("again")}>
                <Kbd>1</Kbd> Review again
              </Button>
              <Button className="h-11" onClick={() => rate("good")}>
                <Kbd>2</Kbd> Good
              </Button>
              <Button className="h-11" onClick={() => rate("easy")}>
                <Kbd>3</Kbd> Easy
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- Setup */
  const stats = { new: 0, learning: 0, mastered: 0 } as Record<string, number>;
  (query.data ?? []).forEach((q) => stats[q.status]++);
  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      {topicId && (
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" icon={<ArrowLeft className="size-3.5" />} onClick={() => router.push(`/topics/${topicId}?tab=questions`)}>
          Back to topic
        </Button>
      )}
      <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
      <p className="mt-1 text-[15px] text-muted">
        {topicId && topicTitle ? `Drill the questions for “${topicTitle}”.` : "Flashcard drills for interview questions. Answer aloud, reveal, then rate yourself."}
      </p>

      <div className="mt-6 rounded-xl border border-line p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {!topicId && (
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted">Track</span>
              <Select
                label="Track"
                className="w-full"
                value={trackId}
                onChange={setTrackId}
                options={[{ value: "", label: "All tracks" }, ...(tree.data?.tracks ?? []).map((t) => ({ value: t.id, label: `${t.icon} ${t.name}` }))]}
              />
            </label>
          )}
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted">Difficulty</span>
            <Select
              label="Difficulty"
              className="w-full"
              value={difficulty}
              onChange={setDifficulty}
              options={[{ value: "", label: "Any level" }, ...DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))]}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted">Questions</span>
            <Select
              label="Questions"
              className="w-full"
              value={scope}
              onChange={(v) => setScope(v as typeof scope)}
              options={[
                { value: "unmastered", label: "Not mastered yet" },
                { value: "new", label: "New only" },
                { value: "learning", label: "Learning only" },
                { value: "mastered", label: "Mastered only" },
                { value: "all", label: "Everything" },
              ]}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="text-sm text-muted">
            {query.isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <>
                <span className="font-medium text-fg">{pool.length}</span> questions in this session ·{" "}
                <span>
                  {stats.new} new · {stats.learning} learning · {stats.mastered} mastered
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={shuffled} onChange={(e) => setShuffled(e.target.checked)} className="accent-[var(--accent)]" />
              <Shuffle className="size-3.5" /> Shuffle
            </label>
            <Button variant="primary" onClick={start} disabled={!pool.length}>
              Start session
            </Button>
          </div>
        </div>
      </div>

      {!query.isLoading && pool.length === 0 && (
        <EmptyState
          className="mt-4"
          icon="✅"
          title={query.data?.length ? "Nothing left in this selection" : "No questions found"}
          description={query.data?.length ? "Everything here is mastered. Choose “Everything” to review it all again." : "Add interview questions to your topics, then come back to drill them."}
        />
      )}

      <div className="mt-6 text-xs text-faint">
        Shortcuts: <Kbd>Space</Kbd> reveal · <Kbd>1</Kbd> review again · <Kbd>2</Kbd> good · <Kbd>3</Kbd> easy · <Kbd>Esc</Kbd> end session
      </div>
    </div>
  );
}
