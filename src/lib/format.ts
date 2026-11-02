const DAY = 86_400_000;

export function timeAgo(ts: number | null | undefined, now = Date.now()) {
  if (!ts) return "never";
  const diff = now - ts;
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Overdue 2d", "Due today", "Tomorrow", "In 5 days" */
export function dueLabel(ts: number | null | undefined, now = Date.now()): { label: string; overdue: boolean; today: boolean } {
  if (!ts) return { label: "Not scheduled", overdue: false, today: false };
  const days = Math.round((startOfDay(ts) - startOfDay(now)) / DAY);
  if (days < 0) return { label: `Overdue ${-days}d`, overdue: true, today: false };
  if (days === 0) return { label: "Due today", overdue: false, today: true };
  if (days === 1) return { label: "Tomorrow", overdue: false, today: false };
  return { label: `In ${days} days`, overdue: false, today: false };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  topic_created: "Created topic",
  topic_deleted: "Deleted topic",
  track_created: "Created track",
  status_completed: "Completed",
  status_in_progress: "Started",
  status_not_started: "Reset",
  reviewed: "Revised",
  note_created: "Wrote note",
  question_created: "Added question",
  practiced: "Practiced",
  checklist_done: "Checked off",
};
