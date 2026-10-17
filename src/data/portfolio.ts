// SAMPLE CONCEPTS ONLY. These are NOT client work. Replace with real projects (Phase 4 moves this to the database).
export type Project = {
  slug: string; title: string; category: string;
  tags: string[]; summary: string; brief: string; approach: string; deliverables: string[]; liveUrl?: string; isDemo?: boolean;
};

export const projectCategories = ["Web", "Branding", "Video", "Photo"] as const;

export const projects: Project[] = [
  { slug: "concept-luxury-storefront", title: "Luxury Storefront", category: "Web", tags: ["E-commerce", "Mobile-first"], summary: "A sample concept for a dark, premium online store.", brief: "An imagined brief: a small brand wants a store that feels premium on a phone.", approach: "Large product imagery, a short checkout path, and calm dark surfaces with one accent colour.", deliverables: ["Home and product page designs", "Cart flow", "Component library"] },
  { slug: "concept-studio-identity", title: "Studio Identity System", category: "Branding", tags: ["Logo", "Guidelines"], summary: "A sample concept for a visual identity with a monogram and colour system.", brief: "An imagined brief: a new creative studio needs a recognisable mark and a consistent look.", approach: "A simple geometric monogram, two accent colours, and clear usage rules.", deliverables: ["Logo concept", "Colour and type rules", "Social profile set"] },
  { slug: "concept-launch-reel", title: "Product Launch Reel", category: "Video", tags: ["Short-form", "Social"], summary: "A sample concept for a 20-second vertical promo.", brief: "An imagined brief: announce a product in a short vertical video.", approach: "Tight pacing, bold captions, and a clear call to action in the final seconds.", deliverables: ["Edited reel", "Caption styling", "Platform exports"] },
  { slug: "concept-product-retouch", title: "Product Photo Retouch", category: "Photo", tags: ["Retouching", "Colour"], summary: "A sample concept for consistent product photo edits.", brief: "An imagined brief: a seller needs a clean, consistent set of product photos.", approach: "Matching colour, clean backgrounds, and web-friendly file sizes.", deliverables: ["Colour-corrected photos", "Background clean-up", "Optimised exports"] },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
