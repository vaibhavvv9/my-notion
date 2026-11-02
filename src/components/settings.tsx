"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Download, Monitor, Moon, Sun, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTheme, type ThemePref } from "./theme";
import { Button, ConfirmDialog, cn } from "./ui";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line py-6 sm:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; data: unknown } | null>(null);
  const [importing, setImporting] = useState(false);

  const options: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="size-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
    { value: "system", label: "System", icon: <Monitor className="size-4" /> },
  ];

  const onFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      setPending({ name: file.name, data });
    } catch {
      toast.error("That file isn't valid JSON");
    }
  };

  const doImport = async () => {
    if (!pending) return;
    setImporting(true);
    try {
      const res = await api.post<{ counts: Record<string, number> }>("/api/backup", pending.data);
      await qc.invalidateQueries();
      toast.success(`Restored ${res.counts.topics ?? 0} topics and ${res.counts.notes ?? 0} notes`);
      setPending(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Section title="Appearance" description="Choose a theme. System follows your OS setting.">
        <div className="inline-flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="Theme">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={theme === o.value}
              onClick={() => setTheme(o.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                theme === o.value ? "bg-active font-medium text-fg" : "text-muted hover:text-fg",
              )}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Backup & restore" description="Download everything as a JSON file, or restore from a previous backup.">
        <div className="flex flex-wrap gap-2">
          <a href="/api/backup" download>
            <Button icon={<Download className="size-4" />}>Download backup</Button>
          </a>
          <Button icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
            Restore from file…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 text-xs text-faint">Restoring replaces all current tracks, topics, notes and progress.</p>
      </Section>

      <Section title="Keyboard shortcuts" description="Move faster around the workspace.">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {[
            ["⌘K / Ctrl+K", "Search everything"],
            ["Esc / ⌘↵", "Finish editing a block"],
            ["⌘B / ⌘I", "Bold / italic while editing"],
            ["Space", "Reveal answer in practice"],
            ["1 · 2 · 3", "Rate a practice card"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-mono text-xs leading-5 text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Restore this backup?"
        message={`Everything currently in your workspace will be replaced with the contents of “${pending?.name}”. Consider downloading a backup first.`}
        confirmLabel="Replace everything"
        loading={importing}
        onConfirm={doImport}
      />
    </div>
  );
}
