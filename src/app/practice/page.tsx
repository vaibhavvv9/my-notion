import type { Metadata } from "next";
import { Suspense } from "react";
import { Practice } from "@/components/practice";
import { PageSkeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Practice" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Practice />
    </Suspense>
  );
}
