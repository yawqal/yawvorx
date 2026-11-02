"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  price_etb: number | null;
  instructor_name: string;
  status: string;
  created_at: string
};

export function CourseReview({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function toggleStatus(course: Course, action: "publish" | "unpublish") {
    setBusy(course.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: course.id,
          status: action === "publish" ? "published" : "draft"
        }),
      });
      const result = await response.json() as { error?: string; message?: string; auditWarning?: boolean };
      if (!response.ok) {
        setError(result.error ?? "Course update failed.");
        return;
      }
      setMessage(`${result.message ?? "Course updated."}${result.auditWarning ? " Audit logging needs attention." : ""}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="text-secondary-soft">{message}</p>
      <p role="alert" aria-live="polite" className="text-red-300">{error}</p>
      {courses.map((course) => (
        <Card key={course.id}>
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge>{course.level}</Badge>
                <Badge>{course.status}</Badge>
              </div>
              <h2 className="mt-3 break-words font-semibold">{course.title}</h2>
              <p className="break-all text-sm text-ink-mute">/{course.slug}</p>
              {course.description && (
                <p className="mt-1 text-sm text-ink-mute">{course.description.slice(0, 100)}{course.description.length > 100 ? "…" : ""}</p>
              )}
              <p className="mt-1 text-sm text-ink-mute">
                Instructor: {course.instructor_name}{course.price_etb !== null ? ` • Price: ETB ${course.price_etb}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.status === "draft" && (
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  loading={busy === course.id}
                  onClick={() => void toggleStatus(course, "publish")}
                >
                  Publish
                </Button>
              )}
              {course.status === "published" && (
                <Button
                  variant="secondary"
                  disabled={busy !== null}
                  loading={busy === course.id}
                  onClick={() => void toggleStatus(course, "unpublish")}
                >
                  Unpublish
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
      {courses.length === 0 && (
        <Card>
          <p className="text-ink-mute">No courses yet.</p>
        </Card>
      )}
    </div>
  );
}