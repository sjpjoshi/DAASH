export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'RAG-Ready',
  description: "Find out what documents and sites your RAG tools can trust with RAG-Ready's API",
  navItems: [
    {
      label: 'Augmented Chat',
      href: '/AugmentedChat',
    },
    {
      label: 'Document Data',
      href: '/DocumentData',
    },
  ],
  navMenuItems: [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'Augmented Chat',
      href: '/AugmentedChat',
    },
    {
      label: 'Document Data',
      href: '/DocumentData',
    },
  ],
  links: {
    github: 'https://github.com/sjpjoshi/DAASH',
    discord: 'https://discord.gg/QXPjkpcx',
  },
};
