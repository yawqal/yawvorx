import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Courses", description: "Courses from ZIKA are coming soon.", robots: { index: false, follow: false } };
export default function CoursesPage() { return <ComingSoon title="Courses" accent="violet" />; }
