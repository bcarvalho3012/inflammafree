import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CONDITION_SLUGS } from './lib/types';

const conditions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/conditions' }),
  schema: z.object({
    slug: z.enum(CONDITION_SLUGS),
    name: z.string(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    shortDescription: z.string(),
    pathways: z.array(z.string()).min(1),
    dietaryPatterns: z.array(z.object({
      name: z.string(),
      evidence: z.string(),
    })).default([]),
    foodsToAvoid: z.array(z.object({
      name: z.string(),
      reason: z.string(),
    })).default([]),
  }),
});

const standalone = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/standalone' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { conditions, standalone };
