import type { Food, FilterState } from './types';

export function filterFoods(foods: readonly Food[], state: FilterState): Food[] {
  return foods.filter((food) => {
    if (state.q && !matchesQuery(food, state.q)) return false;
    if (state.category && food.category !== state.category) return false;
    if (state.condition && !food.conditions.includes(state.condition)) return false;
    if (food.antiInflammatoryScore < state.minScore) return false;
    if (state.evidence !== 'all' && food.evidenceStrength !== state.evidence) return false;
    return true;
  });
}

function matchesQuery(food: Food, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (food.name.toLowerCase().includes(needle)) return true;
  if (food.description.toLowerCase().includes(needle)) return true;
  return food.activeCompounds.some((c) => c.name.toLowerCase().includes(needle));
}

export function sortFoods(foods: readonly Food[], sort: FilterState['sort']): Food[] {
  const copy = [...foods];
  if (sort === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    copy.sort((a, b) => {
      if (b.antiInflammatoryScore !== a.antiInflammatoryScore) {
        return b.antiInflammatoryScore - a.antiInflammatoryScore;
      }
      return a.name.localeCompare(b.name);
    });
  }
  return copy;
}
