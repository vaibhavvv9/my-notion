"use client";

import { useParams } from "next/navigation";
import { TrackPage } from "@/components/track-page";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <TrackPage key={id} id={id} />;
}
