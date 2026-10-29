"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ServiceCard } from "@/components/cards/Cards";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Camera, Code2, Palette, PanelsTopLeft, ShoppingBag, Video } from "lucide-react";
import type { Service } from "@/data/services";

interface AiToolsClientProps {
  services: Service[];
}

export default function AiToolsClient({ services }: AiToolsClientProps) {
  const [search, setSearch] = useState("");

  const filteredServices = services.filter((service) => {
    const lowerSearch = search.toLowerCase();
    return (
      service.title.toLowerCase().includes(lowerSearch) ||
      service.description.toLowerCase().includes(lowerSearch) ||
      service.deliverables.some((d) => d.toLowerCase().includes(lowerSearch))
    );
  });

  // Simple string hash function for consistent icon assignment
  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  return (
    <>
      <PageHeader title="AI Tools & Services" intro="Explore our AI-powered creative and digital services.">
        <Badge>Availability confirmed on inquiry</Badge>
      </PageHeader>

      {/* Search Bar */}
      <Container className="mx-auto w-full px-5 sm:px-8 lg:px-12 py-8">
        <div className="max-w-xl mx-auto">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search services by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-line bg-white/80 px-5 py-3 text-ink focus:border-violet/40 focus:bg-white focus:ring-2 focus:ring-violet/20"
            />
          </div>
          <p className="text-center text-sm text-ink-mute">
            {filteredServices.length} of {services.length} services match your search
          </p>
        </div>
      </Container>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <Container className="mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16">
          <h2 className="mb-6 text-2xl font-semibold leading-tight sm:text-3xl text-center">
            Discover Our Services
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const icons = [PanelsTopLeft, Code2, Palette, Video, Camera, ShoppingBag];
              const Icon = icons[Math.abs(hashCode(service.slug)) % icons.length];
              return (
                <ServiceCard
                  key={service.slug}
                  s={service}
                  full
                  icon={<Icon size={20} strokeWidth={1.7} />}
                />
              );
            })}
          </div>
        </Container>
      ) : (
        <Container className="py-20 text-center">
          <p className="text-ink-mute">No services match your search. Try adjusting your filters.</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => setSearch("")}>
            Clear Search
          </Button>
        </Container>
      )}
    </>
  );
}
