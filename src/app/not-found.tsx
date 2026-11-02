import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">That page doesn&apos;t exist in your workspace.</p>
      <Link href="/" className="mt-6 rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-hover">
        Back to dashboard
      </Link>
    </div>
  );
}
