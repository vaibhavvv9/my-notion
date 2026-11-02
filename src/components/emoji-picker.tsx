"use client";

import { useState } from "react";
import { Input, Popover, cn } from "./ui";

const EMOJIS = [
  "📘", "📗", "📙", "📕", "📚", "📝", "🗒️", "📌", "⭐", "🔥", "⚡", "💡",
  "🎨", "🛠️", "🤖", "🧠", "🧩", "🧪", "🔒", "🔑", "🚀", "🌐", "🗄️", "📐",
  "⚛️", "▲", "🔷", "🟩", "🐍", "🐳", "📨", "🏛️", "🏗️", "🌍", "📊", "📏",
  "🔦", "✍️", "🧭", "🎛️", "🗺️", "🔌", "🚂", "🔁", "🪝", "🖌️", "💻", "🎯",
];

export function EmojiPicker({
  value,
  onChange,
  size = "md",
  placeholder = "📄",
  allowClear = true,
}: {
  value: string;
  onChange: (emoji: string) => void;
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [custom, setCustom] = useState("");
  return (
    <Popover
      trigger={(p) => (
        <button
          type="button"
          {...p}
          aria-label="Change icon"
          title="Change icon"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md transition-colors hover:bg-hover",
            size === "lg" ? "size-16 text-5xl" : size === "md" ? "size-9 text-2xl" : "size-6 text-base",
            !value && "opacity-50",
          )}
        >
          {value || placeholder}
        </button>
      )}
    >
      {(close) => (
        <div className="w-72 p-1">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onChange(e);
                  close();
                }}
                className={cn("flex size-8 items-center justify-center rounded text-lg hover:bg-hover", value === e && "bg-active")}
              >
                {e}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(ev) => {
              ev.preventDefault();
              const v = custom.trim();
              if (v) {
                onChange(Array.from(v).slice(0, 2).join(""));
                setCustom("");
                close();
              }
            }}
          >
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or type/paste any emoji" className="h-7 text-xs" />
            {allowClear && value && (
              <button
                type="button"
                className="shrink-0 rounded px-2 text-xs text-muted hover:bg-hover"
                onClick={() => {
                  onChange("");
                  close();
                }}
              >
                Remove
              </button>
            )}
          </form>
        </div>
      )}
    </Popover>
  );
}
