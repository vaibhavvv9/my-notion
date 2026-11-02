"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCreateChecklistItem, useDeleteChecklistItem, useUpdateChecklistItem } from "@/lib/hooks";
import type { ChecklistItem } from "@/lib/types";
import { IconButton, ProgressBar, cn } from "../ui";

function Row({ item }: { item: ChecklistItem }) {
  const update = useUpdateChecklistItem();
  const del = useDeleteChecklistItem();
  const [text, setText] = useState(item.text);
  const [done, setDone] = useState(item.done);
  const commit = () => {
    const t = text.trim();
    if (!t) return setText(item.text);
    if (t !== item.text) update.mutate({ id: item.id, text: t });
  };
  return (
    <li className="group flex items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-hover/60">
      <input
        type="checkbox"
        checked={done}
        aria-label={`Mark “${item.text}” ${done ? "not done" : "done"}`}
        onChange={(e) => {
          setDone(e.target.checked);
          update.mutate({ id: item.id, done: e.target.checked }, { onError: () => setDone(!e.target.checked) });
        }}
        className="size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        maxLength={300}
        aria-label="Checklist item"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-[15px] outline-none",
          done && "text-faint line-through decoration-[var(--fg-faint)]",
        )}
      />
      <IconButton label="Delete item" className="opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => del.mutate(item.id)}>
        <Trash2 className="size-3.5" />
      </IconButton>
    </li>
  );
}

export function ChecklistPanel({ topicId, items }: { topicId: string; items: ChecklistItem[] }) {
  const create = useCreateChecklistItem();
  const [text, setText] = useState("");
  const done = items.filter((i) => i.done).length;
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    create.mutate({ topicId, text: t }, { onSuccess: () => setText("") });
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ProgressBar value={items.length ? (done / items.length) * 100 : 0} tone="green" className="max-w-xs" />
        <span className="shrink-0 text-sm text-muted">
          {done}/{items.length} done
        </span>
      </div>
      <p className="text-sm text-muted">Before the interview, you should be able to do all of these without notes.</p>
      <ul className="space-y-0.5">
        {items.map((i) => (
          <Row key={`${i.id}-${i.done}-${i.text}`} item={i} />
        ))}
      </ul>
      <form onSubmit={add} className="flex items-center gap-2.5 px-1.5">
        <Plus className="size-4 text-faint" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a checklist item and press Enter"
          maxLength={300}
          className="h-8 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
        />
      </form>
    </div>
  );
}
