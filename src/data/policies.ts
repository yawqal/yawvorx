// DRAFT TEMPLATES. They are not legal advice and do not guarantee compliance.
// The business owner must review and customise every [bracketed] item before publishing.
export type Policy = { slug: string; path: string; title: string; summary: string; sections: { h: string; p: string[] }[] };

export const policies: Policy[] = [
  { slug: "privacy", path: "/privacy", title: "Privacy Policy", summary: "How personal information is collected and used.", sections: [
    { h: "Information we collect", p: ["Details you submit through forms, such as your name, contact details, delivery address, and project or order information.", "Account details if you register. Passwords are handled by the authentication provider and are never stored by us in plain text."] },
    { h: "How we use it", p: ["To reply to requests, process orders, and provide support. [Add any other purposes you actually use.]"] },
    { h: "Sharing and retention", p: ["[Describe which services process your data, such as hosting and database providers, and how long you keep records.]"] },
    { h: "Your choices", p: ["[Explain how people can request access, correction, or deletion, and which contact to use.]"] },
  ]},
  { slug: "terms", path: "/terms", title: "Terms and Conditions", summary: "The rules for using the website and buying from YAWVOREX.", sections: [
    { h: "Using the website", p: ["By using this website you agree to use it lawfully and not to attempt unauthorised access."] },
    { h: "Services and orders", p: ["Project requests and product orders are not final until YAWVOREX confirms them. [Add your acceptance process.]"] },
    { h: "Pricing and payment", p: ["Prices are shown in the store currency. Manual payments are confirmed only after verification by an administrator."] },
    { h: "Liability and governing law", p: ["[Add your limitation of liability and governing law with legal guidance. Business registration details: add if applicable.]"] },
  ]},
  { slug: "shipping", path: "/shipping-policy", title: "Shipping Policy", summary: "How physical products are delivered.", sections: [
    { h: "Where we ship", p: ["[List the countries or regions you ship to.]"] },
    { h: "Costs and timing", p: ["[Add shipping costs and estimated delivery times.]"] },
    { h: "Tracking and problems", p: ["[Explain how customers receive updates and what to do about delays or damage.]"] },
  ]},
  { slug: "returns", path: "/returns", title: "Returns and Refunds", summary: "When returns and refunds are possible.", sections: [
    { h: "Physical products", p: ["[Add your return window, product condition requirements, and who pays return shipping.]"] },
    { h: "Services", p: ["[Explain how refunds work for service work already started or delivered.]"] },
    { h: "How refunds are paid", p: ["[Add the refund method and processing time.]"] },
  ]},
  { slug: "digital", path: "/digital-policy", title: "Digital Product Policy", summary: "Delivery and use of downloadable products.", sections: [
    { h: "Delivery", p: ["Access is provided only after payment is confirmed. [Describe the delivery method once the download system is set up.]"] },
    { h: "License and use", p: ["[State what buyers may and may not do with the files, for example personal or commercial use and redistribution.]"] },
    { h: "Refunds on digital goods", p: ["[State whether digital products are refundable and under what conditions.]"] },
  ]},
];
