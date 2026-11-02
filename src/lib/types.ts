import type { Difficulty, QuestionStatus, ResourceKind, Sections, Status } from "./constants";

export type Track = {
  id: string;
  name: string;
  description: string;
  icon: string;
  position: number;
  createdAt: number;
  updatedAt: number;
};

export type TreeTopic = {
  id: string;
  trackId: string;
  parentId: string | null;
  title: string;
  icon: string;
  status: Status;
  difficulty: Difficulty;
  position: number;
  pinned: boolean;
};

export type Tree = { tracks: Track[]; topics: TreeTopic[] };

export type Topic = {
  id: string;
  trackId: string;
  parentId: string | null;
  title: string;
  icon: string;
  summary: string;
  status: Status;
  difficulty: Difficulty;
  tags: string[];
  sections: Sections;
  position: number;
  pinned: boolean;
  confidence: number | null;
  reviewCount: number;
  lastStudiedAt: number | null;
  lastViewedAt: number | null;
  nextReviewAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type Note = {
  id: string;
  topicId: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Question = {
  id: string;
  topicId: string;
  question: string;
  answer: string;
  followUps: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  position: number;
  practiceCount: number;
  lastPracticedAt: number | null;
};

export type ChecklistItem = { id: string; topicId: string; text: string; done: boolean; position: number };
export type Resource = { id: string; topicId: string; title: string; url: string; kind: ResourceKind; position: number };

export type TopicDetail = {
  topic: Topic;
  track: Track;
  ancestors: { id: string; title: string; icon: string }[];
  children: { id: string; title: string; icon: string; status: Status; difficulty: Difficulty; summary: string }[];
  notes: Note[];
  questions: Question[];
  checklist: ChecklistItem[];
  resources: Resource[];
};

export type TopicListItem = Pick<
  Topic,
  | "id"
  | "trackId"
  | "parentId"
  | "title"
  | "icon"
  | "summary"
  | "status"
  | "difficulty"
  | "tags"
  | "pinned"
  | "confidence"
  | "nextReviewAt"
  | "updatedAt"
  | "position"
> & { questionCount: number; noteCount: number };

export type LightTopic = Pick<
  Topic,
  | "id"
  | "trackId"
  | "title"
  | "icon"
  | "status"
  | "difficulty"
  | "summary"
  | "confidence"
  | "nextReviewAt"
  | "lastViewedAt"
  | "lastStudiedAt"
>;

export type ActivityItem = {
  id: string;
  topicId: string | null;
  trackId: string | null;
  kind: string;
  detail: string;
  createdAt: number;
};

export type Dashboard = {
  overall: { total: number; completed: number; inProgress: number; notStarted: number; percent: number };
  tracks: {
    id: string;
    name: string;
    icon: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    percent: number;
  }[];
  continueLearning: LightTopic[];
  recent: LightTopic[];
  dueReviews: LightTopic[];
  weak: LightTopic[];
  pinnedTopics: LightTopic[];
  pinnedNotes: { id: string; title: string; topicId: string; updatedAt: number; topicTitle: string }[];
  upNext: LightTopic[];
  heatmap: { today: number; days: Record<string, number> };
  streak: number;
  recentActivity: ActivityItem[];
  questions: { total: number; new: number; learning: number; mastered: number };
};

export type SearchResults = {
  topics: { id: string; title: string; icon: string; summary: string; status: Status; trackId: string; snippet: string }[];
  notes: { id: string; title: string; topicId: string; topicTitle: string; snippet: string }[];
  questions: { id: string; question: string; topicId: string; topicTitle: string; snippet: string }[];
};

export type NoteListItem = Note & { topicTitle: string; topicIcon: string; trackId: string };
export type QuestionListItem = Question & { topicTitle: string; topicIcon: string; trackId: string };
