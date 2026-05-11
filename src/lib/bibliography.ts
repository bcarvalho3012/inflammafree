import { allFoods } from './foods';
import { CONDITION_SLUGS, CONDITION_LABELS } from './types';
import type { Citation, ConditionSlug } from './types';

export interface BibliographyGroup {
  condition: ConditionSlug;
  conditionLabel: string;
  entries: Array<{ foodName: string; citation: Citation }>;
}

export function buildBibliography(): BibliographyGroup[] {
  return CONDITION_SLUGS.map((condition) => {
    const entries: Array<{ foodName: string; citation: Citation }> = [];
    for (const food of allFoods) {
      if (!food.conditions.includes(condition)) continue;
      if (!food.citations) continue;
      for (const citation of food.citations) {
        entries.push({ foodName: food.name, citation });
      }
    }
    entries.sort((a, b) => a.citation.year - b.citation.year);
    return {
      condition,
      conditionLabel: CONDITION_LABELS[condition],
      entries,
    };
  }).filter((group) => group.entries.length > 0);
}
