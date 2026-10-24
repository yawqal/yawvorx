import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordAdminAudit } from "@/lib/admin-audit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to slugify a string (lowercase, replace non-alphanumeric with hyphen, trim)
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,slug,description,level,price_etb,instructor_name,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: `Courses could not be loaded: ${error.message}` }, { status: 500 });
  return NextResponse.json({ courses: data ?? [] });
}

export async function POST(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });

  const values = body as Record<string, unknown>;

  const title = typeof values.title === "string" ? values.title.trim() : "";
  if (title === "" || title.length > 200)
    return NextResponse.json({ error: "Title is required and must be <= 200 characters." }, { status: 400 });

  const description = typeof values.description === "string" ? values.description.trim() : "";
  if (description === "" || description.length > 4000)
    return NextResponse.json({ error: "Description is required and must be <= 4000 characters." }, { status: 400 });

  const level = values.level;
  if (!["beginner", "intermediate", "advanced"].includes(level as string))
    return NextResponse.json({ error: "Level must be one of: beginner, intermediate, advanced." }, { status: 400 });

  const priceRaw = values.price_etb;
  let price_etb: number | null = null;
  if (priceRaw !== null && priceRaw !== undefined && priceRaw !== "") {
    const num = Number(priceRaw);
    if (!Number.isFinite(num) || num < 0)
      return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
    price_etb = num;
  }

  const instructor = typeof values.instructor_name === "string" ? values.instructor_name.trim() : "";
  if (instructor === "" || instructor.length > 120)
    return NextResponse.json({ error: "Instructor name is required and must be <= 120 characters." }, { status: 400 });

  // Generate slug from title, ensure uniqueness
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = "course";
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const { data, error } = await supabase.from("courses").select("id").eq("slug", slug).single();
    if (error && error.code !== "PGRST116") {
      // unexpected error
      return NextResponse.json({ error: "Failed to check slug uniqueness." }, { status: 500 });
    }
    if (!data) break; // slug is free
    counter++;
    slug = `${baseSlug}-${counter}`;
    if (counter > 100) return NextResponse.json({ error: "Unable to generate unique slug." }, { status: 500 });
  }

  const { data: created, error: createError } = await supabase
    .from("courses")
    .insert({
      title,
      description,
      level,
      price_etb,
      instructor_name: instructor,
      slug,
      status: "draft", // default status
    })
    .select()
    .single();

  if (createError) return NextResponse.json({ error: `Course could not be created: ${createError.message}` }, { status: 500 });
  if (!created) return NextResponse.json({ error: "Course creation failed: no data returned." }, { status: 500 });

  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: "course.create",
    table_name: "courses",
    record_id: created.id,
    new_data: created,
  });

  return NextResponse.json({ ok: true, message: "Course created.", course: created, ...(audit.ok ? {} : { auditWarning: true }) });
}

export async function PATCH(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });

  const values = body as Record<string, unknown>;

  const id = typeof values.id === "string" ? values.id.trim() : "";
  if (!UUID.test(id))
    return NextResponse.json({ error: "A valid course UUID is required." }, { status: 400 });

  // Fields we allow to update
  const update: Record<string, unknown> = {};

  if (typeof values.title === "string") {
    const title = values.title.trim();
    if (title === "" || title.length > 200)
      return NextResponse.json({ error: "Title must be <= 200 characters." }, { status: 400 });
    update.title = title;
    // also update slug if title changed
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "course";
    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const { data, error } = await supabase.from("courses").select("id").eq("slug", slug).neq("id", id).single();
      if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: "Failed to check slug uniqueness." }, { status: 500 });
      }
      if (!data) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
      if (counter > 100) return NextResponse.json({ error: "Unable to generate unique slug." }, { status: 500 });
    }
    update.slug = slug;
  }

  if (typeof values.description === "string") {
    const desc = values.description.trim();
    if (desc.length > 4000)
      return NextResponse.json({ error: "Description must be <= 4000 characters." }, { status: 400 });
    update.description = desc;
  }

  if (typeof values.level === "string") {
    if (!["beginner", "intermediate", "advanced"].includes(values.level))
      return NextResponse.json({ error: "Level must be one of: beginner, intermediate, advanced." }, { status: 400 });
    update.level = values.level;
  }

  if (typeof values.price_etb !== "undefined" && values.price_etb !== null) {
    if (typeof values.price_etb === "string") {
      const num = Number(values.price_etb);
      if (!Number.isFinite(num) || num < 0)
        return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
    update.price_etb = num;
    } else if (typeof values.price_etb === "number") {
      if (values.price_etb < 0)
        return NextResponse.json({ error: "Price must be non-negative." }, { status: 400 });
      update.price_etb = values.price_etb;
    }
  }

  if (typeof values.instructor_name === "string") {
    const instr = values.instructor_name.trim();
    if (instr === "" || instr.length > 120)
      return NextResponse.json({ error: "Instructor name must be <= 120 characters." }, { status: 400 });
    update.instructor_name = instr;
  }

  if (typeof values.status === "string") {
    if (!["draft", "published"].includes(values.status))
      return NextResponse.json({ error: "Status must be either 'draft' or 'published'." }, { status: 400 });
    update.status = values.status;
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });

  const { data: updated, error: updateError } = await supabase
    .from("courses")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: `Course could not be updated: ${updateError.message}` }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const audit = await recordAdminAudit(supabase, {
    actor: actor.id,
    action: "course.update",
    table_name: "courses",
    record_id: id,
    new_data: updated,
  });

  return NextResponse.json({ ok: true, message: "Course updated.", course: updated, ...(audit.ok ? {} : { auditWarning: true }) });
}