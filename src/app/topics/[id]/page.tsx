"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { TopicPage } from "@/components/topic/topic-page";
import { PageSkeleton } from "@/components/ui";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TopicPage key={id} id={id} />
    </Suspense>
  );
}
