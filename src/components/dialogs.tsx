"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/constants";
import { useCreateTopic, useCreateTrack, useTree, useUpdateTopic, useUpdateTrack } from "@/lib/hooks";
import type { Track } from "@/lib/types";
import { EmojiPicker } from "./emoji-picker";
import { Button, Field, Input, Modal, Select } from "./ui";

export function TrackDialog({ open, onClose, track }: { open: boolean; onClose: () => void; track?: Track }) {
  const router = useRouter();
  const create = useCreateTrack();
  const update = useUpdateTrack();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📘");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(track?.name ?? "");
      setIcon(track?.icon ?? "📘");
      setDescription(track?.description ?? "");
      setError("");
    }
  }, [open, track]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the track a name");
    if (track) {
      update.mutate({ id: track.id, name: name.trim(), icon, description: description.trim() }, { onSuccess: onClose });
    } else {
      create.mutate(
        { name: name.trim(), icon, description: description.trim() },
        {
          onSuccess: (t) => {
            onClose();
            router.push(`/tracks/${t.id}`);
          },
        },
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={track ? "Edit track" : "New learning track"}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-end gap-2">
          <EmojiPicker value={icon} onChange={setIcon} allowClear={false} />
          <div className="flex-1">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mobile Engineering" maxLength={80} autoFocus />
            </Field>
          </div>
        </div>
        <Field label="Description">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this track cover?" maxLength={500} />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={create.isPending || update.isPending}>
            {track ? "Save" : "Create track"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TopicDialog({
  open,
  onClose,
  trackId,
  parentId,
}: {
  open: boolean;
  onClose: () => void;
  trackId?: string;
  parentId?: string | null;
}) {
  const router = useRouter();
  const tree = useTree();
  const create = useCreateTopic();
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [track, setTrack] = useState(trackId ?? "");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setIcon("");
      setDifficulty("intermediate");
      setTags("");
      setError("");
      setTrack(trackId ?? tree.data?.tracks[0]?.id ?? "");
    }
  }, [open, trackId, tree.data]);

  const parent = parentId ? tree.data?.topics.find((t) => t.id === parentId) : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Give the topic a title");
    if (!track) return setError("Create a track first");
    create.mutate(
      {
        trackId: track,
        parentId: parentId ?? null,
        title: title.trim(),
        icon,
        difficulty,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      },
      {
        onSuccess: (t) => {
          onClose();
          router.push(`/topics/${t.id}`);
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={parent ? `New subtopic in “${parent.title}”` : "New topic"}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-end gap-2">
          <EmojiPicker value={icon} onChange={setIcon} />
          <div className="flex-1">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web Workers" maxLength={160} autoFocus />
            </Field>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!parentId && (
            <Field label="Track">
              <Select
                label="Track"
                className="w-full"
                value={track}
                onChange={setTrack}
                options={(tree.data?.tracks ?? []).map((t) => ({ value: t.id, label: `${t.icon} ${t.name}` }))}
              />
            </Field>
          )}
          <Field label="Difficulty">
            <Select
              label="Difficulty"
              className="w-full"
              value={difficulty}
              onChange={(v) => setDifficulty(v as Difficulty)}
              options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))}
            />
          </Field>
        </div>
        <Field label="Tags" hint="Comma separated, e.g. browser, performance">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Optional" />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={create.isPending}>
            Create topic
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MoveTopicDialog({
  open,
  onClose,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  topic: { id: string; title: string; trackId: string; parentId: string | null };
}) {
  const tree = useTree();
  const update = useUpdateTopic();
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (open) setTarget(topic.parentId ? `topic:${topic.parentId}` : `track:${topic.trackId}`);
  }, [open, topic]);

  // Valid destinations: any track root, or any topic that isn't this topic or its descendant.
  const options = useMemo(() => {
    if (!tree.data) return [];
    const { tracks, topics } = tree.data;
    const blocked = new Set<string>([topic.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const t of topics) {
        if (t.parentId && blocked.has(t.parentId) && !blocked.has(t.id)) {
          blocked.add(t.id);
          grew = true;
        }
      }
    }
    const out: { value: string; label: string }[] = [];
    const walk = (trackId: string, parentId: string | null, depth: number) => {
      topics
        .filter((t) => t.trackId === trackId && t.parentId === parentId && !blocked.has(t.id))
        .forEach((t) => {
          out.push({ value: `topic:${t.id}`, label: `${"   ".repeat(depth + 1)}${t.icon || "📄"} ${t.title}` });
          walk(trackId, t.id, depth + 1);
        });
    };
    for (const tr of tracks) {
      out.push({ value: `track:${tr.id}`, label: `${tr.icon} ${tr.name} (top level)` });
      walk(tr.id, null, 0);
    }
    return out;
  }, [tree.data, topic.id]);

  const submit = () => {
    const [kind, id] = target.split(":");
    const parent = kind === "topic" ? tree.data?.topics.find((t) => t.id === id) : undefined;
    const trackId = kind === "track" ? id : parent?.trackId;
    update.mutate(
      { id: topic.id, trackId, parentId: kind === "topic" ? id : null },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Move “${topic.title}”`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={update.isPending}>
            Move
          </Button>
        </>
      }
    >
      <Field label="Destination" hint="Subtopics move along with the topic.">
        <Select label="Destination" className="w-full" value={target} onChange={setTarget} options={options} />
      </Field>
    </Modal>
  );
}
