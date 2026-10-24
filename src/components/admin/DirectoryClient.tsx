"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DirectoryReview } from "./DirectoryReview";

type Business = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  city: string;
  website: string;
  public_email: string;
  public_phone: string;
  status: string;
  created_at: string
};

export default function DirectoryClient() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    fetchBusinesses();
  }, []);

  async function fetchBusinesses() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/directory");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBusinesses(data.businesses ?? []);
    } catch (err) {
      setError("Could not load businesses");
    } finally {
      setLoading(false);
    }
  }

  const filtered = businesses.filter(biz => {
    if (filter === "all") return true;
    return biz.status === filter;
  });

  // Order: pending first, then approved, then rejected
  const ordered = [...filtered].sort((a, b) => {
    const orderPending = { pending: 0, approved: 1, rejected: 2 };
    const aOrder = orderPending[a.status as keyof typeof orderPending] ?? 3;
    const bOrder = orderPending[b.status as keyof typeof orderPending] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFilter(e.target.value as any);
  }

  async function updateStatus(business: Business, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/admin/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          status: action === "approve" ? "approved" : "rejected"
        }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error ?? "Failed to update");
      }
      await fetchBusinesses();
    } catch (err) {
      // error handling could be improved; for simplicity we refetch and let UI show stale data
      await fetchBusinesses();
    }
  }

  if (loading) return <p>Loading businesses…</p>;
  if (error) return <p role="alert" className="text-red-300">Failed to load businesses: {error}</p>;

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm text-ink-mute mb-1" htmlFor="status-filter">Show:</label>
        <select
          id="status-filter"
          className="block w-sm rounded-xl border border-line px-3 py-2 text-ink"
          value={filter}
          onChange={handleFilterChange}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DirectoryReview businesses={ordered} onUpdate={updateStatus} />
    </>
  );
}