"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/States";
import { SetupNotice } from "./SetupNotice";
import { useAuth } from "./AuthProvider";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function FormError({ message }: { message: string }) {
  return message ? <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-sm text-red-300">{message}</p> : null;
}
function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="space-y-2"><h2 className="text-lg font-semibold">{title}</h2><p className="text-ink-mute">{children}</p></Card>;
}

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(linkError ? "That link is invalid or has expired. Please try again." : "");
  const [busy, setBusy] = useState(false);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return <SetupNotice />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!EMAIL.test(email.trim())) found.email = "Enter a valid email address.";
    if (!password) found.password = "Enter your password.";
    setErrors(found); setFormError("");
    if (Object.keys(found).length) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setFormError(error.message.toLowerCase().includes("not confirmed")
        ? "Please confirm your email first. Check your inbox for the confirmation link."
        : "Email or password is incorrect.");
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError message={formError} />
      <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      <p className="text-sm text-ink-mute"><Link href="/forgot-password" className="underline">Forgot your password?</Link> · <Link href="/register" className="underline">Create an account</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return <SetupNotice />;
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (v.name.trim().length < 2) found.name = "Enter your name.";
    if (!EMAIL.test(v.email.trim())) found.email = "Enter a valid email address.";
    if (v.password.length < MIN_PASSWORD) found.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (v.confirm !== v.password) found.confirm = "Passwords do not match.";
    setErrors(found); setFormError("");
    if (Object.keys(found).length) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: v.email.trim(), password: v.password,
      options: { data: { full_name: v.name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` },
    });
    setBusy(false);
    if (error) { setFormError("We could not create the account. Check your details and try again."); return; }
    if (data.session) { router.replace("/account"); router.refresh(); return; }
    setSent(true);
  };

  if (sent) return <Notice title="Check your email">If this is a new address, we sent a confirmation link. Open it to finish creating your account, then sign in.</Notice>;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError message={formError} />
      <Input label="Full name" autoComplete="name" value={v.name} onChange={set("name")} error={errors.name} />
      <Input label="Email" type="email" autoComplete="email" value={v.email} onChange={set("email")} error={errors.email} />
      <Input label="Password" type="password" autoComplete="new-password" value={v.password} onChange={set("password")} error={errors.password} hint={`At least ${MIN_PASSWORD} characters.`} />
      <Input label="Confirm password" type="password" autoComplete="new-password" value={v.confirm} onChange={set("confirm")} error={errors.confirm} />
      <Button type="submit" loading={busy} className="w-full">Create account</Button>
      <p className="text-sm text-ink-mute">Already registered? <Link href="/login" className="underline">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return <SetupNotice />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) { setError("Enter a valid email address."); return; }
    setError(""); setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false);
    setSent(true); // same message whether or not the email exists, so nobody can probe for accounts
  };

  if (sent) return <Notice title="Check your email">If an account exists for that address, we sent a link to reset your password.</Notice>;
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
      <Button type="submit" loading={busy} className="w-full">Send reset link</Button>
    </form>
  );
}

export function ResetForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return <SetupNotice />;
  if (loading) return <LoadingState />;
  if (!user) return <Notice title="Link needed">Open the reset link from your email to choose a new password. <Link href="/forgot-password" className="underline">Request a new link</Link>.</Notice>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (password.length < MIN_PASSWORD) found.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) found.confirm = "Passwords do not match.";
    setErrors(found); setFormError("");
    if (Object.keys(found).length) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setFormError("We could not update your password. Request a new reset link and try again."); return; }
    setDone(true);
    router.refresh();
  };

  if (done) return <Notice title="Password updated">Your password has been changed. <Link href="/account" className="underline">Go to your account</Link>.</Notice>;
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError message={formError} />
      <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint={`At least ${MIN_PASSWORD} characters.`} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
      <Button type="submit" loading={busy} className="w-full">Update password</Button>
    </form>
  );
}
