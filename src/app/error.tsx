"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="mt-6 rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-hover">
        Try again
      </button>
    </div>
  );
}
