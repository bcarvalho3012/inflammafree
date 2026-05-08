import type { FilterState } from '../../lib/types';
import { CATEGORY_SLUGS, CATEGORY_LABELS, CONDITION_SLUGS, CONDITION_LABELS } from '../../lib/types';

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}

export default function FilterBar({ state, onChange, onClear }: Props) {
  const hasActiveFilters =
    state.q !== '' ||
    state.category !== null ||
    state.condition !== null ||
    state.minScore > 1 ||
    state.evidence !== 'all' ||
    state.sort !== 'score';

  return (
    <div className="rounded-xl bg-cream-100 p-5 space-y-5">
      <div>
        <label htmlFor="filter-q" className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Search</label>
        <input
          id="filter-q"
          type="search"
          value={state.q}
          onChange={(e) => onChange({ ...state, q: e.target.value })}
          placeholder="Search foods, compounds, descriptions..."
          className="w-full rounded-md border border-cream-100 bg-cream-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_SLUGS.map((slug) => {
            const active = state.category === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => onChange({ ...state, category: active ? null : slug })}
                className={
                  'rounded-full px-3 py-1 text-xs transition-colors ' +
                  (active ? 'bg-sage-600 text-cream-50' : 'border border-sage-400 text-sage-800 hover:bg-sage-400/10')
                }
              >
                {CATEGORY_LABELS[slug]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Condition</p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_SLUGS.map((slug) => {
            const active = state.condition === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => onChange({ ...state, condition: active ? null : slug })}
                className={
                  'rounded-full px-3 py-1 text-xs transition-colors ' +
                  (active ? 'bg-sage-600 text-cream-50' : 'border border-sage-400 text-sage-800 hover:bg-sage-400/10')
                }
              >
                {CONDITION_LABELS[slug]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="filter-score" className="block text-xs uppercase tracking-wide text-slate-500 mb-1">
            Min score: {state.minScore}
          </label>
          <input
            id="filter-score"
            type="range"
            min={1}
            max={10}
            value={state.minScore}
            onChange={(e) => onChange({ ...state, minScore: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="filter-evidence" className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Evidence</label>
          <select
            id="filter-evidence"
            value={state.evidence}
            onChange={(e) => onChange({ ...state, evidence: e.target.value as FilterState['evidence'] })}
            className="w-full rounded-md border border-cream-100 bg-cream-50 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
            <option value="emerging">Emerging</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Sort</label>
          <select
            id="filter-sort"
            value={state.sort}
            onChange={(e) => onChange({ ...state, sort: e.target.value as FilterState['sort'] })}
            className="w-full rounded-md border border-cream-100 bg-cream-50 px-3 py-2 text-sm"
          >
            <option value="score">By score (high to low)</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-cream-100 bg-cream-50 p-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...state, view: 'grid' })}
            className={'px-3 py-1 text-sm rounded ' + (state.view === 'grid' ? 'bg-sage-600 text-cream-50' : 'text-slate-500')}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...state, view: 'list' })}
            className={'px-3 py-1 text-sm rounded ' + (state.view === 'list' ? 'bg-sage-600 text-cream-50' : 'text-slate-500')}
          >
            List
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-sage-800 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
