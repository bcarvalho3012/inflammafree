import rawFoods from '../data/foods.json';
import { foodsArraySchema } from './schemas';
import type { Food } from './types';

const parsed = foodsArraySchema.safeParse(rawFoods);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`foods.json failed validation:\n${formatted}`);
}

export const allFoods: readonly Food[] = parsed.data;

export function findFoodById(id: string): Food | undefined {
  return allFoods.find((food) => food.id === id);
}
