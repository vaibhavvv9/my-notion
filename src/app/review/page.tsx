import type { Metadata } from "next";
import { Review } from "@/components/review";

export const metadata: Metadata = { title: "Revision" };

export default function Page() {
  return <Review />;
}
