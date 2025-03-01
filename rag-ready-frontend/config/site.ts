export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "RAG-Ready",
  description:
    "Find out what documents and sites your RAG tools can trust with RAG-Ready's API",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Augmented Chat",
      href: "/Chat",
    },
    {
      label: "Document Data",
      href: "/TrustData",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Augmented Chat",
      href: "/Chat",
    },
    {
      label: "Document Data",
      href: "/TrustData",
    },
  ],
  links: {
    github: "https://github.com/sjpjoshi/DAASH",
    discord: "https://discord.gg/QXPjkpcx",
  },
};
