"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, qs } from "./api";
import type {
  ChecklistItem,
  Dashboard,
  Note,
  NoteListItem,
  Question,
  QuestionListItem,
  Resource,
  SearchResults,
  Topic,
  TopicDetail,
  TopicListItem,
  Track,
  Tree,
} from "./types";

/* ------------------------------------------------------------ queries */

export const useTree = () => useQuery({ queryKey: ["tree"], queryFn: () => api.get<Tree>("/api/tree") });

export const useTopic = (id: string) =>
  useQuery({ queryKey: ["topic", id], queryFn: () => api.get<TopicDetail>(`/api/topics/${id}`), retry: (n, e) => (e as { status?: number }).status !== 404 && n < 2 });

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<Dashboard>(`/api/dashboard?tz=${new Date().getTimezoneOffset()}`),
  });

export type TopicFilters = {
  q?: string;
  trackId?: string;
  status?: string;
  difficulty?: string;
  tag?: string;
  pinned?: boolean;
  sort?: string;
};
export const useTopics = (f: TopicFilters) =>
  useQuery({
    queryKey: ["topics", f],
    queryFn: () => api.get<TopicListItem[]>(`/api/topics${qs(f)}`),
    placeholderData: (prev) => prev,
  });

export const useTags = () =>
  useQuery({ queryKey: ["tags"], queryFn: () => api.get<{ tag: string; count: number }[]>("/api/tags") });

export const useNotes = (f: { q?: string; pinned?: boolean; trackId?: string }) =>
  useQuery({
    queryKey: ["notes", f],
    queryFn: () => api.get<NoteListItem[]>(`/api/notes${qs(f)}`),
    placeholderData: (prev) => prev,
  });

export const useQuestions = (f: { trackId?: string; topicId?: string; status?: string; difficulty?: string; q?: string }) =>
  useQuery({
    queryKey: ["questions", f],
    queryFn: () => api.get<QuestionListItem[]>(`/api/questions${qs(f)}`),
  });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get<SearchResults>(`/api/search${qs({ q })}`),
    enabled: q.trim().length > 0,
    placeholderData: (prev) => prev,
  });

/* ---------------------------------------------------------- mutations */

/** Refresh every list/aggregate view; the data set is small so this stays cheap. */
export function invalidateAll(qc: QueryClient, except?: string[]) {
  return qc.invalidateQueries({
    predicate: (q) => !except?.some((k) => JSON.stringify(q.queryKey).startsWith(JSON.stringify([k]).slice(0, -1))),
  });
}

function useMut<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  opts: {
    success?: string | ((r: TResult, v: TVars) => string | undefined);
    onSuccess?: (r: TResult, v: TVars, qc: QueryClient) => void;
    except?: string[];
  } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => {
      opts.onSuccess?.(r, v, qc);
      invalidateAll(qc, opts.except);
      const msg = typeof opts.success === "function" ? opts.success(r, v) : opts.success;
      if (msg) toast.success(msg);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });
}

// Tracks
export const useCreateTrack = () =>
  useMut((d: { name: string; icon?: string; description?: string }) => api.post<Track>("/api/tracks", d), {
    success: "Track created",
  });
export const useUpdateTrack = () =>
  useMut(({ id, ...d }: { id: string; name?: string; icon?: string; description?: string }) =>
    api.patch<Track>(`/api/tracks/${id}`, d),
  );
export const useDeleteTrack = () =>
  useMut((id: string) => api.del(`/api/tracks/${id}`), { success: "Track deleted" });
export const useReorderTracks = () => useMut((ids: string[]) => api.post("/api/tracks/reorder", { ids }));

// Topics
export type TopicCreate = {
  trackId: string;
  parentId?: string | null;
  title: string;
  icon?: string;
  summary?: string;
  difficulty?: string;
  status?: string;
  tags?: string[];
};
export const useCreateTopic = () =>
  useMut((d: TopicCreate) => api.post<Topic>("/api/topics", d), { success: (_r, v) => `Created “${v.title}”` });

export type TopicPatch = Partial<
  Pick<Topic, "title" | "icon" | "summary" | "difficulty" | "status" | "tags" | "pinned" | "confidence" | "nextReviewAt" | "trackId">
> & { sections?: Topic["sections"]; parentId?: string | null };

/** Updates a topic with an optimistic patch to the cached detail and tree. */
export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }: TopicPatch & { id: string }) => api.patch<Topic>(`/api/topics/${id}`, d),
    onMutate: async ({ id, ...d }) => {
      await qc.cancelQueries({ queryKey: ["topic", id] });
      const prev = qc.getQueryData<TopicDetail>(["topic", id]);
      if (prev) {
        qc.setQueryData<TopicDetail>(["topic", id], {
          ...prev,
          topic: { ...prev.topic, ...d, sections: d.sections ? { ...prev.topic.sections, ...d.sections } : prev.topic.sections },
        });
      }
      const prevTree = qc.getQueryData<Tree>(["tree"]);
      if (prevTree) {
        qc.setQueryData<Tree>(["tree"], {
          ...prevTree,
          topics: prevTree.topics.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...(d.title !== undefined && { title: d.title }),
                  ...(d.icon !== undefined && { icon: d.icon }),
                  ...(d.status !== undefined && { status: d.status }),
                  ...(d.pinned !== undefined && { pinned: d.pinned }),
                }
              : t,
          ),
        });
      }
      return { prev, prevTree };
    },
    onError: (err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(["topic", id], ctx.prev);
      if (ctx?.prevTree) qc.setQueryData(["tree"], ctx.prevTree);
      toast.error(err instanceof Error ? err.message : "Couldn't save the topic");
    },
    onSuccess: (row, { id }) => {
      const prev = qc.getQueryData<TopicDetail>(["topic", id]);
      if (prev) qc.setQueryData<TopicDetail>(["topic", id], { ...prev, topic: row });
      // Section edits are frequent; avoid refetching the topic itself mid-typing.
      invalidateAll(qc, ["topic", "search"]);
      qc.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

export const useDeleteTopic = () =>
  useMut((id: string) => api.del<{ deleted: number }>(`/api/topics/${id}`), {
    success: (r) => (r.deleted > 1 ? `Deleted topic and ${r.deleted - 1} subtopic(s)` : "Topic deleted"),
    onSuccess: (_r, id, qc) => qc.removeQueries({ queryKey: ["topic", id] }),
    except: ["topic"],
  });
export const useReorderTopics = () => useMut((ids: string[]) => api.post("/api/topics/reorder", { ids }));
export const useReviewTopic = () =>
  useMut(({ id, confidence }: { id: string; confidence: number }) => api.post<Topic>(`/api/topics/${id}/review`, { confidence }), {
    success: "Revision logged. Next review scheduled.",
  });

// Notes
export const useCreateNote = () =>
  useMut((d: { topicId: string; title: string; content?: string }) => api.post<Note>("/api/notes", d), {
    success: "Note created",
  });
export const useUpdateNote = () =>
  useMut(({ id, ...d }: { id: string; title?: string; content?: string; pinned?: boolean }) =>
    api.patch<Note>(`/api/notes/${id}`, d),
  );
export const useDeleteNote = () => useMut((id: string) => api.del(`/api/notes/${id}`), { success: "Note deleted" });

// Questions
export type QuestionInput = { question: string; answer?: string; followUps?: string; difficulty?: string };
export const useCreateQuestion = () =>
  useMut((d: QuestionInput & { topicId: string }) => api.post<Question>("/api/questions", d), {
    success: "Question added",
  });
export const useUpdateQuestion = () =>
  useMut(({ id, ...d }: Partial<QuestionInput> & { id: string; status?: string }) => api.patch<Question>(`/api/questions/${id}`, d));
export const useDeleteQuestion = () =>
  useMut((id: string) => api.del(`/api/questions/${id}`), { success: "Question deleted" });
export const usePracticeQuestion = () =>
  useMut(({ id, result }: { id: string; result: "again" | "good" | "easy" }) =>
    api.post<Question>(`/api/questions/${id}/practice`, { result }),
    { except: ["questions"] },
  );

// Checklist
export const useCreateChecklistItem = () =>
  useMut((d: { topicId: string; text: string }) => api.post<ChecklistItem>("/api/checklist", d));
export const useUpdateChecklistItem = () =>
  useMut(({ id, ...d }: { id: string; text?: string; done?: boolean }) => api.patch<ChecklistItem>(`/api/checklist/${id}`, d));
export const useDeleteChecklistItem = () => useMut((id: string) => api.del(`/api/checklist/${id}`));

// Resources
export type ResourceInput = { title: string; url: string; kind?: string };
export const useCreateResource = () =>
  useMut((d: ResourceInput & { topicId: string }) => api.post<Resource>("/api/resources", d), { success: "Resource added" });
export const useUpdateResource = () =>
  useMut(({ id, ...d }: Partial<ResourceInput> & { id: string }) => api.patch<Resource>(`/api/resources/${id}`, d));
export const useDeleteResource = () =>
  useMut((id: string) => api.del(`/api/resources/${id}`), { success: "Resource removed" });
