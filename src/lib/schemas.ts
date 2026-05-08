import { z } from 'zod';
import { CATEGORY_SLUGS, CONDITION_SLUGS } from './types';

const citationSchema = z.object({
  title: z.string().min(1),
  journal: z.string().min(1),
  year: z.number().int().gte(1900).lte(new Date().getFullYear()),
  url: z.string().url().optional(),
});

const activeCompoundSchema = z.object({
  name: z.string().min(1),
  mechanism: z.string().min(1),
});

const tipsSchema = z.object({
  preparation: z.string().optional(),
  dosage: z.string().optional(),
  bioavailability: z.string().optional(),
  cautions: z.string().optional(),
});

export const foodSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
  name: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  description: z.string().min(10),
  antiInflammatoryScore: z.number().int().gte(1).lte(10),
  activeCompounds: z.array(activeCompoundSchema).min(1),
  conditions: z.array(z.enum(CONDITION_SLUGS)).min(1),
  evidenceStrength: z.enum(['strong', 'moderate', 'emerging']),
  citations: z.array(citationSchema).min(1).nullable(),
  tips: tipsSchema,
});

export const foodsArraySchema = z.array(foodSchema)
  .superRefine((foods, ctx) => {
    const seen = new Set<string>();
    foods.forEach((food, index) => {
      if (seen.has(food.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'id'],
          message: `duplicate food id: ${food.id}`,
        });
      }
      seen.add(food.id);
    });
  });
