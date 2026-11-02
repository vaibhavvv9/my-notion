import type { Difficulty, ResourceKind, Sections } from "../schema";

export type SeedQuestion = {
  question: string;
  answer: string;
  followUps: string;
  difficulty: Difficulty;
};

export type SeedTopic = {
  title: string;
  icon: string;
  summary: string;
  difficulty: Difficulty;
  tags: string[];
  sections: Sections;
  questions: SeedQuestion[];
  checklist: string[];
  resources: { title: string; url: string; kind: ResourceKind }[];
  children: SeedTopic[];
};

export type SeedTrack = {
  name: string;
  icon: string;
  description: string;
  topics: SeedTopic[];
};
