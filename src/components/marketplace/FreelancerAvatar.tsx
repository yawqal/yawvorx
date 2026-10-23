export function FreelancerAvatar({ name, src, size }: { name: string; src?: string | null; size: number }) {
  if (src?.startsWith("https://")) {
    return <img
      src={src}
      width={size}
      height={size}
      className="rounded-full object-cover"
      alt={name}
      loading="lazy"
    />;
  }

  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-obsidian-800 font-semibold text-ink"
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
