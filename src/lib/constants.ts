export const STATUSES = ["not_started", "in_progress", "completed"] as const;
export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const QUESTION_STATUSES = ["new", "learning", "mastered"] as const;
export const RESOURCE_KINDS = ["article", "docs", "video", "course", "book", "repo", "other"] as const;
export const SECTION_KEYS = ["concept", "fundamentals", "advanced", "examples", "useCases", "mistakes"] as const;

export type Status = (typeof STATUSES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];
export type ResourceKind = (typeof RESOURCE_KINDS)[number];
export type SectionKey = (typeof SECTION_KEYS)[number];
export type Sections = Partial<Record<SectionKey, string>>;

export type Tone = "gray" | "blue" | "green" | "amber" | "red" | "purple";

export const STATUS_META: Record<Status, { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "gray" },
  in_progress: { label: "In progress", tone: "blue" },
  completed: { label: "Completed", tone: "green" },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; tone: Tone }> = {
  beginner: { label: "Beginner", tone: "green" },
  intermediate: { label: "Intermediate", tone: "amber" },
  advanced: { label: "Advanced", tone: "red" },
};

export const QUESTION_STATUS_META: Record<QuestionStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "gray" },
  learning: { label: "Learning", tone: "amber" },
  mastered: { label: "Mastered", tone: "green" },
};

export const SECTION_META: Record<SectionKey, { label: string; placeholder: string; emoji: string }> = {
  concept: { label: "Concept explanation", emoji: "💡", placeholder: "Explain the idea in your own words, as you would in an interview." },
  fundamentals: { label: "Important fundamentals", emoji: "🧱", placeholder: "The must-know basics, as a bulleted list." },
  advanced: { label: "Advanced concepts", emoji: "🧠", placeholder: "Deeper internals and senior-level talking points." },
  examples: { label: "Practical coding examples", emoji: "💻", placeholder: "Add code with ```fences``` for syntax highlighting." },
  useCases: { label: "Real-world use cases", emoji: "🌍", placeholder: "Where this shows up in real products." },
  mistakes: { label: "Common mistakes & misconceptions", emoji: "⚠️", placeholder: "Traps interviewers love to probe." },
};

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  article: "Article",
  docs: "Docs",
  video: "Video",
  course: "Course",
  book: "Book",
  repo: "Repo",
  other: "Link",
};

export const CONFIDENCE_LABELS = ["", "Shaky", "Unsure", "Okay", "Good", "Nailed it"];
