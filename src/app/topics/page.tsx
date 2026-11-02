import type { Metadata } from "next";
import { Suspense } from "react";
import { Library } from "@/components/library";
import { PageSkeleton } from "@/components/ui";

export const metadata: Metadata = { title: "All topics" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Library />
    </Suspense>
  );
}
