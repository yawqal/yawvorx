"use client";
import { useState, useEffect } from "react";
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

export default function CoursesClient() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "beginner",
    price_etb: "",
    instructor_name: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch (err) {
      setError("Could not load courses");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);
    setSubmitting(true);
    try {
      let res;
      if (editingId) {
        res = await fetch("/api/admin/courses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            title: formData.title.trim(),
            description: formData.description.trim(),
            level: formData.level,
            price_etb: formData.price_etb === "" ? null : parseFloat(formData.price_etb),
            instructor_name: formData.instructor_name.trim(),
          }),
        });
      } else {
        res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim(),
            level: formData.level,
            price_etb: formData.price_etb === "" ? null : parseFloat(formData.price_etb),
            instructor_name: formData.instructor_name.trim(),
          }),
        });
      }
      if (!res.ok) {
        const result = await res.json();
        setSubmitError(result.error ?? "Failed to save course.");
      } else {
        const result = await res.json();
        setSubmitMessage(result.message ?? "Course saved.");
        if (result.auditWarning) {
          // Optionally show warning
        }
        setFormData({
          title: "",
          description: "",
          level: "beginner",
          price_etb: "",
          instructor_name: "",
        });
        setEditingId(null);
        await fetchCourses();
      }
    } catch (err) {
      setSubmitError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      description: course.description,
      level: course.level,
      price_etb: course.price_etb !== null ? String(course.price_etb) : "",
      instructor_name: course.instructor_name,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      level: "beginner",
      price_etb: "",
      instructor_name: "",
    });
  }

  if (loading) return <p>Loading courses…</p>;
  if (error) return <p role="alert" className="text-red-300">Failed to load courses: {error}</p>;

  return (
    <>
      {/* Form for add/edit */}
      <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-ink-mute mb-1" htmlFor="title">Title*</label>
            <input
              id="title"
              type="text"
              className="block w-full rounded-xl border border-line px-3 py-2 text-ink"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ink-mute mb-1" htmlFor="description">Description*</label>
            <textarea
              id="description"
              className="block w-full rounded-xl border border-line px-3 py-2 text-ink"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ink-mute mb-1" htmlFor="level">Level*</label>
            <select
              id="level"
              className="block w-full rounded-xl border border-line px-3 py-2 text-ink"
              value={formData.level}
              onChange={(e) => handleChange("level", e.target.value)}
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-ink-mute mb-1" htmlFor="price_etb">Price (ETB, optional)</label>
            <input
              id="price_etb"
              type="number"
              min="0"
              step="0.01"
              className="block w-full rounded-xl border border-line px-3 py-2 text-ink"
              value={formData.price_etb}
              onChange={(e) => handleChange("price_etb", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-ink-mute mb-1" htmlFor="instructor_name">Instructor name*</label>
            <input
              id="instructor_name"
              type="text"
              className="block w-full rounded-xl border border-line px-3 py-2 text-ink"
              value={formData.instructor_name}
              onChange={(e) => handleChange("instructor_name", e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          {editingId ? (
            <Button type="button" variant="secondary" onClick={cancelEdit}>
              Cancel edit
            </Button>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {editingId ? "Update Course" : "Add Course"}
          </Button>
        </div>
        {submitError && <p role="alert" className="text-red-300 mt-2">{submitError}</p>}
        {submitMessage && <p role="status" className="text-secondary-soft mt-2">{submitMessage}</p>}
      </form>

      {/* Courses list */}
      <div className="space-y-4">
        <p role="status" aria-live="polite" className="text-secondary-soft"></p>
        <p role="alert" aria-live="polite" className="text-red-300"></p>
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
                    disabled={false}
                    loading={false}
                    onClick={() => {
                      // Implement toggle status
                      const action = "publish";
                      // We'll call the API directly
                      fetch("/api/admin/courses", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: course.id, status: "published" }),
                      })
                        .then(async (res) => {
                          if (!res.ok) {
                            const error = await res.json();
                            throw new Error(error.error ?? "Failed to publish course");
                          }
                          return res.json();
                        })
                        .then(data => {
                          // refresh
                          fetchCourses();
                        })
                        .catch(err => alert(err.message));
                    }}
                  >
                    Publish
                  </Button>
                )}
                {course.status === "published" && (
                  <Button
                    variant="secondary"
                    disabled={false}
                    loading={false}
                    onClick={() => {
                      fetch("/api/admin/courses", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: course.id, status: "draft" }),
                      })
                        .then(async (res) => {
                          if (!res.ok) {
                            const error = await res.json();
                            throw new Error(error.error ?? "Failed to unpublish course");
                          }
                          return res.json();
                        })
                        .then(data => {
                          fetchCourses();
                        })
                        .catch(err => alert(err.message));
                    }}
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
    </>
  );
}