import type { Food } from '../../lib/types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '../../lib/types';

interface Props {
  food: Food;
  base: string;
  view: 'grid' | 'list';
}

export default function FoodCardLink({ food, base, view }: Props) {
  const visibleConditions = food.conditions.slice(0, 3);
  const overflow = food.conditions.length - visibleConditions.length;
  const primaryCompound = food.activeCompounds[0]?.name ?? '';
  const dotColor =
    food.antiInflammatoryScore >= 8 ? 'bg-sage-600'
    : food.antiInflammatoryScore >= 5 ? 'bg-amber-500'
    : 'bg-terra-400';

  if (view === 'list') {
    return (
      <a
        href={`${base}/foods/${food.id}`}
        className="block rounded-lg bg-cream-100 px-5 py-4 shadow-sm hover:shadow-md transition-shadow no-underline hover:no-underline"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg text-navy-900 truncate">{food.name}</p>
            <p className="text-xs text-slate-500 truncate">{CATEGORY_LABELS[food.category]} · {primaryCompound}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />
            <span className="text-sm text-navy-900">{food.antiInflammatoryScore}<span className="text-slate-500">/10</span></span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={`${base}/foods/${food.id}`}
      className="group block rounded-xl bg-cream-100 p-6 shadow-sm hover:shadow-md transition-shadow no-underline hover:no-underline"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs uppercase tracking-wide text-slate-500">{CATEGORY_LABELS[food.category]}</span>
        <span className="inline-flex items-center gap-1.5 text-sm" aria-label={`Anti-inflammatory score: ${food.antiInflammatoryScore} out of 10`}>
          <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true" />
          <span className="font-medium text-navy-900">{food.antiInflammatoryScore}<span className="text-slate-500">/10</span></span>
        </span>
      </div>
      <h3 className="font-serif text-xl text-navy-900 group-hover:text-sage-800">{food.name}</h3>
      {primaryCompound && <p className="text-sm text-slate-500 mt-1">{primaryCompound}</p>}
      <p className="mt-3 text-sm text-slate-600 line-clamp-3">{food.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {visibleConditions.map((slug) => (
          <span key={slug} className="inline-block rounded-full bg-cream-50 px-2 py-0.5 text-xs text-slate-500">
            {CONDITION_LABELS[slug]}
          </span>
        ))}
        {overflow > 0 && <span className="text-xs text-slate-500">+{overflow}</span>}
      </div>
    </a>
  );
}
