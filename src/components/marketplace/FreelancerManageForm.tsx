"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FreelancerAvatar } from "@/components/marketplace/FreelancerAvatar";

type Package = {
  tier: string;
  title: string;
  description: string;
  price_etb: number | string;
  delivery_days: number;
  revisions: number;
  is_active: boolean;
};

const tiers = ["basic", "standard", "premium"] as const;

export function FreelancerManageForm({
  profile,
  packages,
  userId,
}: {
  profile: {
    display_name: string;
    headline: string | null;
    bio: string | null;
    category: string;
    skills: string[] | string | null;
    availability: string | null;
    starting_price_etb: number | string | null;
    avatar_url: string | null;
  };
  packages: Package[];
  userId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const skills = Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills ?? "";

  function profilePayload(form: HTMLFormElement, photoUrl: string | null) {
    const values = Object.fromEntries(new FormData(form).entries());
    const packageValues = tiers.map((tier) => ({
      tier,
      title: values[`${tier}_title`],
      description: values[`${tier}_description`],
      price_etb: values[`${tier}_price_etb`],
      delivery_days: values[`${tier}_delivery_days`],
      revisions: values[`${tier}_revisions`],
      is_active: values[`${tier}_is_active`] === "true",
    }));
    return { ...values, avatar_url: photoUrl, packages: packageValues };
  }

  async function savePhoto(photoUrl: string | null) {
    const form = formRef.current;
    if (!form) {
      setPhotoStatus("Profile form is unavailable. Please try again.");
      return false;
    }
    setPhotoStatus("Saving photo…");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/freelancers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload(form, photoUrl)),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setPhotoStatus(result.error ?? "Profile photo could not be saved.");
        return false;
      }
      setAvatarUrl(photoUrl);
      setPhotoStatus(photoUrl ? "Photo updated." : "Photo removed.");
      router.refresh();
      return true;
    } catch {
      setPhotoStatus("Could not reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoStatus("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoStatus("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoStatus("Photo must be 2 MB or smaller.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPhotoStatus("Photo upload is not available right now.");
      return;
    }
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    setBusy(true);
    setPhotoStatus("Uploading photo…");
    try {
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("freelancer-photos").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (uploadError) {
        setPhotoStatus(`Photo upload failed: ${uploadError.message}`);
        return;
      }
      const { data } = supabase.storage.from("freelancer-photos").getPublicUrl(path);
      await savePhoto(data.publicUrl);
    } catch {
      setPhotoStatus("Photo upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/freelancers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload(form, avatarUrl)),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setError(result.error ?? "Profile could not be updated.");
        return;
      }
      setMessage(result.message ?? "Profile updated successfully.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <FreelancerAvatar name={profile.display_name} src={avatarUrl} size={72} />
        <div className="grid gap-2">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-xl border border-line px-4 font-semibold focus-within:outline focus-within:outline-2 focus-within:outline-brand">
            Upload photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                void uploadPhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {avatarUrl && <Button type="button" variant="secondary" className="min-h-[44px]" disabled={busy} onClick={() => void savePhoto(null)}>Remove photo</Button>}
        </div>
      </div>
      <p role="status" aria-live="polite" className="mb-4 min-h-5 text-sm text-secondary-soft">{photoStatus}</p>
      <form ref={formRef} className="grid min-w-0 gap-5" onSubmit={submit}>
        <Input label="Display name" name="display_name" defaultValue={profile.display_name} maxLength={80} required />
        <Input label="Headline" name="headline" defaultValue={profile.headline ?? ""} maxLength={120} required />
        <Textarea label="Biography" name="bio" defaultValue={profile.bio ?? ""} minLength={10} maxLength={2000} required />
        <Select label="Category" name="category" defaultValue={profile.category} required>
          {["Design", "Development", "Writing", "Marketing", "Video", "Other"].map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Input label="Skills (comma-separated, up to 10)" name="skills" defaultValue={skills} maxLength={500} required />
        <Select label="Availability" name="availability" defaultValue={profile.availability ?? "available"} required>
          <option value="available">Available</option><option value="limited">Limited availability</option><option value="unavailable">Unavailable</option>
        </Select>
        <Input label="Starting price (ETB, optional)" name="starting_price_etb" type="number" min="0" step="0.01" defaultValue={profile.starting_price_etb ?? ""} />
        <input type="hidden" name="avatar_url" value={avatarUrl ?? ""} readOnly />
        <fieldset className="grid min-w-0 gap-4">
          <legend className="text-xl font-semibold">Packages</legend>
          {tiers.map((tier) => {
            const item = packages.find((pkg) => pkg.tier.toLowerCase() === tier);
            return <div key={tier} className="grid min-w-0 gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
              <h3 className="font-semibold capitalize sm:col-span-2">{tier}</h3>
              <Input label={`${tier} title`} name={`${tier}_title`} defaultValue={item?.title ?? ""} maxLength={100} />
              <Input label={`${tier} description`} name={`${tier}_description`} defaultValue={item?.description ?? ""} maxLength={1000} />
              <Input label={`${tier} price (ETB)`} name={`${tier}_price_etb`} type="number" min="0" step="0.01" defaultValue={item?.price_etb ?? ""} />
              <Input label={`${tier} delivery days`} name={`${tier}_delivery_days`} type="number" min="1" max="365" defaultValue={item?.delivery_days ?? ""} />
              <Input label={`${tier} revisions`} name={`${tier}_revisions`} type="number" min="0" max="100" defaultValue={item?.revisions ?? ""} />
              <Select label={`${tier} package status`} name={`${tier}_is_active`} defaultValue={String(item?.is_active ?? false)}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </Select>
            </div>;
          })}
        </fieldset>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-secondary-soft">{message}</p>
        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-300">{error}</p>
        <Button type="submit" loading={busy}>Save profile</Button>
      </form>
    </Card>
  );
}
