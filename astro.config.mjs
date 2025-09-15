import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGithubAlerts from "remark-github-blockquote-alert";
import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.website,

  integrations: [
    sitemap({
      changefreq: "weekly",
    }),
    expressiveCode({
      themes: ['github-light', 'dracula'],
      themeCssSelector: (theme) => {
        if (theme.name === 'github-light') return "[data-theme='light']";
        if (theme.name === 'dracula') return "[data-theme='dark']";
        return ':root';
      },
      wrap: false,
      styleOverrides: {
        borderWidth: "1px",
        codeFontFamily: "var(--font-code)",
        codeFontSize: "0.75rem",
        codePaddingInline: "1.5rem",
      },
    })
  ],

  markdown: {
    // shikiConfig: {
    //   themes: {
    //     light: "catppuccin-latte",
    //     dark: "plastic",
    //   },
    //   wrap: false,
    //   defaultColor: false,
    // },
    remarkPlugins: [remarkMath, remarkGithubAlerts],
    rehypePlugins: [rehypeKatex],
  },

  output: "static",

  vite: {
    plugins: [tailwindcss()],
  },

  experimental: {
    fonts: [
      {
        name: "Jost",
        cssVariable: "--font-Jost",
        provider: fontProviders.fontsource(),
        weights: [400],
        styles: ["normal"],
        subsets: ["latin"],
      },
      {
        name: "Libertinus Serif",
        cssVariable: "--font-Libertinus",
        provider: fontProviders.fontsource(),
        weights: [400, 700],
        styles: ["normal", "italic"],
        subsets: ["latin"],
        fallbacks: ["Palatino", "Palatino Linotype"],
      },
    ],
  },
});