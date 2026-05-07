# InflammaFree — Design

- **Date:** 2026-05-07
- **Status:** Draft, awaiting user review
- **Owner:** bcarvalho
- **Repo:** https://github.com/bcarvalho3012/inflammafree
- **Deployed URL (target):** https://bcarvalho3012.github.io/inflammafree/

---

## 1. Overview

InflammaFree is a static, multi-page reference site about anti-inflammatory foods, built primarily as a personal day-to-day reference for the owner. It covers a database of ~80-100 foods, eight inflammatory condition categories, an example anti-inflammatory meal plan, and a brief science primer with a research bibliography.

The site is content-first. The only interactive piece is the food database filter. Everything else is static, pre-rendered HTML.

## 2. Goals

- A personal reference the owner uses day-to-day on phone and desktop.
- Broad coverage across all eight inflammatory condition categories (migraine featured).
- ~80-100 anti-inflammatory foods with mechanism, compounds, and conditions helped.
- Verifiable citations on the strongest-evidence foods (~25-30); honest mechanism-only entries on the rest.
- URL-addressable foods and conditions (`/foods/turmeric`, `/conditions/migraine`) so individual pages can be bookmarked.
- Long-lived: easy to edit a single food or condition without touching code.
- Deployed to GitHub Pages from the existing repo.

## 3. Non-Goals (Explicit)

- No food diary, symptom tracker, charts, streaks, or CSV export. Cut entirely.
- No three meal plans — only one example day.
- No deep science section — only a brief primer + auto-generated bibliography.
- No public branding/SEO push. This is a personal tool that happens to be public.
- No dark mode in v1.
- No backend, accounts, or external API dependencies.
- No "Build Your Plate" interactive, sharable cards, or seasonal eating guide (stretch goals from original prompt — out of scope).

## 4. Tech Stack

- **Framework:** Astro 4.x (static site generation, real HTML per route — natural fit for GitHub Pages, no SPA routing hacks needed).
- **Interactive components:** React, mounted only on the food database route as an island.
- **Styling:** Tailwind CSS via `@astrojs/tailwind`, with a custom theme extending color tokens, fonts, and spacing.
- **Type safety:** TypeScript throughout. Zod schemas validate `foods.json` and content collection frontmatter at build time.
- **Testing:** Vitest unit tests for the food filter pure functions. Manual visual/UX checklist for breakpoints and edge cases.
- **Deployment:** GitHub Actions (`withastro/action`) builds and deploys to the `gh-pages` branch on every push to `main`.

## 5. Architecture

```
inflammafree/
├── astro.config.mjs              # site + base configured for GH Pages
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── .github/workflows/deploy.yml  # build + deploy to gh-pages
├── public/                       # favicon, og image, static assets
├── src/
│   ├── content/
│   │   ├── config.ts             # Zod schemas for content collections
│   │   ├── conditions/           # 8 markdown files, one per condition
│   │   ├── meal-plan.md
│   │   └── science.md
│   ├── data/
│   │   └── foods.json            # ~80-100 food entries
│   ├── lib/
│   │   ├── types.ts              # Food, Condition TS types
│   │   ├── schemas.ts            # Zod schemas for foods.json
│   │   ├── filter.ts             # pure filter/sort functions (vitest-tested)
│   │   └── bibliography.ts       # builds bibliography from foods.json
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── FoodCard.astro        # used in static contexts
│   │   ├── ScoreMeter.astro
│   │   ├── EvidenceBadge.astro
│   │   ├── ConditionPill.astro
│   │   ├── react/
│   │   │   ├── FoodDatabase.tsx  # the React island
│   │   │   ├── FilterBar.tsx
│   │   │   ├── ResultsHeader.tsx
│   │   │   ├── FoodGrid.tsx
│   │   │   ├── FoodList.tsx
│   │   │   └── FoodCardLink.tsx  # client-side card for inside the island
│   │   └── decorative/           # botanical SVG accents
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── meal-plan.astro
│   │   ├── science.astro
│   │   ├── foods/
│   │   │   ├── index.astro       # database
│   │   │   └── [slug].astro      # food detail (getStaticPaths)
│   │   └── conditions/
│   │       └── [slug].astro      # condition page (getStaticPaths)
│   └── styles/
│       └── global.css            # @tailwind base/components/utilities, font @imports
├── docs/
│   ├── original-prompt.md        # moved from working dir for posterity
│   └── superpowers/specs/2026-05-07-inflammafree-design.md  # this doc
└── tests/
    └── filter.test.ts
```

## 6. Data Model

### 6.1 Food (`src/data/foods.json`)

```ts
type Food = {
  id: string;                       // url slug, kebab-case
  name: string;
  category: Category;               // see fixed list below
  description: string;              // 1-2 sentences
  antiInflammatoryScore: number;    // 1-10 integer
  activeCompounds: {
    name: string;
    mechanism: string;              // how it reduces inflammation
  }[];
  conditions: ConditionSlug[];      // see fixed list below
  evidenceStrength: 'strong' | 'moderate' | 'emerging';
  citations: Citation[] | null;     // null for long-tail foods
  tips: {
    preparation?: string;
    dosage?: string;
    bioavailability?: string;
    cautions?: string;
  };
};

type Citation = {
  title: string;
  journal: string;
  year: number;
  url?: string;                     // PubMed/DOI when verifiable
};
```

### 6.2 Fixed enums

**Categories (10):** `fruit`, `vegetable`, `protein`, `spice`, `grain`, `fat-oil`, `beverage`, `fermented`, `nut-seed`, `legume`.

**Condition slugs (8):** `migraine`, `arthritis`, `gut`, `cardiovascular`, `autoimmune`, `skin`, `pain`, `neurological`. Migraine is featured throughout.

### 6.3 Condition (`src/content/conditions/<slug>.md`)

Frontmatter:

```yaml
---
slug: migraine
name: Migraines
featured: true            # only true for migraine
order: 1                  # display sort key
shortDescription: "..."
pathways:                 # 2-5 pathway tags
  - "CGRP release"
  - "Trigeminovascular activation"
dietaryPatterns:
  - name: "Mediterranean diet"
    evidence: "..."
foodsToAvoid:
  - name: "Aged cheeses"
    reason: "..."
---
```

Body: Markdown prose explaining how inflammation drives the condition and the connection between specific compounds and the condition's pathways.

### 6.4 "Top foods for condition" — derived, not duplicated

The list of recommended foods per condition is **derived at build time** by filtering `foods.json` for entries whose `conditions` array includes the condition slug, sorted by `antiInflammatoryScore` desc then alphabetically. Single source of truth.

### 6.5 Meal plan (`src/content/meal-plan.md`)

Frontmatter has 5 meal slots (breakfast, snack1, lunch, snack2, dinner), each with `name`, `whyItHelps`, and `keyFoods` (food slugs). Body has any longer-form notes.

### 6.6 Science page (`src/content/science.md`)

Body Markdown for the inflammation primer + key markers (CRP, IL-6, TNF-α, NF-κB, COX-2). The bibliography below this is **auto-generated** from `foods.json`, not authored manually.

### 6.7 Validation

Zod schemas in `src/lib/schemas.ts` validate `foods.json` shape, fixed-enum membership, and score ranges. Astro content collection schemas in `src/content/config.ts` validate condition frontmatter. Build fails on schema violations — typos can't ship silently.

## 7. Routes & Pages

| Route | Source | Render |
|---|---|---|
| `/` | `pages/index.astro` | Static. Hero, stat strip, condition navigator (8 pills), featured foods preview (top 6 by score), CTAs to meal-plan and science. |
| `/foods` | `pages/foods/index.astro` | Static page hosting the React island. Initial filter state read from URL params on hydration. |
| `/foods/[slug]` | `pages/foods/[slug].astro` | Static, generated for each `foods.json` entry via `getStaticPaths`. Full detail page. |
| `/conditions/[slug]` | `pages/conditions/[slug].astro` | Static, generated for each condition file. Hero + prose + derived top foods + dietary patterns + foods-to-avoid panel. |
| `/meal-plan` | `pages/meal-plan.astro` | Static. Visual timeline of one example day. |
| `/science` | `pages/science.astro` | Static. Inflammation primer + auto-generated bibliography + medical disclaimer. |
| `/404.html` | `pages/404.astro` | Static. Friendly fallback with links to `/foods` and condition pages. |

Hero search input on `/` posts to `/foods?q=...`. The food database React component reads the `q` param on mount and applies it.

## 8. Food Database UX (the React island)

### 8.1 State shape

```ts
type CategorySlug =
  | 'fruit' | 'vegetable' | 'protein' | 'spice' | 'grain'
  | 'fat-oil' | 'beverage' | 'fermented' | 'nut-seed' | 'legume';

type ConditionSlug =
  | 'migraine' | 'arthritis' | 'gut' | 'cardiovascular'
  | 'autoimmune' | 'skin' | 'pain' | 'neurological';

type FilterState = {
  q: string;
  category: CategorySlug | null;       // single-select
  condition: ConditionSlug | null;     // single-select
  minScore: number;                    // 1-10, default 1
  evidence: 'all' | 'strong' | 'moderate' | 'emerging';
  view: 'grid' | 'list';
  sort: 'score' | 'name';
};
```

State is mirrored to URL params via `history.replaceState` on every change. On mount, the component reads URL params and seeds state from them. Filters are bookmarkable and shareable.

### 8.2 Component tree

```
FoodDatabase
├── FilterBar        (search input, chips, score slider, evidence dropdown, view toggle)
├── ResultsHeader    ("Showing 47 of 100 foods" + Clear Filters)
├── FoodGrid | FoodList
│   └── FoodCardLink (whole card is an <a> to /foods/[slug])
└── EmptyState       (when filters yield zero results)
```

### 8.3 Filter semantics

- All filters AND together. Search also AND'd.
- Search matches case-insensitive substring against `name`, `description`, and `activeCompounds[].name`.
- Sort default: `antiInflammatoryScore` desc → name asc.
- Empty state: explicit message + "Clear filters" button.
- All filter logic lives in `src/lib/filter.ts` as pure functions, unit-tested with Vitest.

### 8.4 Card design (used in both grid and list)

Category badge top-left, score top-right (text + colored dot — sage 8-10, amber 5-7, terra 1-4). Bold serif name. Primary compound below. Short description. Up to 3 condition tags inline with overflow `+N`.

Whole card is an `<a>` to `/foods/[slug]`. No modal expand.

### 8.5 Accessibility

- Real `<button>` and `<select>` with labels.
- Card is one anchor (no nested interactive elements).
- Score meter: `aria-label="Anti-inflammatory score: 9 out of 10"`.
- Filter changes update result count in an `aria-live="polite"` region.
- Focus rings: 2px sage-400 with 2px offset.
- All animations respect `prefers-reduced-motion`.

## 9. Static Content Pages

### 9.1 Homepage (`/`)

- Hero band: title, headline, tagline, search input → `/foods?q=...`.
- Stat strip: "80+ Anti-Inflammatory Foods", "8 Conditions Covered", "Research-Backed". (The food count badge is rendered from `foods.json.length` at build time so it updates as the database grows.)
- Condition navigator: 8 pills in 2×4 grid (or horizontal scroll on mobile). Migraine pill visually featured.
- Featured foods: top 6 by score, each linking to its food page. CTA "Browse the full food database →".
- Two horizontal cards linking to `/meal-plan` and `/science`.
- Footer.

### 9.2 Condition pages (`/conditions/[slug]`)

- Hero band: condition name, pathway chips, short description.
- Prose body from markdown.
- Top foods grid (derived, top 12) with "See all foods for this condition →" linking to `/foods?condition=<slug>`.
- Dietary patterns cards.
- Foods-to-avoid warning panel (terra-cotta tinted background, 4px terra-600 left border, warning icon).
- Footer.

### 9.3 Meal Plan (`/meal-plan`)

- Brief intro.
- Visual timeline: vertical on mobile, horizontal on desktop. Five stops (Breakfast → Snack → Lunch → Snack → Dinner). Each stop: meal name, why-it-helps, 2-3 key foods (links to food pages).
- Closing flexibility note.

### 9.4 Science (`/science`)

- Inflammation primer prose.
- Key markers grid: CRP, IL-6, TNF-α, NF-κB, COX-2 — one paragraph each.
- Bibliography (auto-generated from `foods.json` citations, grouped by condition).
- Medical disclaimer panel.

### 9.5 Footer (every page)

Site name + about line. Nav links. External resources (American Migraine Foundation, National Headache Foundation, Arthritis Foundation, NIH Office of Dietary Supplements). Disclaimer line. Build year + GH repo link.

### 9.6 404

"Couldn't find that. Try the food database or pick a condition." Links to `/foods` and condition pages.

## 10. Visual Design System

### 10.1 Color tokens (Tailwind `theme.extend.colors`)

| Token | Hex | Use |
|---|---|---|
| `cream-50` | `#FAF7F2` | Page background |
| `cream-100` | `#F2EDE3` | Card background, subtle sections |
| `sage-400` | `#94A684` | Accent, evidence "moderate" tier |
| `sage-600` | `#5C7A4F` | Primary buttons, featured pills, "strong" tier |
| `sage-800` | `#2F4A2A` | Hover, deep accents |
| `terra-400` | `#D4896A` | Secondary accent, "emerging" tier |
| `terra-600` | `#A85A3C` | Foods-to-avoid warning panels |
| `navy-900` | `#1F2937` | Body text, headings |
| `slate-500` | `#6B7280` | Muted text, captions |
| `amber-500` | `#D97706` | Score meter mid-range only |

### 10.2 Typography

- Headings: Lora 500/600 (serif).
- Body: DM Sans 400/500 (sans).
- Mono: JetBrains Mono (citation reference numbers only).
- Loaded from Google Fonts via `<link>` with preconnect and `display=swap`.

Type scale: hero h1 `text-5xl md:text-6xl`; section h2 `text-3xl md:text-4xl`; card title h3 `text-xl`; body `text-base md:text-lg leading-relaxed` (1.7 line-height).

### 10.3 Spacing & layout

- Section padding: `py-16 md:py-24`.
- Card padding: `p-6`. Card grid gap: `gap-6`.
- Generous whitespace; no dense layouts.

### 10.4 Visual touches

- Botanical SVG line art used sparingly (hero accent, science page section divider).
- Card shadows: `shadow-sm` resting → `shadow-md` on hover.
- Hero band: subtle gradient cream → cream with hint of sage at bottom.

### 10.5 Interactive states

- Links: underline on hover only, color shift to sage-800.
- Buttons: sage-600 background, slight 1.02 scale on hover.
- Filter chips: outlined inactive, filled sage-600 active.
- Focus: 2px sage-400 ring with 2px offset.

### 10.6 Score meter

Text "9/10" + colored dot. Sage-600 (8-10), amber-500 (5-7), terra-400 (1-4).

### 10.7 Evidence badges

- Strong: filled sage-600 chip.
- Moderate: filled sage-400 chip.
- Emerging: outlined terra-400 chip.

### 10.8 Foods-to-avoid panel

- Background `bg-terra-400/10`.
- 4px solid `terra-600` left border.
- Warning triangle SVG icon.
- Distinct from positive content but not alarming.

### 10.9 Animations

- Fade-up on scroll (0.4s, fires once per element).
- Filter result transitions: opacity-only fade-in, no layout-shift animation.
- All animations respect `prefers-reduced-motion`.

### 10.10 Mobile

- Header collapses to hamburger below `md` breakpoint.
- Filter bar: sticky horizontal scroll on mobile, sidebar on desktop.
- Touch targets ≥ 44px.

### 10.11 Dark mode

Out of scope for v1. Easy to add later via Tailwind's `dark:` variants and a class-based toggle.

## 11. Research & Content Strategy

The "no fabrication" rule is hard, and the hybrid approach is what makes 80-100 foods tractable.

### 11.1 Tiers

- **Tier 1 — Seed list (~25-30 foods, deep research):** the well-established anti-inflammatory foods (turmeric, ginger, fatty fish, berries, leafy greens, olive oil, green tea, cruciferous vegetables, nuts, fermented foods, and similar). Each gets full mechanism + 1-3 verified PubMed/DOI citations. Each citation is verified by searching for the actual study (or a published review citing it) before being included. Unverifiable citations are dropped, mechanism kept.
- **Tier 2 — Long tail (~60-75 foods, mechanism only):** drawn from established food lists (Mediterranean diet, AICR/WCRF, NIH dietary supplement fact sheets, Cochrane reviews already referenced for Tier 1 foods). Each gets compounds, mechanism, conditions helped, evidence strength, tips. `citations: null`.

### 11.2 Conditions content

Drawn from NIH and Mayo Clinic condition pages plus established peer-reviewed reviews. Inflammation pathways are stable, well-known science, not novel claims.

### 11.3 Foods-to-avoid lists

Drawn from established trigger references (e.g., aged cheeses + tyramine for migraine).

### 11.4 No-fabrication rule

- Every specific study citation is verified at authoring time (real title, real journal, real year, accessible URL).
- Mechanism and pathway names cross-referenced with at least two reputable sources before being asserted.
- Where evidence is genuinely thin, prose uses "evidence suggests" / "preliminary studies indicate" rather than implying strong consensus.

## 12. Build, Test & Deploy

### 12.1 Astro config

- `site: 'https://bcarvalho3012.github.io'`
- `base: '/inflammafree'`
- React + Tailwind integrations enabled.

### 12.2 Tests

- Vitest unit tests cover `src/lib/filter.ts` — search, sort, filter combinations, edge cases (empty query, no results, max score).
- Manual visual checklist for: empty filter result, very long names, foods with no citations, all 8 conditions rendered, mobile breakpoints.
- `astro check` runs in CI to catch type errors.

### 12.3 GitHub Actions (`.github/workflows/deploy.yml`)

- Triggers on push to `main`.
- Steps: checkout → setup Node → install deps → `astro check` → `vitest run` → `astro build` → deploy to `gh-pages` branch via `withastro/action`.
- One-time manual step after first deploy: enable GitHub Pages in repo settings, source = `gh-pages` branch root.

### 12.4 Lighthouse

Run locally pre-deploy, not CI-gated.

## 13. Build Phasing

This gets handed to the writing-plans skill for detailed step-by-step planning. Order:

1. **Bootstrap.** Clone repo. Init Astro + React + Tailwind. Configure `site` + `base`. Set up theme tokens, fonts, base layout. Wire deploy workflow. Push hello-world page. Verify deploy lands at `https://bcarvalho3012.github.io/inflammafree/`.
2. **Shell.** Header, footer, base layout, 404, placeholder pages for every route, navigation linking. Visual system tokens applied.
3. **Data layer.** TypeScript types (`Food`, `Condition`). Zod schemas. Astro content collection config. Author 5-10 seed foods end-to-end. Validate the data model against real entries before scaling.
4. **Food UX.** `FoodCard` static component. Food detail page (`/foods/[slug]`). Food database React island with filters, sort, view toggle, URL param sync. Vitest tests for filter logic.
5. **Conditions.** Author all 8 condition markdown files. Build condition page template. Wire derived top-foods list + foods-to-avoid panel.
6. **Bulk content.** Add the remaining ~70-90 foods (Tier 2 mostly). Author meal plan. Author science page prose. Implement bibliography auto-generation.
7. **Polish.** Visual consistency pass. Mobile testing. Accessibility audit (keyboard nav, screen reader basics, color contrast). Final deploy.

Each phase is independently deployable and reviewable.

## 14. Repo Bootstrap

- Working directory `C:\Users\bcarvalho\OneDrive - All IT Host Inc\ClaudeCode\Projects\AntiflamatoryFoods\` currently has the original prompt + this design doc.
- Clone `bcarvalho3012/inflammafree` into subfolder `inflammafree/`.
- Move `claude-code-prompt-anti-inflammatory-site.md` → `inflammafree/docs/original-prompt.md`.
- Move this design doc → `inflammafree/docs/superpowers/specs/2026-05-07-inflammafree-design.md`.
- Initialize Astro inside `inflammafree/`.
- Initial commit + push verifies the deploy pipeline before any content work begins.

## 15. Maintenance Model

- Add or edit a food: edit `foods.json`, push, auto-deploy.
- Edit condition prose: edit one markdown file, push, auto-deploy.
- Adjust visual tokens: edit Tailwind config, push, auto-deploy.
- No content edit ever requires touching component or page code. The data layer is the editable surface; pages are dumb renderers.

## 16. Open Items / Future Considerations

- **Custom domain:** can be added later by adding a `CNAME` file and DNS records.
- **Dark mode:** stretch goal, easy to layer on with class-based toggle.
- **Print stylesheet:** for printing food lists. Easy to add as a separate CSS layer.
- **Search relevance:** if substring search becomes insufficient with 100+ foods, swap to Fuse.js (still client-side).
- **Re-introducing the food diary later:** the data model has no coupling that would block adding a localStorage tracker as a future add-on if the owner changes their mind.

