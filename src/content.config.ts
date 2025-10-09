import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "./config";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    desc: z.string().optional(),
    author: z.string().default(SITE.author),
    slug: z.string(),
    pubdate: z.date(),
    moddate: z.date().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    katex: z.boolean().optional(),
    status: z.enum(["pinned", "deprecated"]).optional(),
  }),
});

export const collections = {
  blog,
};
