import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGithubAlert from "./src/plugins/remark-github-alert.mjs";
import remarkPlatformIcon from "./src/plugins/remark-platform-icon.mjs";
import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.website,

  integrations: [
    sitemap({
      changefreq: "weekly",
    }),
    expressiveCode({
      themes: ['catppuccin-mocha', 'catppuccin-latte'],
      themeCssSelector: (theme) => {
        if (theme.name === 'catppuccin-latte') return "[data-theme='light']";
        if (theme.name === 'catppuccin-mocha') return "[data-theme='dark']";
        return ':root';
      },
      wrap: false,
      styleOverrides: {
        borderColor: "color-mix(in srgb, var(--muted) 20%, transparent)",
        borderRadius: '0',
        codeFontFamily: "var(--font-code)",
        codeFontSize: "0.75rem",
        codePaddingInline: "1.5rem",
        frames: {
          frameBoxShadowCssValue: false,
        },
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
    remarkPlugins: [remarkMath, remarkGithubAlert, remarkPlatformIcon],
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