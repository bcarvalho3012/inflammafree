import { describe, it, expect } from 'vitest';
import { filterFoods, sortFoods } from '../src/lib/filter';
import type { Food, FilterState } from '../src/lib/types';
import { DEFAULT_FILTER_STATE } from '../src/lib/types';

const food = (overrides: Partial<Food>): Food => ({
  id: overrides.id ?? 'test-food',
  name: overrides.name ?? 'Test Food',
  category: overrides.category ?? 'fruit',
  description: overrides.description ?? 'A test food entry.',
  antiInflammatoryScore: overrides.antiInflammatoryScore ?? 5,
  activeCompounds: overrides.activeCompounds ?? [{ name: 'compoundA', mechanism: 'mech' }],
  conditions: overrides.conditions ?? ['migraine'],
  evidenceStrength: overrides.evidenceStrength ?? 'moderate',
  citations: overrides.citations ?? null,
  tips: overrides.tips ?? {},
});

const filterWith = (overrides: Partial<FilterState>): FilterState => ({
  ...DEFAULT_FILTER_STATE,
  ...overrides,
});

describe('filterFoods', () => {
  const corpus: Food[] = [
    food({ id: 'turmeric', name: 'Turmeric', category: 'spice', conditions: ['migraine', 'arthritis'], antiInflammatoryScore: 9, evidenceStrength: 'strong', activeCompounds: [{ name: 'Curcumin', mechanism: '...' }] }),
    food({ id: 'salmon', name: 'Salmon', category: 'protein', conditions: ['cardiovascular'], antiInflammatoryScore: 9, evidenceStrength: 'strong', activeCompounds: [{ name: 'EPA', mechanism: '...' }] }),
    food({ id: 'apple', name: 'Apple', category: 'fruit', conditions: ['gut'], antiInflammatoryScore: 4, evidenceStrength: 'emerging', activeCompounds: [{ name: 'Quercetin', mechanism: '...' }] }),
  ];

  it('returns all foods when no filters are active', () => {
    expect(filterFoods(corpus, DEFAULT_FILTER_STATE)).toHaveLength(3);
  });

  it('filters by name (case-insensitive substring)', () => {
    const result = filterFoods(corpus, filterWith({ q: 'TUR' }));
    expect(result.map((f) => f.id)).toEqual(['turmeric']);
  });

  it('filters by description content', () => {
    const corpus2: Food[] = [food({ id: 'a', description: 'rich in oleocanthal' }), food({ id: 'b', description: 'high in fiber' })];
    expect(filterFoods(corpus2, filterWith({ q: 'oleocanthal' }))).toHaveLength(1);
  });

  it('filters by active compound name', () => {
    const result = filterFoods(corpus, filterWith({ q: 'curcumin' }));
    expect(result.map((f) => f.id)).toEqual(['turmeric']);
  });

  it('filters by category (single-select)', () => {
    const result = filterFoods(corpus, filterWith({ category: 'protein' }));
    expect(result.map((f) => f.id)).toEqual(['salmon']);
  });

  it('filters by condition membership', () => {
    const result = filterFoods(corpus, filterWith({ condition: 'migraine' }));
    expect(result.map((f) => f.id)).toEqual(['turmeric']);
  });

  it('filters by minimum score', () => {
    const result = filterFoods(corpus, filterWith({ minScore: 8 }));
    expect(result.map((f) => f.id).sort()).toEqual(['salmon', 'turmeric']);
  });

  it('filters by evidence strength when set to a specific tier', () => {
    const result = filterFoods(corpus, filterWith({ evidence: 'emerging' }));
    expect(result.map((f) => f.id)).toEqual(['apple']);
  });

  it('combines multiple filters with AND semantics', () => {
    const result = filterFoods(corpus, filterWith({ category: 'spice', condition: 'arthritis', minScore: 5 }));
    expect(result.map((f) => f.id)).toEqual(['turmeric']);
  });

  it('returns empty array when no foods match', () => {
    const result = filterFoods(corpus, filterWith({ q: 'nonexistentingredient' }));
    expect(result).toEqual([]);
  });
});

describe('sortFoods', () => {
  const corpus: Food[] = [
    food({ id: 'a', name: 'Almond', antiInflammatoryScore: 6 }),
    food({ id: 'z', name: 'Zucchini', antiInflammatoryScore: 8 }),
    food({ id: 'm', name: 'Mango', antiInflammatoryScore: 8 }),
  ];

  it('sorts by score descending, then alphabetically by name', () => {
    const result = sortFoods(corpus, 'score');
    expect(result.map((f) => f.id)).toEqual(['m', 'z', 'a']);
  });

  it('sorts alphabetically by name when sort is "name"', () => {
    const result = sortFoods(corpus, 'name');
    expect(result.map((f) => f.id)).toEqual(['a', 'm', 'z']);
  });

  it('does not mutate the input array', () => {
    const input = [...corpus];
    const original = [...input];
    sortFoods(input, 'score');
    expect(input).toEqual(original);
  });
});
