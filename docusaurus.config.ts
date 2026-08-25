import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "StellarNotify",
  tagline: "On-chain event notification infrastructure for Stellar/Soroban",
  favicon: "img/favicon.ico",
  url: "https://stellarnotify.dev",
  baseUrl: "/",
  organizationName: "yourusername",
  projectName: "stellarnotify-docs",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: { defaultLocale: "en", locales: ["en"] },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/yourusername/stellarnotify-docs/tree/main/",
          routeBasePath: "/",
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      },
    ],
  ],
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],
  themeConfig: {
    colorMode: { defaultMode: "dark", respectPrefersColorScheme: false },
    navbar: {
      title: "StellarNotify",
      logo: { alt: "StellarNotify Logo", src: "img/logo.svg" },
      items: [
        { type: "docSidebar", sidebarId: "tutorialSidebar", position: "left", label: "Docs" },
        {
          href: "https://github.com/yourusername/stellarnotify-contract",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Introduction", to: "/" },
            { label: "Quick Start", to: "/quick-start" },
            { label: "Contract Reference", to: "/contract-overview" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "GitHub", href: "https://github.com/yourusername/stellarnotify-contract" },
            { label: "Stellar Discord", href: "https://discord.gg/stellar" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} StellarNotify. MIT License.`,
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ["rust", "toml", "bash", "json"],
    },
  },
};

export default config;
