import { defineCollection, z } from 'astro:content';
import { CONDITION_SLUGS } from '../lib/types';

const conditions = defineCollection({
  type: 'content',
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

export const collections = { conditions };
