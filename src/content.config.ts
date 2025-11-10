import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    type: 'content',
    schema: docsSchema(),
  }),

  luna: defineCollection({
    type: 'content',
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        date: z.string().optional(), // e.g. "2025-02-01"
      }),
  }),
};
