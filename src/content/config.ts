// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    type: 'content',
    schema: docsSchema({
      extend: z.object({
        date: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),
        order: z.number().optional(),
      }),
    }),
  }),
};
