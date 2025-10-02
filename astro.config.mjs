import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import remarkMath from "remark-math";
import remarkGithubAlert from "./src/plugins/remark-github-alert.mjs";
import remarkPlatformIcon from "./src/plugins/remark-platform-icon.mjs";
import remarkGraphviz from './src/plugins/remark-graphviz.mjs';
import rehypeKatex from "rehype-katex";
import rehypeTypst from "./src/plugins/rehype-typst.mjs";
import d2 from "astro-d2";
import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.website,
  trailingSlash: 'never',
  integrations: [sitemap(), d2({
    layout: "elk",
  }), expressiveCode({
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
  }), react()],

  markdown: {
    // shikiConfig: {
    //   themes: {
    //     light: "catppuccin-latte",
    //     dark: "plastic",
    //   },
    //   wrap: false,
    //   defaultColor: false,
    // },
    remarkRehype: { allowDangerousHtml: true },
    remarkPlugins: [remarkMath, remarkGithubAlert, remarkPlatformIcon, remarkGraphviz],
    rehypePlugins: [rehypeKatex, rehypeTypst],
  },

  output: "static",

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // 避免被打包器错误处理
      external: ['@myriaddreamin/typst-ts-node-compiler'],
    },
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
