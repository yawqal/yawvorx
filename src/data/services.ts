// EDIT HERE to change services. Deliverables are typical examples: exact scope is confirmed per project.
export type Service = { slug: string; title: string; description: string; deliverables: string[] };

export const services: Service[] = [
  { slug: "website-design", title: "Website Design", description: "Visual design for websites: layout, typography, colour, and mobile-first screens that match your brand.", deliverables: ["Page layouts", "Mobile and desktop designs", "Style guide", "Design hand-off"] },
  { slug: "website-development", title: "Website Development", description: "Fast, responsive, accessible websites built with modern tools and ready to grow with your business.", deliverables: ["Responsive pages", "Contact and request forms", "Basic SEO setup", "Deployment guidance"] },
  { slug: "graphic-design", title: "Graphic Design", description: "Posters, social media graphics, flyers, and print-ready artwork with a consistent look.", deliverables: ["Social media graphics", "Posters and flyers", "Print-ready files", "Source files by agreement"] },
  { slug: "branding-visual-identity", title: "Branding and Visual Identity", description: "A clear identity system so your business looks recognisable everywhere.", deliverables: ["Logo concepts", "Colour and type system", "Brand guidelines", "Social profile assets"] },
  { slug: "video-editing", title: "Video Editing", description: "Editing for short-form and promotional videos: cuts, pacing, titles, colour, and sound clean-up.", deliverables: ["Edited video", "Captions or titles", "Format exports for social platforms"] },
  { slug: "photo-editing", title: "Photo Editing", description: "Retouching, colour correction, and consistent edits for product and personal photos.", deliverables: ["Colour correction", "Retouching", "Background clean-up", "Web-optimised exports"] },
  { slug: "ecommerce-development", title: "E-commerce Website Development", description: "Online stores with product catalogs, carts, and order handling suited to how you sell.", deliverables: ["Product catalog", "Cart and ordering flow", "Order management", "Payment setup guidance"] },
  { slug: "creative-digital-solutions", title: "Creative Digital Solutions", description: "Custom digital ideas for projects that do not fit a standard package: tell us the goal and we will propose an approach.", deliverables: ["Concept proposal", "Scope and timeline", "Delivery as agreed"] },
  { slug: "ai-assisted-creative", title: "AI-Assisted Creative Services", description: "Creative production supported by AI tools, always reviewed and refined by a person before delivery.", deliverables: ["Concept exploration", "Draft assets", "Human review and refinement"] },
];
