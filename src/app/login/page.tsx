"use client";

import { Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Input } from "@/components/ui";
import { api } from "@/lib/api";

function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth", { password });
      const next = params.get("next");
      // Full navigation so the new cookie is used for every request.
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm animate-pop-in rounded-xl border border-line p-6">
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-hover">
        <Lock className="size-5 text-muted" />
      </div>
      <h1 className="text-xl font-semibold">Interview Prep</h1>
      <p className="mt-1 text-sm text-muted">This workspace is private. Enter the password to continue.</p>
      <Input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        className="mt-5"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <Button type="submit" variant="primary" className="mt-4 w-full" loading={loading} disabled={!password}>
        Unlock
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
