export const CATEGORY_SLUGS = [
  'fruit',
  'vegetable',
  'protein',
  'spice',
  'grain',
  'fat-oil',
  'beverage',
  'fermented',
  'nut-seed',
  'legume',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  fruit: 'Fruit',
  vegetable: 'Vegetable',
  protein: 'Protein',
  spice: 'Spice',
  grain: 'Grain',
  'fat-oil': 'Fat / Oil',
  beverage: 'Beverage',
  fermented: 'Fermented',
  'nut-seed': 'Nut / Seed',
  legume: 'Legume',
};

export const CONDITION_SLUGS = [
  'migraine',
  'arthritis',
  'gut',
  'cardiovascular',
  'autoimmune',
  'skin',
  'pain',
  'neurological',
] as const;

export type ConditionSlug = (typeof CONDITION_SLUGS)[number];

export const CONDITION_LABELS: Record<ConditionSlug, string> = {
  migraine: 'Migraines',
  arthritis: 'Arthritis',
  gut: 'Gut Health',
  cardiovascular: 'Cardiovascular',
  autoimmune: 'Autoimmune',
  skin: 'Skin Health',
  pain: 'Chronic Pain',
  neurological: 'Neurological',
};

export type EvidenceStrength = 'strong' | 'moderate' | 'emerging';

export interface ActiveCompound {
  name: string;
  mechanism: string;
}

export interface Citation {
  title: string;
  journal: string;
  year: number;
  url?: string;
}

export interface FoodTips {
  preparation?: string;
  dosage?: string;
  bioavailability?: string;
  cautions?: string;
}

export interface Food {
  id: string;
  name: string;
  category: CategorySlug;
  description: string;
  antiInflammatoryScore: number;
  activeCompounds: ActiveCompound[];
  conditions: ConditionSlug[];
  evidenceStrength: EvidenceStrength;
  citations: Citation[] | null;
  tips: FoodTips;
}

export interface FilterState {
  q: string;
  category: CategorySlug | null;
  condition: ConditionSlug | null;
  minScore: number;
  evidence: 'all' | EvidenceStrength;
  view: 'grid' | 'list';
  sort: 'score' | 'name';
}

export const DEFAULT_FILTER_STATE: FilterState = {
  q: '',
  category: null,
  condition: null,
  minScore: 1,
  evidence: 'all',
  view: 'grid',
  sort: 'score',
};
