import { useEffect, useMemo, useState } from 'react';
import type { Food, FilterState } from '../../lib/types';
import { DEFAULT_FILTER_STATE, CATEGORY_SLUGS, CONDITION_SLUGS } from '../../lib/types';
import { filterFoods, sortFoods } from '../../lib/filter';
import FilterBar from './FilterBar';
import ResultsHeader from './ResultsHeader';
import FoodCardLink from './FoodCardLink';

interface Props {
  foods: Food[];
  base: string;
}

const EVIDENCE_VALUES = ['all', 'strong', 'moderate', 'emerging'] as const;
const SORT_VALUES = ['score', 'name'] as const;
const VIEW_VALUES = ['grid', 'list'] as const;

function readStateFromUrl(): FilterState {
  if (typeof window === 'undefined') return DEFAULT_FILTER_STATE;
  const params = new URLSearchParams(window.location.search);

  const q = params.get('q') ?? '';

  const categoryParam = params.get('category');
  const category = (CATEGORY_SLUGS as readonly string[]).includes(categoryParam ?? '')
    ? (categoryParam as FilterState['category']) : null;

  const conditionParam = params.get('condition');
  const condition = (CONDITION_SLUGS as readonly string[]).includes(conditionParam ?? '')
    ? (conditionParam as FilterState['condition']) : null;

  const minScoreParam = parseInt(params.get('score') ?? '1', 10);
  const minScore = Number.isFinite(minScoreParam) && minScoreParam >= 1 && minScoreParam <= 10
    ? minScoreParam : 1;

  const evidenceParam = params.get('evidence') ?? 'all';
  const evidence = (EVIDENCE_VALUES as readonly string[]).includes(evidenceParam)
    ? (evidenceParam as FilterState['evidence']) : 'all';

  const sortParam = params.get('sort') ?? 'score';
  const sort = (SORT_VALUES as readonly string[]).includes(sortParam)
    ? (sortParam as FilterState['sort']) : 'score';

  const viewParam = params.get('view') ?? 'grid';
  const view = (VIEW_VALUES as readonly string[]).includes(viewParam)
    ? (viewParam as FilterState['view']) : 'grid';

  return { q, category, condition, minScore, evidence, sort, view };
}

function writeStateToUrl(state: FilterState) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  if (state.condition) params.set('condition', state.condition);
  if (state.minScore > 1) params.set('score', String(state.minScore));
  if (state.evidence !== 'all') params.set('evidence', state.evidence);
  if (state.sort !== 'score') params.set('sort', state.sort);
  if (state.view !== 'grid') params.set('view', state.view);
  const next = params.toString();
  const url = next ? `${window.location.pathname}?${next}` : window.location.pathname;
  window.history.replaceState({}, '', url);
}

export default function FoodDatabase({ foods, base }: Props) {
  const [state, setState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStateFromUrl());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStateToUrl(state);
  }, [state, hydrated]);

  const filtered = useMemo(() => sortFoods(filterFoods(foods, state), state.sort), [foods, state]);

  const handleClear = () => setState(DEFAULT_FILTER_STATE);

  return (
    <div className="space-y-6">
      <FilterBar state={state} onChange={setState} onClear={handleClear} />
      <ResultsHeader shown={filtered.length} total={foods.length} />
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-cream-100 p-10 text-center">
          <p className="text-slate-500">No foods match these filters.</p>
          <button
            type="button"
            onClick={handleClear}
            className="mt-3 inline-block rounded-full bg-sage-600 px-4 py-2 text-sm text-cream-50 hover:bg-sage-800"
          >
            Clear filters
          </button>
        </div>
      ) : state.view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((food) => <FoodCardLink key={food.id} food={food} base={base} view="grid" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((food) => <FoodCardLink key={food.id} food={food} base={base} view="list" />)}
        </div>
      )}
    </div>
  );
}
