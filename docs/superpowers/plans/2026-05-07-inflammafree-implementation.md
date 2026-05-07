# InflammaFree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a static multi-page reference site at `https://bcarvalho3012.github.io/inflammafree/` covering ~80-100 anti-inflammatory foods, 8 condition categories, an example meal plan, and a brief science page — using Astro + React (one island) + Tailwind, deployed via GitHub Actions to GitHub Pages.

**Architecture:** Astro statically pre-renders every page (homepage, foods list, per-food pages, per-condition pages, meal-plan, science, 404). The only client-hydrated React island is the food database filter on `/foods`. Foods live in a single `foods.json`; conditions and prose pages live in Astro content collections. Validation via Zod and content collection schemas — typos fail the build.

**Tech Stack:** Astro 6.x, React 18, Tailwind CSS v4 (via `@tailwindcss/vite`), TypeScript (strict), Zod, Vitest, GitHub Actions, GitHub Pages.

> **Tailwind v4 note.** This plan uses Tailwind v4 (current stable in 2026), which has no `tailwind.config.js`. Theme tokens, plugins, and base styles all live in `src/styles/global.css` via `@theme`, `@plugin`, and `@layer base` directives. The integration is `@tailwindcss/vite` (a Vite plugin), not the deprecated `@astrojs/tailwind` integration.

**Spec:** `docs/superpowers/specs/2026-05-07-inflammafree-design.md` (read this before starting).

---

## Prerequisites

Working directory before starting: `<project-root>/inflammafree/` (the cloned repo). The repo has its initial commit with the original prompt and the design spec already pushed to `origin/main`.

Required local tools:
- Node.js ≥ 20 (`node --version`)
- npm ≥ 10 (`npm --version`)
- git (already used to clone)
- A browser for visual verification

GitHub auth must already work for `git push` (proven by the initial spec commit).

---

## File Structure (target end-state)

```
inflammafree/
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── .gitignore
├── README.md
├── .github/workflows/deploy.yml
├── public/
│   └── favicon.svg
├── src/
│   ├── content/
│   │   ├── config.ts                       # Astro content collection schemas
│   │   ├── conditions/                     # 8 markdown files
│   │   │   ├── migraine.md
│   │   │   ├── arthritis.md
│   │   │   ├── gut.md
│   │   │   ├── cardiovascular.md
│   │   │   ├── autoimmune.md
│   │   │   ├── skin.md
│   │   │   ├── pain.md
│   │   │   └── neurological.md
│   │   ├── meal-plan.md
│   │   └── science.md
│   ├── data/
│   │   └── foods.json                      # ~80-100 entries
│   ├── lib/
│   │   ├── types.ts                        # Food, Condition, Citation, FilterState types + slug constants
│   │   ├── schemas.ts                      # Zod schemas for foods.json
│   │   ├── filter.ts                       # pure filter/sort functions
│   │   └── bibliography.ts                 # builds bibliography from foods.json
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── FoodCard.astro                  # static card (homepage, condition pages)
│   │   ├── ScoreMeter.astro
│   │   ├── EvidenceBadge.astro
│   │   ├── ConditionPill.astro
│   │   ├── ConditionTag.astro              # small tag inside cards
│   │   ├── FoodsToAvoidPanel.astro
│   │   ├── DecorativeLeaf.astro
│   │   └── react/
│   │       ├── FoodDatabase.tsx            # the island root
│   │       ├── FilterBar.tsx
│   │       ├── ResultsHeader.tsx
│   │       ├── FoodGrid.tsx
│   │       ├── FoodList.tsx
│   │       └── FoodCardLink.tsx
│   ├── layouts/
│   │   └── Base.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├── meal-plan.astro
│   │   ├── science.astro
│   │   ├── foods/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   └── conditions/
│   │       └── [slug].astro
│   └── styles/
│       └── global.css
├── tests/
│   └── filter.test.ts
└── docs/
    ├── original-prompt.md                  # already exists
    └── superpowers/
        ├── specs/2026-05-07-inflammafree-design.md   # already exists
        └── plans/2026-05-07-inflammafree-implementation.md  # this file
```

---

## Phasing Overview

1. **Bootstrap** — Astro project + GH Pages deploy verified end-to-end
2. **Shell** — base layout, header, footer, placeholder pages, mobile nav
3. **Data layer** — types, Zod schemas, content collections, seed foods
4. **Food UX** — filter logic (TDD), components, food detail page, the React island, food database page
5. **Conditions** — condition page template + 8 condition files
6. **Bulk content** — remaining ~70-90 foods, meal plan, science page, real homepage
7. **Polish** — decorative accents, mobile/a11y audit, final deploy

Each phase ends with a commit + push and produces a deployable site that improves over the previous phase.

---

## Conventions Used Throughout This Plan

- All paths are relative to `inflammafree/` (the cloned repo root). All commands run from there unless stated.
- Commits use conventional format: `feat: ...`, `chore: ...`, `test: ...`, `fix: ...`, `docs: ...`.
- Each task ends with a commit. Push at the end of each phase (and between if you want to verify deploys).
- Visual verification means running `npm run dev` and viewing in a browser. The dev URL is `http://localhost:4321/inflammafree/` (Astro respects `base`).
- TypeScript is strict. No `any` without a comment explaining why.
- Tailwind classes are the styling surface. No inline styles.

---

## Phase 1: Bootstrap

Goal: a deployable Astro project with React, Tailwind, theme tokens, fonts, GH Actions workflow, and a hello-world homepage live at `https://bcarvalho3012.github.io/inflammafree/`.

### Task 1.1: Initialize Astro project in the existing repo

**Files:**
- Modify: working tree of `inflammafree/` (will create `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/`, `public/`, etc.)

- [ ] **Step 1: Run the Astro init in the cloned repo**

```bash
cd inflammafree
npm create astro@latest -- --template minimal --install --no-git --skip-houston --yes .
```

Expected: a fresh Astro minimal template scaffolded into the current directory (`.`), with deps installed. The existing `docs/` directory and `.git/` are preserved. The minimal template's `tsconfig.json` extends `astro/tsconfigs/strict` by default — no separate `--typescript strict` flag is needed (and it's not a recognized flag in current `create-astro` versions).

- [ ] **Step 2: Verify the dev server runs**

Run: `npm run dev`
Expected: dev server starts on `http://localhost:4321/`. Open it in a browser, confirm the default Astro page loads. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold astro project (minimal template, strict ts)"
```

### Task 1.2: Add React and Tailwind v4 integrations

**Files:**
- Modify: `package.json` (deps), `astro.config.mjs`

- [ ] **Step 1: Add the React integration via Astro's CLI**

```bash
npx astro add react --yes
```

Expected: `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom` installed; `astro.config.mjs` updated to include the React integration.

- [ ] **Step 2: Install Tailwind v4 manually (the Vite plugin approach)**

```bash
npm install tailwindcss @tailwindcss/vite
```

Expected: `tailwindcss@^4` and `@tailwindcss/vite@^4` added to dependencies. **Do NOT run `npx astro add tailwind`** — that may install the deprecated `@astrojs/tailwind` integration on some versions, which we don't want.

- [ ] **Step 3: Verify dev server still runs**

Start `npm run dev` in the background, curl `http://localhost:4321/` to confirm it returns HTML, then stop the background process.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add react integration and tailwind v4 deps"
```

### Task 1.3: Configure Astro for GitHub Pages

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Set `site` and `base` for GH Pages and wire up the Tailwind v4 Vite plugin**

Replace `astro.config.mjs` contents with:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://bcarvalho3012.github.io',
  base: '/inflammafree',
  trailingSlash: 'ignore',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
```

Tailwind v4 runs as a Vite plugin (not an Astro integration). Theme tokens are defined in CSS (Task 1.5), not in a JS config file.

- [ ] **Step 2: Verify dev server runs at the configured base path**

Run: `npm run dev`
Expected: dev server logs the local URL as `http://localhost:4321/inflammafree/`. Open it; the default page should load. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "chore: configure astro site and base for github pages"
```

### Task 1.4: (No-op for Tailwind v4 — theme tokens go in CSS)

In Tailwind v4 there is no `tailwind.config.js`. Theme tokens, fonts, and plugins are all defined in `src/styles/global.css` via the `@theme`, `@plugin`, and `@layer` at-rules. This task is intentionally empty in the v4 plan; the tokens get authored as part of Task 1.5.

If a `tailwind.config.mjs` was created accidentally (e.g., by an outdated CLI command), delete it before continuing — its contents are ignored in v4.

- [ ] **Step 1: Confirm there is no `tailwind.config.mjs` in the repo**

```bash
ls inflammafree/tailwind.config.* 2>&1 || echo "absent"
```

Expected: "absent" or no matching file. If a config file exists, delete it:

```bash
rm inflammafree/tailwind.config.mjs
git add -A
git commit -m "chore: remove stray tailwind v3 config (using v4 css-based config)"
```

If absent, no commit needed — proceed to Task 1.5.

### Task 1.5: Create global stylesheet with Tailwind v4 + theme tokens + Google Fonts

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=DM+Sans:wght@400;500&family=JetBrains+Mono&display=swap');
@import "tailwindcss";

@theme {
  --color-cream-50: #FAF7F2;
  --color-cream-100: #F2EDE3;
  --color-sage-400: #94A684;
  --color-sage-600: #5C7A4F;
  --color-sage-800: #2F4A2A;
  --color-terra-400: #D4896A;
  --color-terra-600: #A85A3C;
  --color-navy-900: #1F2937;

  --font-serif: 'Lora', Georgia, serif;
  --font-sans: '"DM Sans"', system-ui, sans-serif;
  --font-mono: '"JetBrains Mono"', monospace;
}

@layer base {
  html {
    background-color: var(--color-cream-50);
    color: var(--color-navy-900);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-serif);
    font-weight: 600;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
    color: var(--color-sage-800);
  }

  *:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-cream-50), 0 0 0 4px var(--color-sage-400);
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

In Tailwind v4, every entry in `@theme` becomes a generated utility class automatically. So `--color-sage-600` produces `bg-sage-600`, `text-sage-600`, `border-sage-600`, etc. The standard color palette (`slate-*`, `amber-*`, `white`, `black`, etc.) is included by default — no need to redefine those.

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global stylesheet with theme tokens, fonts, base styles"
```

### Task 1.6: Replace the default homepage with a hello-world that uses the theme

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace `src/pages/index.astro` contents**

```astro
---
import '../styles/global.css';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>InflammaFree</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  </head>
  <body class="bg-cream-50 text-navy-900">
    <main class="mx-auto max-w-3xl px-6 py-24">
      <h1 class="text-5xl md:text-6xl font-serif leading-tight">InflammaFree</h1>
      <p class="mt-4 text-lg text-slate-600">Bootstrap successful. Real content coming next phase.</p>
      <div class="mt-8 flex gap-3">
        <span class="inline-block rounded-full bg-sage-600 px-3 py-1 text-sm text-cream-50">sage-600</span>
        <span class="inline-block rounded-full bg-terra-400 px-3 py-1 text-sm text-cream-50">terra-400</span>
        <span class="inline-block rounded-full border border-sage-400 px-3 py-1 text-sm text-sage-800">sage-400 outline</span>
      </div>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Run dev server and verify**

Run: `npm run dev`
Open `http://localhost:4321/inflammafree/`. Expected: cream background, "InflammaFree" in serif, the three colored chips render correctly. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: hello-world homepage using theme tokens"
```

### Task 1.7: Add `.gitignore` and `README.md`

**Files:**
- Create: `.gitignore` (Astro creates one but we'll ensure it's correct)
- Create: `README.md`

- [ ] **Step 1: Verify/replace `.gitignore`**

Ensure `.gitignore` contents are:

```
# build
dist/
.astro/

# deps
node_modules/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# env
.env
.env.production
.env.local

# editors
.DS_Store
.vscode/*
!.vscode/extensions.json
.idea/

# misc
.cache/
```

- [ ] **Step 2: Create `README.md`**

```markdown
# InflammaFree

A static reference site for anti-inflammatory foods. Personal day-to-day reference covering ~80-100 foods across 8 inflammatory condition categories.

**Live:** https://bcarvalho3012.github.io/inflammafree/

## Stack

Astro + React (one island) + Tailwind CSS + TypeScript. Static-rendered, deployed to GitHub Pages via GitHub Actions.

## Develop

```bash
npm install
npm run dev          # http://localhost:4321/inflammafree/
npm run build        # outputs to dist/
npm run preview      # preview the built site
npm test             # vitest unit tests
```

## Editing content

- Foods: edit `src/data/foods.json` (Zod-validated at build).
- Conditions: edit `src/content/conditions/<slug>.md`.
- Meal plan: `src/content/meal-plan.md`.
- Science / inflammation primer: `src/content/science.md`.

Push to `main` and the deploy workflow runs automatically.

## Disclaimer

Educational use only. Not medical advice. Consult a healthcare provider before changing your diet, especially with existing conditions or medications.
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore README.md
git commit -m "docs: add gitignore and readme"
```

### Task 1.8: Add the GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Build with Astro
        uses: withastro/action@v3
        with:
          node-version: 20
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add github pages deploy workflow"
git push
```

- [ ] **Step 3: Configure GitHub Pages source in repo settings (manual)**

In the GitHub UI:
1. Go to https://github.com/bcarvalho3012/inflammafree/settings/pages
2. Under "Build and deployment", set Source = **GitHub Actions**.
3. Save.

- [ ] **Step 4: Wait for the workflow to complete and verify the deploy**

In GitHub Actions tab, wait for the "Deploy to GitHub Pages" workflow to finish (≈1-3 min). Once green:

Open `https://bcarvalho3012.github.io/inflammafree/` in a browser.
Expected: hello-world page renders with cream background, serif "InflammaFree" headline, and the three colored chips. If it 404s, wait 1-2 min for GH's CDN, then retry.

- [ ] **Step 5: If anything fails**

- Workflow red? Check the Actions log for the failing step. Most common cause: GH Pages source isn't set to "GitHub Actions" yet (Step 3).
- 404 after green workflow? Check that `astro.config.mjs` has `base: '/inflammafree'` — if base mismatches the repo name, links 404.
- Page renders but unstyled? Tailwind didn't run; rerun the workflow after confirming `tailwind.config.mjs` content paths match.

End of Phase 1. The pipeline is now proven. Subsequent pushes auto-deploy.

---

## Phase 2: Shell

Goal: a navigable shell — header, footer, base layout, all top-level placeholder pages, 404 — all using the visual system. Mobile-friendly. Still deployable at the end of the phase.

### Task 2.1: Build the Base layout

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Create `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'A research-backed reference for anti-inflammatory foods.' } = Astro.props;
const fullTitle = title === 'InflammaFree' ? title : `${title} — InflammaFree`;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <meta name="generator" content={Astro.generator} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL}/favicon.svg`} />
    <title>{fullTitle}</title>
  </head>
  <body class="min-h-screen flex flex-col bg-cream-50 text-navy-900">
    <Header />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Commit (will fail to build until Header/Footer exist — that's Task 2.2/2.3, do NOT run dev yet)**

```bash
git add src/layouts/Base.astro
git commit -m "feat: add base layout shell"
```

### Task 2.2: Build the Header component

**Files:**
- Create: `src/components/Header.astro`

- [ ] **Step 1: Create `src/components/Header.astro`**

```astro
---
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const navLinks = [
  { href: `${base}/foods`, label: 'Foods' },
  { href: `${base}/conditions/migraine`, label: 'Conditions' },
  { href: `${base}/meal-plan`, label: 'Meal Plan' },
  { href: `${base}/science`, label: 'Science' },
];
---

<header class="sticky top-0 z-30 bg-cream-50/90 backdrop-blur border-b border-cream-100">
  <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
    <a href={`${base}/`} class="font-serif text-2xl font-semibold no-underline hover:no-underline">
      InflammaFree
    </a>

    <nav class="hidden md:flex gap-6 text-sm">
      {navLinks.map((link) => (
        <a href={link.href} class="text-navy-900 hover:text-sage-800">{link.label}</a>
      ))}
    </nav>

    <details class="md:hidden relative">
      <summary class="list-none cursor-pointer p-2" aria-label="Toggle navigation">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </summary>
      <nav class="absolute right-0 mt-2 w-48 bg-cream-50 border border-cream-100 rounded-lg shadow-md p-3 flex flex-col gap-3">
        {navLinks.map((link) => (
          <a href={link.href} class="text-navy-900 hover:text-sage-800">{link.label}</a>
        ))}
      </nav>
    </details>
  </div>
</header>

<style>
  details > summary::-webkit-details-marker { display: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: add header with desktop nav and mobile disclosure menu"
```

### Task 2.3: Build the Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Create `src/components/Footer.astro`**

```astro
---
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const year = new Date().getFullYear();
const externalLinks = [
  { href: 'https://americanmigrainefoundation.org/', label: 'American Migraine Foundation' },
  { href: 'https://headaches.org/', label: 'National Headache Foundation' },
  { href: 'https://www.arthritis.org/', label: 'Arthritis Foundation' },
  { href: 'https://ods.od.nih.gov/', label: 'NIH Office of Dietary Supplements' },
];
---

<footer class="border-t border-cream-100 bg-cream-100/40 mt-24">
  <div class="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-3 text-sm">
    <div>
      <p class="font-serif text-lg text-navy-900">InflammaFree</p>
      <p class="mt-2 text-slate-500">A research-backed reference for anti-inflammatory foods. Personal use; not medical advice.</p>
    </div>

    <div>
      <p class="font-medium text-navy-900">Site</p>
      <ul class="mt-2 space-y-1 text-slate-500">
        <li><a href={`${base}/foods`} class="hover:text-sage-800">Foods</a></li>
        <li><a href={`${base}/conditions/migraine`} class="hover:text-sage-800">Conditions</a></li>
        <li><a href={`${base}/meal-plan`} class="hover:text-sage-800">Meal Plan</a></li>
        <li><a href={`${base}/science`} class="hover:text-sage-800">Science</a></li>
      </ul>
    </div>

    <div>
      <p class="font-medium text-navy-900">External resources</p>
      <ul class="mt-2 space-y-1 text-slate-500">
        {externalLinks.map((link) => (
          <li><a href={link.href} class="hover:text-sage-800" target="_blank" rel="noopener noreferrer">{link.label}</a></li>
        ))}
      </ul>
    </div>
  </div>

  <div class="border-t border-cream-100">
    <div class="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-slate-500">
      <p>Educational content only. Consult your healthcare provider before changing your diet, especially with existing conditions or medications.</p>
      <p>
        © {year} ·
        <a href="https://github.com/bcarvalho3012/inflammafree" target="_blank" rel="noopener noreferrer" class="hover:text-sage-800">Source on GitHub</a>
      </p>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add footer with site nav, external resources, disclaimer"
```

### Task 2.4: Convert the homepage to use Base layout

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace `src/pages/index.astro` contents**

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="InflammaFree">
  <section class="mx-auto max-w-3xl px-6 py-24">
    <h1 class="text-5xl md:text-6xl font-serif leading-tight">Food as medicine for chronic inflammation.</h1>
    <p class="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed">
      A research-backed guide to foods that help reduce chronic inflammation —
      with detailed coverage for migraines, arthritis, gut health, and other inflammatory conditions.
    </p>
    <p class="mt-12 text-sm text-slate-500">
      Site shell complete. Real content arriving in subsequent phases.
    </p>
  </section>
</Base>
```

- [ ] **Step 2: Run dev server and verify**

Run: `npm run dev`
Open `http://localhost:4321/inflammafree/`. Expected: header (sticky on scroll, with nav links), hero text, footer with three columns. Resize to mobile (< 768px); the desktop nav hides and a hamburger appears. Click the hamburger; the disclosure menu opens. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: wire homepage through base layout"
```

### Task 2.5: Add the placeholder Foods index page

**Files:**
- Create: `src/pages/foods/index.astro`

- [ ] **Step 1: Create `src/pages/foods/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro';
---

<Base title="Foods" description="Browse the full anti-inflammatory food database.">
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h1 class="text-4xl md:text-5xl font-serif">Foods</h1>
    <p class="mt-4 text-slate-500">Filterable food database — coming in Phase 4.</p>
  </section>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/foods/index.astro
git commit -m "feat: add placeholder foods index page"
```

### Task 2.6: Add the placeholder Meal Plan page

**Files:**
- Create: `src/pages/meal-plan.astro`

- [ ] **Step 1: Create `src/pages/meal-plan.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="Meal Plan" description="An example anti-inflammatory day.">
  <section class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl md:text-5xl font-serif">Meal Plan</h1>
    <p class="mt-4 text-slate-500">An example anti-inflammatory day — coming in Phase 6.</p>
  </section>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/meal-plan.astro
git commit -m "feat: add placeholder meal plan page"
```

### Task 2.7: Add the placeholder Science page

**Files:**
- Create: `src/pages/science.astro`

- [ ] **Step 1: Create `src/pages/science.astro`**

```astro
---
import Base from '../layouts/Base.astro';
---

<Base title="Science" description="Inflammation primer and bibliography.">
  <section class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl md:text-5xl font-serif">Science</h1>
    <p class="mt-4 text-slate-500">Inflammation primer and full bibliography — coming in Phase 6.</p>
  </section>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/science.astro
git commit -m "feat: add placeholder science page"
```

### Task 2.8: Add a friendly 404 page

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Create `src/pages/404.astro`**

```astro
---
import Base from '../layouts/Base.astro';
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---

<Base title="Not Found" description="That page wasn't found.">
  <section class="mx-auto max-w-2xl px-6 py-24 text-center">
    <p class="text-sm uppercase tracking-wide text-sage-600">404</p>
    <h1 class="mt-2 text-4xl md:text-5xl font-serif">Couldn't find that.</h1>
    <p class="mt-4 text-slate-500">Try the food database or pick a condition.</p>
    <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
      <a href={`${base}/foods`} class="inline-block rounded-full bg-sage-600 px-5 py-2 text-cream-50 hover:bg-sage-800 hover:no-underline">Browse foods</a>
      <a href={`${base}/conditions/migraine`} class="inline-block rounded-full border border-sage-400 px-5 py-2 text-sage-800 hover:bg-sage-400/10 hover:no-underline">View conditions</a>
    </div>
  </section>
</Base>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat: add friendly 404 page"
```

### Task 2.9: Verify build, then push the shell

**Files:** none modified

- [ ] **Step 1: Run a full production build to catch any errors**

Run: `npm run build`
Expected: build completes without errors. `dist/` contains `index.html`, `foods/index.html`, `meal-plan/index.html`, `science/index.html`, `404.html`. If anything fails, fix before continuing.

- [ ] **Step 2: Preview the built site**

Run: `npm run preview`
Open `http://localhost:4321/inflammafree/`. Click each nav link — `Foods`, `Meal Plan`, `Science` should all load placeholder pages with header + footer. Conditions link will go to `/conditions/migraine` and 404 since the route doesn't exist yet (this is expected — it gets created in Phase 5). The hamburger menu must work on mobile width. Stop with Ctrl+C.

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: Wait for the deploy and verify in production**

After GH Actions finishes, open `https://bcarvalho3012.github.io/inflammafree/`. Verify the same checks as Step 2 against the live URL.

End of Phase 2. The shell is live. Conditions route still 404s in nav until Phase 5.

---

## Phase 3: Data Layer

Goal: TypeScript types, Zod schemas, an Astro content collection for conditions, and 5 fully-validated seed foods in `foods.json`. By the end of this phase, the data shape is locked in, validation runs at build time, and we have real entries to consume in Phase 4.

### Task 3.1: Define core TypeScript types and slug constants

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: define food/condition types and slug constants"
```

### Task 3.2: Define Zod schemas for the food data

**Files:**
- Create: `src/lib/schemas.ts`

- [ ] **Step 1: Add Zod**

```bash
npm install zod
```

- [ ] **Step 2: Create `src/lib/schemas.ts`**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/lib/schemas.ts
git commit -m "feat: add zod schemas for foods.json validation"
```

### Task 3.3: Create the food loader

**Files:**
- Create: `src/lib/foods.ts`
- Create: `src/data/foods.json` (initially empty array)

- [ ] **Step 1: Create the empty data file**

`src/data/foods.json`:

```json
[]
```

- [ ] **Step 2: Create `src/lib/foods.ts`**

```ts
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
```

- [ ] **Step 3: Wire the loader into `astro.config.mjs` so validation runs at build**

The loader runs whenever any page imports it. To force it during build even if no page yet uses it, add an import to `src/pages/index.astro`:

Open `src/pages/index.astro` and add to the frontmatter:

```astro
---
import Base from '../layouts/Base.astro';
import { allFoods } from '../lib/foods.ts';
---

<Base title="InflammaFree">
  <section class="mx-auto max-w-3xl px-6 py-24">
    <h1 class="text-5xl md:text-6xl font-serif leading-tight">Food as medicine for chronic inflammation.</h1>
    <p class="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed">
      A research-backed guide to foods that help reduce chronic inflammation —
      with detailed coverage for migraines, arthritis, gut health, and other inflammatory conditions.
    </p>
    <p class="mt-12 text-sm text-slate-500">
      Database currently has {allFoods.length} foods. Real homepage in Phase 6.
    </p>
  </section>
</Base>
```

- [ ] **Step 4: Verify build still works (with empty array)**

Run: `npm run build`
Expected: build succeeds. `dist/index.html` shows "Database currently has 0 foods."

- [ ] **Step 5: Commit**

```bash
git add src/data/foods.json src/lib/foods.ts src/pages/index.astro
git commit -m "feat: add food loader with build-time validation"
```

### Task 3.4: Add 5 seed foods to validate the data shape end-to-end

**Files:**
- Modify: `src/data/foods.json`

For each seed food, set `citations: null`. Citation research happens in Phase 6 once the database is fully populated.

- [ ] **Step 1: Replace `src/data/foods.json` with the 5 seed foods**

```json
[
  {
    "id": "turmeric",
    "name": "Turmeric",
    "category": "spice",
    "description": "Bright yellow root used in South Asian cooking; one of the most studied anti-inflammatory foods, valued for its broad activity across multiple inflammatory pathways.",
    "antiInflammatoryScore": 9,
    "activeCompounds": [
      {
        "name": "Curcumin",
        "mechanism": "Inhibits NF-κB pathway, reduces COX-2 expression, lowers TNF-α and IL-6 levels"
      }
    ],
    "conditions": ["migraine", "arthritis", "gut", "cardiovascular", "autoimmune", "skin", "pain", "neurological"],
    "evidenceStrength": "strong",
    "citations": null,
    "tips": {
      "preparation": "Use ground or fresh root; add to oil-based dishes for absorption",
      "dosage": "500-1000 mg curcumin equivalent daily",
      "bioavailability": "Pair with black pepper (piperine) — increases absorption up to 2000%",
      "cautions": "May interact with blood thinners; consult provider if on warfarin"
    }
  },
  {
    "id": "ginger",
    "name": "Ginger",
    "category": "spice",
    "description": "Aromatic root with established anti-inflammatory and antiemetic properties; especially useful for migraine and pain conditions.",
    "antiInflammatoryScore": 8,
    "activeCompounds": [
      {
        "name": "Gingerols",
        "mechanism": "Inhibits prostaglandin and leukotriene synthesis; modulates COX and LOX pathways"
      },
      {
        "name": "Shogaols",
        "mechanism": "Reduces TNF-α and IL-6 production; antioxidant effects on lipid peroxidation"
      }
    ],
    "conditions": ["migraine", "arthritis", "gut", "pain", "neurological"],
    "evidenceStrength": "strong",
    "citations": null,
    "tips": {
      "preparation": "Fresh root grated or sliced; or 1-2 g powdered",
      "dosage": "1-2 g daily for migraine prophylaxis",
      "bioavailability": "Active compounds are heat-stable; absorption is good without enhancers",
      "cautions": "May increase bleeding risk at high doses with anticoagulants"
    }
  },
  {
    "id": "salmon",
    "name": "Wild Salmon",
    "category": "protein",
    "description": "Fatty cold-water fish rich in long-chain omega-3 fatty acids EPA and DHA, with strong evidence for cardiovascular and autoimmune inflammation.",
    "antiInflammatoryScore": 9,
    "activeCompounds": [
      {
        "name": "EPA (eicosapentaenoic acid)",
        "mechanism": "Competes with arachidonic acid for COX/LOX enzymes, shifting eicosanoid production toward less inflammatory mediators"
      },
      {
        "name": "DHA (docosahexaenoic acid)",
        "mechanism": "Precursor to resolvins and protectins, which actively resolve inflammation"
      }
    ],
    "conditions": ["migraine", "arthritis", "cardiovascular", "autoimmune", "skin", "neurological"],
    "evidenceStrength": "strong",
    "citations": null,
    "tips": {
      "preparation": "Wild-caught preferred; bake, grill, or pan-sear",
      "dosage": "2-3 servings (3-4 oz each) per week",
      "bioavailability": "Cooking does not significantly degrade omega-3s; avoid deep-frying",
      "cautions": "Some farmed varieties are higher in omega-6; check for sustainable sourcing"
    }
  },
  {
    "id": "blueberries",
    "name": "Blueberries",
    "category": "fruit",
    "description": "Deeply pigmented berries packed with anthocyanins; strong evidence for vascular and neurological inflammation.",
    "antiInflammatoryScore": 8,
    "activeCompounds": [
      {
        "name": "Anthocyanins",
        "mechanism": "Reduce CRP and IL-6; protect endothelial cells from oxidative damage"
      },
      {
        "name": "Pterostilbene",
        "mechanism": "Activates SIRT1 pathway and AMPK, improving cellular stress response"
      }
    ],
    "conditions": ["cardiovascular", "neurological", "skin"],
    "evidenceStrength": "strong",
    "citations": null,
    "tips": {
      "preparation": "Fresh or frozen — frozen retains anthocyanins well",
      "dosage": "1/2 to 1 cup daily",
      "bioavailability": "Wild blueberries have ~2x the anthocyanin content of cultivated",
      "cautions": "No common interactions; high-fiber serving may be a trigger for some IBS patterns"
    }
  },
  {
    "id": "extra-virgin-olive-oil",
    "name": "Extra Virgin Olive Oil",
    "category": "fat-oil",
    "description": "Unrefined olive oil rich in monounsaturated fats and polyphenols; foundational fat in the Mediterranean diet pattern.",
    "antiInflammatoryScore": 9,
    "activeCompounds": [
      {
        "name": "Oleocanthal",
        "mechanism": "Inhibits COX-1 and COX-2 enzymes similarly to ibuprofen at much lower potency"
      },
      {
        "name": "Hydroxytyrosol",
        "mechanism": "Antioxidant; reduces oxidized LDL and lowers vascular inflammation markers"
      }
    ],
    "conditions": ["arthritis", "cardiovascular", "autoimmune", "skin", "neurological"],
    "evidenceStrength": "strong",
    "citations": null,
    "tips": {
      "preparation": "Use unrefined; drizzle on cooked food rather than for high-heat frying",
      "dosage": "2-4 tablespoons daily",
      "bioavailability": "Pair with vegetables to absorb fat-soluble compounds",
      "cautions": "Quality varies significantly — choose first cold-pressed, dark-glass-bottled brands"
    }
  }
]
```

- [ ] **Step 2: Run the build to confirm validation passes**

Run: `npm run build`
Expected: build succeeds. The homepage now reads "Database currently has 5 foods."

- [ ] **Step 3: Sanity-check validation by intentionally breaking and unbreaking**

Edit `src/data/foods.json` and change the first food's `category` from `"spice"` to `"weird-category"`. Run `npm run build`. Expected: build fails with a Zod error mentioning the invalid category.

Revert the change. Run `npm run build` again. Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/data/foods.json
git commit -m "feat: add five seed foods (turmeric, ginger, salmon, blueberries, olive oil)"
```

### Task 3.5: Set up the Astro content collection for conditions

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Create `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { CONDITION_SLUGS } from '../lib/types';

const conditions = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.enum(CONDITION_SLUGS),
    name: z.string(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    shortDescription: z.string(),
    pathways: z.array(z.string()).min(1),
    dietaryPatterns: z.array(z.object({
      name: z.string(),
      evidence: z.string(),
    })).default([]),
    foodsToAvoid: z.array(z.object({
      name: z.string(),
      reason: z.string(),
    })).default([]),
  }),
});

export const collections = { conditions };
```

- [ ] **Step 2: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: define conditions content collection schema"
```

### Task 3.6: Author the migraine condition file (the first content collection entry)

**Files:**
- Create: `src/content/conditions/migraine.md`

- [ ] **Step 1: Create the migraine condition file**

```markdown
---
slug: migraine
name: Migraines
featured: true
order: 1
shortDescription: Recurring headaches driven by neurogenic inflammation and trigeminovascular activation.
pathways:
  - CGRP release in the trigeminovascular system
  - Mast cell activation and histamine release
  - Cortical spreading depression triggering neuroinflammation
  - Mitochondrial dysfunction and oxidative stress
dietaryPatterns:
  - name: Mediterranean diet
    evidence: Multiple observational studies associate adherence with reduced migraine frequency.
  - name: Low-tyramine pattern
    evidence: Helpful for tyramine-sensitive sufferers; not a universal recommendation.
  - name: Higher omega-3 / lower omega-6 ratio
    evidence: Trials show frequency reduction when shifting fatty acid balance toward EPA/DHA.
foodsToAvoid:
  - name: Aged cheeses
    reason: High tyramine — a common trigger that activates the sympathetic nervous system.
  - name: Cured and processed meats
    reason: Nitrates and nitrites cause vascular changes that can trigger attacks.
  - name: Monosodium glutamate (MSG)
    reason: Documented trigger in sensitive individuals; common in processed foods and some restaurant cooking.
  - name: Artificial sweeteners (especially aspartame)
    reason: Reported trigger for a subset of migraineurs.
  - name: Alcohol (especially red wine)
    reason: Tyramine, histamine, sulfites, and dehydration combine to provoke attacks.
  - name: Chocolate
    reason: Common reported trigger; mechanism unclear but well-documented in patient diaries.
---

## How inflammation drives migraines

Migraine is increasingly understood as a neurogenic inflammatory disorder rather than a simple vascular event. During an attack, activation of the trigeminovascular system releases inflammatory neuropeptides — most notably calcitonin gene-related peptide (CGRP) — which dilate cranial blood vessels and sensitize pain-signaling neurons. Mast cells in the meninges degranulate, releasing histamine and pro-inflammatory cytokines that amplify pain.

Underlying this acute response is a more chronic state of low-grade inflammation and oxidative stress. People prone to migraine often show evidence of mitochondrial dysfunction, elevated CRP, and altered gut-brain axis signaling. This is why dietary patterns that broadly reduce systemic inflammation — Mediterranean-style eating, omega-3 sufficiency, polyphenol-rich plants — show meaningful benefit even though they don't target a single pathway.

## Why these foods help

The most compelling foods for migraine prevention act on multiple steps in the inflammatory cascade. Ginger inhibits prostaglandin synthesis and shows efficacy comparable to sumatriptan in small trials. Curcumin in turmeric blocks NF-κB activation upstream of cytokine release. Magnesium-rich greens and seeds correct the magnesium deficiency seen in many migraine sufferers. Riboflavin (vitamin B2, in dairy and eggs) supports mitochondrial function; CoQ10-rich foods do the same. Omega-3s from fatty fish shift eicosanoid balance away from inflammatory prostaglandins.

Hydration, regular meal timing, and consistent caffeine intake also matter — but those are habits more than foods.
```

- [ ] **Step 2: Verify build works with the content collection**

Run: `npm run build`
Expected: build succeeds. The collection is registered but no page consumes it yet (that's Phase 5).

- [ ] **Step 3: Commit**

```bash
git add src/content/conditions/migraine.md
git commit -m "feat: author migraine condition content entry"
```

### Task 3.7: Push end-of-phase

**Files:** none

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: Verify deploy succeeds**

Wait for the GH Actions workflow to finish green. Open `https://bcarvalho3012.github.io/inflammafree/` and confirm the homepage shows "Database currently has 5 foods."

End of Phase 3. Data shape validated, seed content authored, build pipeline still happy.

---

## Phase 4: Food UX

Goal: the food database route works. Filter, sort, search, view toggle, URL param sync. Each food has a dedicated detail page. TDD the pure filter/sort logic before wiring it to React.

### Task 4.1: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add scripts and dev deps)

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
```

- [ ] **Step 3: Add a `test` script to `package.json`**

Edit `package.json` and add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

(Keep all existing scripts. Add the two new ones.)

- [ ] **Step 4: Verify test runner works on a smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: 1 test passing.

Delete the smoke test (it was just a sanity check):

```bash
rm tests/smoke.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

### Task 4.2: Write failing tests for filter and sort pure functions

**Files:**
- Create: `tests/filter.test.ts`

- [ ] **Step 1: Create `tests/filter.test.ts`**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails (no implementation yet)**

Run: `npm test`
Expected: tests fail with "Cannot find module '../src/lib/filter'" or similar.

- [ ] **Step 3: Commit (red)**

```bash
git add tests/filter.test.ts
git commit -m "test: add filter/sort unit tests (red)"
```

### Task 4.3: Implement filter.ts (make tests green)

**Files:**
- Create: `src/lib/filter.ts`

- [ ] **Step 1: Create `src/lib/filter.ts`**

```ts
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
```

- [ ] **Step 2: Run tests to verify all pass**

Run: `npm test`
Expected: all 12 tests pass.

- [ ] **Step 3: Commit (green)**

```bash
git add src/lib/filter.ts
git commit -m "feat: implement filterFoods and sortFoods pure functions"
```

### Task 4.4: Build the ScoreMeter component

**Files:**
- Create: `src/components/ScoreMeter.astro`

- [ ] **Step 1: Create `src/components/ScoreMeter.astro`**

```astro
---
interface Props {
  score: number;
}

const { score } = Astro.props;
const dotColor = score >= 8 ? 'bg-sage-600' : score >= 5 ? 'bg-amber-500' : 'bg-terra-400';
---

<span class="inline-flex items-center gap-1.5 text-sm" aria-label={`Anti-inflammatory score: ${score} out of 10`}>
  <span class={`inline-block w-2 h-2 rounded-full ${dotColor}`} aria-hidden="true"></span>
  <span class="font-medium text-navy-900">{score}<span class="text-slate-500">/10</span></span>
</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScoreMeter.astro
git commit -m "feat: add ScoreMeter component"
```

### Task 4.5: Build the EvidenceBadge component

**Files:**
- Create: `src/components/EvidenceBadge.astro`

- [ ] **Step 1: Create `src/components/EvidenceBadge.astro`**

```astro
---
import type { EvidenceStrength } from '../lib/types';

interface Props {
  strength: EvidenceStrength;
}

const { strength } = Astro.props;

const styles: Record<EvidenceStrength, { classes: string; label: string }> = {
  strong: { classes: 'bg-sage-600 text-cream-50', label: 'Strong evidence' },
  moderate: { classes: 'bg-sage-400 text-cream-50', label: 'Moderate evidence' },
  emerging: { classes: 'border border-terra-400 text-terra-600', label: 'Emerging evidence' },
};

const { classes, label } = styles[strength];
---

<span class={`inline-block rounded-full px-2.5 py-0.5 text-xs ${classes}`}>{label}</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EvidenceBadge.astro
git commit -m "feat: add EvidenceBadge component"
```

### Task 4.6: Build the ConditionTag component

**Files:**
- Create: `src/components/ConditionTag.astro`

- [ ] **Step 1: Create `src/components/ConditionTag.astro`**

```astro
---
import { CONDITION_LABELS } from '../lib/types';
import type { ConditionSlug } from '../lib/types';

interface Props {
  slug: ConditionSlug;
}

const { slug } = Astro.props;
---

<span class="inline-block rounded-full bg-cream-100 px-2 py-0.5 text-xs text-slate-500">{CONDITION_LABELS[slug]}</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ConditionTag.astro
git commit -m "feat: add ConditionTag component"
```

### Task 4.7: Build the static FoodCard.astro

**Files:**
- Create: `src/components/FoodCard.astro`

- [ ] **Step 1: Create `src/components/FoodCard.astro`**

```astro
---
import type { Food } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/types';
import ScoreMeter from './ScoreMeter.astro';
import ConditionTag from './ConditionTag.astro';

interface Props {
  food: Food;
}

const { food } = Astro.props;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const visibleConditions = food.conditions.slice(0, 3);
const overflow = food.conditions.length - visibleConditions.length;
const primaryCompound = food.activeCompounds[0]?.name ?? '';
---

<a
  href={`${base}/foods/${food.id}`}
  class="group block rounded-xl bg-cream-100 p-6 shadow-sm hover:shadow-md transition-shadow no-underline hover:no-underline"
>
  <div class="flex items-start justify-between mb-4">
    <span class="text-xs uppercase tracking-wide text-slate-500">{CATEGORY_LABELS[food.category]}</span>
    <ScoreMeter score={food.antiInflammatoryScore} />
  </div>

  <h3 class="font-serif text-xl text-navy-900 group-hover:text-sage-800">{food.name}</h3>
  {primaryCompound && <p class="text-sm text-slate-500 mt-1">{primaryCompound}</p>}

  <p class="mt-3 text-sm text-slate-600 line-clamp-3">{food.description}</p>

  <div class="mt-4 flex flex-wrap gap-1.5">
    {visibleConditions.map((slug) => <ConditionTag slug={slug} />)}
    {overflow > 0 && <span class="text-xs text-slate-500">+{overflow}</span>}
  </div>
</a>
```

- [ ] **Step 2: Add `line-clamp` plugin to Tailwind**

Tailwind's line-clamp utility is now built-in (Tailwind 3.3+). Verify your installed version is ≥ 3.3 by checking `package.json`. If older, run `npm install -D tailwindcss@latest` and rebuild.

- [ ] **Step 3: Commit**

```bash
git add src/components/FoodCard.astro
git commit -m "feat: add static FoodCard component"
```

### Task 4.8: Build the food detail page `/foods/[slug]`

**Files:**
- Create: `src/pages/foods/[slug].astro`

- [ ] **Step 1: Create `src/pages/foods/[slug].astro`**

```astro
---
import Base from '../../layouts/Base.astro';
import { allFoods } from '../../lib/foods';
import { CATEGORY_LABELS, CONDITION_LABELS } from '../../lib/types';
import ScoreMeter from '../../components/ScoreMeter.astro';
import EvidenceBadge from '../../components/EvidenceBadge.astro';

export async function getStaticPaths() {
  return allFoods.map((food) => ({
    params: { slug: food.id },
    props: { food },
  }));
}

const { food } = Astro.props;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---

<Base title={food.name} description={food.description}>
  <article class="mx-auto max-w-3xl px-6 py-16">
    <p class="text-sm uppercase tracking-wide text-sage-600">{CATEGORY_LABELS[food.category]}</p>
    <h1 class="mt-2 text-4xl md:text-5xl font-serif">{food.name}</h1>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <ScoreMeter score={food.antiInflammatoryScore} />
      <EvidenceBadge strength={food.evidenceStrength} />
    </div>

    <p class="mt-6 text-lg text-slate-600 leading-relaxed">{food.description}</p>

    <section class="mt-12">
      <h2 class="text-2xl font-serif">Active compounds</h2>
      <ul class="mt-4 space-y-4">
        {food.activeCompounds.map((compound) => (
          <li class="rounded-lg bg-cream-100 p-5">
            <p class="font-medium text-navy-900">{compound.name}</p>
            <p class="mt-1 text-sm text-slate-600">{compound.mechanism}</p>
          </li>
        ))}
      </ul>
    </section>

    <section class="mt-12">
      <h2 class="text-2xl font-serif">Helps with</h2>
      <ul class="mt-4 flex flex-wrap gap-2">
        {food.conditions.map((slug) => (
          <li>
            <a
              href={`${base}/conditions/${slug}`}
              class="inline-block rounded-full border border-sage-400 px-3 py-1 text-sm text-sage-800 hover:bg-sage-400/10 hover:no-underline"
            >
              {CONDITION_LABELS[slug]}
            </a>
          </li>
        ))}
      </ul>
    </section>

    {(food.tips.preparation || food.tips.dosage || food.tips.bioavailability || food.tips.cautions) && (
      <section class="mt-12">
        <h2 class="text-2xl font-serif">Practical tips</h2>
        <dl class="mt-4 space-y-4">
          {food.tips.preparation && (
            <div class="rounded-lg bg-cream-100 p-5">
              <dt class="font-medium text-navy-900">Preparation</dt>
              <dd class="mt-1 text-sm text-slate-600">{food.tips.preparation}</dd>
            </div>
          )}
          {food.tips.dosage && (
            <div class="rounded-lg bg-cream-100 p-5">
              <dt class="font-medium text-navy-900">Recommended amount</dt>
              <dd class="mt-1 text-sm text-slate-600">{food.tips.dosage}</dd>
            </div>
          )}
          {food.tips.bioavailability && (
            <div class="rounded-lg bg-cream-100 p-5">
              <dt class="font-medium text-navy-900">Absorption</dt>
              <dd class="mt-1 text-sm text-slate-600">{food.tips.bioavailability}</dd>
            </div>
          )}
          {food.tips.cautions && (
            <div class="rounded-lg bg-terra-400/10 border-l-4 border-terra-600 p-5">
              <dt class="font-medium text-terra-600">Cautions</dt>
              <dd class="mt-1 text-sm text-navy-900">{food.tips.cautions}</dd>
            </div>
          )}
        </dl>
      </section>
    )}

    {food.citations && food.citations.length > 0 && (
      <section class="mt-12">
        <h2 class="text-2xl font-serif">Citations</h2>
        <ol class="mt-4 space-y-2 text-sm text-slate-600 list-decimal list-inside">
          {food.citations.map((c) => (
            <li>
              {c.url
                ? <a href={c.url} target="_blank" rel="noopener noreferrer" class="underline hover:text-sage-800">{c.title}</a>
                : <span>{c.title}</span>}
              <span class="text-slate-500"> — {c.journal}, {c.year}</span>
            </li>
          ))}
        </ol>
      </section>
    )}
  </article>
</Base>
```

- [ ] **Step 2: Build to verify static paths generate**

Run: `npm run build`
Expected: build outputs `dist/foods/turmeric/index.html`, `dist/foods/ginger/index.html`, etc. (one per seed food).

- [ ] **Step 3: Run dev server and verify a food page**

Run: `npm run dev`
Open `http://localhost:4321/inflammafree/foods/turmeric`. Expected: full detail page renders with score, evidence badge, compounds, conditions linked, tips. The "Cautions" panel should have terra-cotta styling. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/foods/[slug].astro
git commit -m "feat: add food detail page (/foods/[slug])"
```

### Task 4.9: Build the React `FoodCardLink` (used inside the island)

**Files:**
- Create: `src/components/react/FoodCardLink.tsx`

- [ ] **Step 1: Create `src/components/react/FoodCardLink.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/FoodCardLink.tsx
git commit -m "feat: add React FoodCardLink component"
```

### Task 4.10: Build the `FilterBar` React component

**Files:**
- Create: `src/components/react/FilterBar.tsx`

- [ ] **Step 1: Create `src/components/react/FilterBar.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/FilterBar.tsx
git commit -m "feat: add FilterBar React component"
```

### Task 4.11: Build the `ResultsHeader` component

**Files:**
- Create: `src/components/react/ResultsHeader.tsx`

- [ ] **Step 1: Create `src/components/react/ResultsHeader.tsx`**

```tsx
interface Props {
  shown: number;
  total: number;
}

export default function ResultsHeader({ shown, total }: Props) {
  const message = shown === total
    ? `Showing all ${total} foods`
    : `Showing ${shown} of ${total} foods`;
  return (
    <p className="text-sm text-slate-500" aria-live="polite">{message}</p>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/ResultsHeader.tsx
git commit -m "feat: add ResultsHeader component"
```

### Task 4.12: Build the `FoodDatabase` root island with URL param sync

**Files:**
- Create: `src/components/react/FoodDatabase.tsx`

- [ ] **Step 1: Create `src/components/react/FoodDatabase.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/react/FoodDatabase.tsx
git commit -m "feat: add FoodDatabase root island with URL param sync"
```

### Task 4.13: Wire `/foods/index.astro` to host the React island

**Files:**
- Modify: `src/pages/foods/index.astro`

- [ ] **Step 1: Replace `src/pages/foods/index.astro` contents**

```astro
---
import Base from '../../layouts/Base.astro';
import { allFoods } from '../../lib/foods';
import FoodDatabase from '../../components/react/FoodDatabase';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const foods = [...allFoods];
---

<Base title="Foods" description="Browse the full anti-inflammatory food database.">
  <section class="mx-auto max-w-6xl px-6 py-16">
    <header class="mb-8">
      <h1 class="text-4xl md:text-5xl font-serif">Foods</h1>
      <p class="mt-2 text-slate-500">
        {allFoods.length} anti-inflammatory foods. Filter by category, condition, score, or evidence strength.
      </p>
    </header>

    <FoodDatabase client:load foods={foods} base={base} />
  </section>
</Base>
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`
Open `http://localhost:4321/inflammafree/foods`. Expected:
- 5 food cards in the grid
- Clicking the "List" toggle switches to list view
- Typing "tur" in search reduces to 1 result (turmeric)
- Clicking a category chip filters
- URL updates as filters change (e.g., `?q=tur&view=list`)
- Refreshing the page restores the filter state from URL
- Clicking a card navigates to `/foods/turmeric` and the detail page renders
Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/foods/index.astro
git commit -m "feat: host food database react island on /foods"
```

### Task 4.14: Run tests + build, push end-of-phase

- [ ] **Step 1: Run tests**

Run: `npm test`
Expected: all 12 tests still passing.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: build succeeds. `dist/foods/index.html` and per-food pages exist.

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: Verify deploy**

Wait for GH Actions, then visit `https://bcarvalho3012.github.io/inflammafree/foods`. Test the filter interactions on the live site.

End of Phase 4. Food database works end-to-end with 5 foods.

---

## Phase 5: Conditions

Goal: condition pages live for all 8 conditions. The migraine page is fully populated (its content already exists from Phase 3); the other 7 are authored as new markdown files. The condition page template renders prose, derived top-foods, dietary patterns, and a foods-to-avoid panel.

### Task 5.1: Build the FoodsToAvoidPanel component

**Files:**
- Create: `src/components/FoodsToAvoidPanel.astro`

- [ ] **Step 1: Create `src/components/FoodsToAvoidPanel.astro`**

```astro
---
interface FoodToAvoid {
  name: string;
  reason: string;
}

interface Props {
  items: FoodToAvoid[];
}

const { items } = Astro.props;
---

{items.length > 0 && (
  <section class="mt-12">
    <div class="rounded-xl bg-terra-400/10 border-l-4 border-terra-600 p-6">
      <h2 class="flex items-center gap-2 text-2xl font-serif text-navy-900">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A85A3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Foods to avoid
      </h2>
      <ul class="mt-4 space-y-3">
        {items.map((item) => (
          <li>
            <p class="font-medium text-navy-900">{item.name}</p>
            <p class="mt-0.5 text-sm text-slate-600">{item.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FoodsToAvoidPanel.astro
git commit -m "feat: add FoodsToAvoidPanel component"
```

### Task 5.2: Build the condition page template

**Files:**
- Create: `src/pages/conditions/[slug].astro`

- [ ] **Step 1: Create `src/pages/conditions/[slug].astro`**

```astro
---
import { getCollection, type CollectionEntry } from 'astro:content';
import Base from '../../layouts/Base.astro';
import FoodCard from '../../components/FoodCard.astro';
import FoodsToAvoidPanel from '../../components/FoodsToAvoidPanel.astro';
import { allFoods } from '../../lib/foods';
import { sortFoods } from '../../lib/filter';

export async function getStaticPaths() {
  const conditions = await getCollection('conditions');
  return conditions.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

interface Props {
  entry: CollectionEntry<'conditions'>;
}

const { entry } = Astro.props;
const { Content } = await entry.render();
const data = entry.data;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const foodsForCondition = sortFoods(
  allFoods.filter((f) => f.conditions.includes(data.slug)),
  'score',
);
const topFoods = foodsForCondition.slice(0, 12);
---

<Base title={data.name} description={data.shortDescription}>
  <section class="bg-cream-100/40">
    <div class="mx-auto max-w-3xl px-6 py-16">
      <p class="text-sm uppercase tracking-wide text-sage-600">Condition</p>
      <h1 class="mt-2 text-4xl md:text-5xl font-serif">{data.name}</h1>
      <p class="mt-4 text-lg text-slate-600 leading-relaxed">{data.shortDescription}</p>
      <div class="mt-6 flex flex-wrap gap-2">
        {data.pathways.map((p) => (
          <span class="inline-block rounded-full border border-sage-400 px-3 py-0.5 text-xs text-sage-800">{p}</span>
        ))}
      </div>
    </div>
  </section>

  <article class="mx-auto max-w-3xl px-6 py-16 prose prose-lg max-w-none">
    <Content />
  </article>

  <section class="mx-auto max-w-6xl px-6 py-8">
    <div class="flex items-baseline justify-between mb-6">
      <h2 class="text-3xl font-serif">Top foods for {data.name.toLowerCase()}</h2>
      {foodsForCondition.length > 12 && (
        <a href={`${base}/foods?condition=${data.slug}`} class="text-sm text-sage-800 hover:underline">
          See all {foodsForCondition.length} →
        </a>
      )}
    </div>
    {topFoods.length === 0 ? (
      <p class="text-slate-500">No foods yet — content is being added in Phase 6.</p>
    ) : (
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topFoods.map((food) => <FoodCard food={food} />)}
      </div>
    )}
  </section>

  {data.dietaryPatterns.length > 0 && (
    <section class="mx-auto max-w-3xl px-6 py-8">
      <h2 class="text-3xl font-serif">Dietary patterns with evidence</h2>
      <ul class="mt-6 space-y-4">
        {data.dietaryPatterns.map((pattern) => (
          <li class="rounded-lg bg-cream-100 p-5">
            <p class="font-medium text-navy-900">{pattern.name}</p>
            <p class="mt-1 text-sm text-slate-600">{pattern.evidence}</p>
          </li>
        ))}
      </ul>
    </section>
  )}

  <div class="mx-auto max-w-3xl px-6 pb-16">
    <FoodsToAvoidPanel items={data.foodsToAvoid} />
  </div>
</Base>
```

- [ ] **Step 2: Add the prose typography plugin (Tailwind v4 style)**

Install:

```bash
npm install -D @tailwindcss/typography
```

In Tailwind v4, plugins are registered via the `@plugin` directive in CSS, not in a JS config. Edit `src/styles/global.css` and add this line near the top, immediately after `@import "tailwindcss";`:

```css
@plugin "@tailwindcss/typography";
```

Final order at the top of `global.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600&family=DM+Sans:wght@400;500&family=JetBrains+Mono&display=swap');
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* ... existing theme tokens ... */
}

@layer base {
  /* ... existing base styles ... */
}
```

This makes `prose`, `prose-lg`, `max-w-none`, etc. available as utility classes.

- [ ] **Step 3: Build to verify the migraine page renders**

Run: `npm run dev`
Open `http://localhost:4321/inflammafree/conditions/migraine`. Expected:
- Hero band with name, short description, pathway chips
- Migraine prose body rendering with prose typography
- Top foods grid with the relevant seed foods (turmeric, ginger, salmon all link to migraine)
- Dietary patterns cards
- Foods-to-avoid panel with terra-cotta styling
Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/conditions/[slug].astro src/styles/global.css package.json package-lock.json
git commit -m "feat: add condition page template with derived top foods"
```

### Task 5.3: Author the arthritis condition file

**Files:**
- Create: `src/content/conditions/arthritis.md`

- [ ] **Step 1: Create `src/content/conditions/arthritis.md`**

```markdown
---
slug: arthritis
name: Arthritis
order: 2
shortDescription: Joint inflammation driven by cytokine cascades and oxidative stress, including osteoarthritis and rheumatoid forms.
pathways:
  - TNF-α and IL-6 cytokine signaling
  - Cartilage matrix metalloproteinase activity
  - Synovial macrophage activation
  - Reactive oxygen species and oxidative stress
dietaryPatterns:
  - name: Mediterranean diet
    evidence: Multiple controlled trials show reduced disease activity scores in rheumatoid arthritis.
  - name: Higher omega-3 / lower omega-6 ratio
    evidence: Meta-analyses show reduced morning stiffness and joint tenderness with EPA/DHA supplementation, supported by dietary fish intake.
  - name: Plant-forward eating with adequate polyphenols
    evidence: Polyphenol-rich diets reduce CRP and ESR in observational studies.
foodsToAvoid:
  - name: Refined sugar and high-glycemic carbohydrates
    reason: Drive postprandial inflammation and contribute to advanced glycation end-product formation.
  - name: Industrial seed oils high in linoleic acid
    reason: Skews eicosanoid production toward pro-inflammatory pathways.
  - name: Processed meats
    reason: High in advanced glycation end-products that worsen joint inflammation.
  - name: Excess alcohol
    reason: Increases systemic inflammation and disrupts gut barrier integrity.
---

## How inflammation drives arthritis

Arthritis is a category, not a single disease — but inflammation underlies the destructive process in nearly every form. In rheumatoid arthritis, autoimmune dysregulation drives synovial macrophages to release TNF-α and IL-6, which recruit more immune cells and stimulate fibroblasts to produce matrix-degrading enzymes. The result is progressive cartilage and bone erosion. Osteoarthritis was once considered "wear and tear," but it's now understood as a low-grade inflammatory condition where mechanical stress combines with chronic cytokine signaling to break down joint tissue.

In both cases, oxidative stress amplifies the damage. Reactive oxygen species generated by activated immune cells and stressed chondrocytes degrade the extracellular matrix and impair tissue repair. Chronic systemic inflammation from poor diet, gut dysbiosis, or visceral fat amplifies the local joint inflammation through circulating cytokines.

## Why these foods help

Omega-3 fatty acids from fatty fish, walnuts, and flaxseed compete with arachidonic acid for the COX and LOX enzymes, shifting eicosanoid production away from inflammatory prostaglandins and leukotrienes. Polyphenols in extra virgin olive oil (oleocanthal), turmeric (curcumin), green tea (EGCG), and berries directly inhibit NF-κB activation upstream of cytokine release. Sulfur-rich vegetables — broccoli, cabbage, garlic — supply substrates for cellular antioxidant systems. Magnesium, vitamin K2, and vitamin D from leafy greens, fermented dairy, and sun exposure support bone and cartilage maintenance.

The Mediterranean dietary pattern as a whole shows the strongest evidence — likely because no single nutrient drives the benefit, but rather the combined reduction in inflammatory load.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/arthritis.md
git commit -m "feat: author arthritis condition content"
```

### Task 5.4: Author the gut health condition file

**Files:**
- Create: `src/content/conditions/gut.md`

- [ ] **Step 1: Create `src/content/conditions/gut.md`**

```markdown
---
slug: gut
name: Gut Health
order: 3
shortDescription: Inflammatory and functional gut conditions driven by barrier disruption, dysbiosis, and immune dysregulation.
pathways:
  - Intestinal barrier permeability ("leaky gut")
  - Microbiome dysbiosis and SCFA depletion
  - Mucosal immune activation and IgA dysfunction
  - Visceral hypersensitivity in IBS
dietaryPatterns:
  - name: Fiber-diverse plant-rich diet
    evidence: 30+ different plants per week correlates with greater microbiome diversity in observational data.
  - name: Mediterranean diet
    evidence: Reduces inflammatory markers in IBD and improves symptoms in IBS in controlled trials.
  - name: Low-FODMAP (short-term, IBS only)
    evidence: Strong evidence for symptom relief in IBS — but not a long-term pattern; reintroduce foods to maintain microbiome diversity.
foodsToAvoid:
  - name: Emulsifiers (carboxymethylcellulose, polysorbate-80)
    reason: Disrupt the mucus layer protecting the gut epithelium; common in processed foods.
  - name: Artificial sweeteners (sucralose, aspartame)
    reason: Alter microbiome composition and may worsen glucose tolerance and inflammation.
  - name: Excess alcohol
    reason: Damages epithelial tight junctions, increasing intestinal permeability.
  - name: Ultra-processed foods
    reason: Low fiber, high additives, low microbiome-feeding substrate.
---

## How inflammation drives gut conditions

The gut is where inflammation, immune function, and the microbiome meet. A healthy intestine maintains a tight epithelial barrier coated in mucus, hosting a diverse microbial community that produces short-chain fatty acids (SCFAs) like butyrate to feed enterocytes and tune local immunity. When this system breaks down — through poor diet, antibiotics, chronic stress, or autoimmune triggers — barrier integrity drops, dysbiotic species expand, and bacterial products like LPS leak into circulation, driving systemic low-grade inflammation.

In inflammatory bowel disease (Crohn's, ulcerative colitis), this manifests as overt mucosal inflammation. In IBS, the picture is more subtle — visceral hypersensitivity, altered motility, and microbiome shifts without obvious structural disease. In both, dietary inputs shape the microbiome and the inflammatory tone of the gut wall daily.

## Why these foods help

Fermentable fiber from a wide variety of plants feeds beneficial bacteria that produce butyrate — the primary energy source for colonocytes and a powerful regulator of local immunity. Fermented foods (yogurt, kefir, kimchi, sauerkraut) deliver live cultures and bioactive peptides; even when the microbes don't permanently colonize, they transiently influence gut function. Polyphenols from berries, olive oil, and tea reach the colon largely intact and are metabolized by gut bacteria into anti-inflammatory compounds. Bone broth and gelatin-rich foods supply collagen amino acids that support epithelial integrity. Omega-3s reduce mucosal inflammation in IBD trials.

For IBS specifically, the right approach depends on the individual — some need a temporary low-FODMAP phase to identify triggers; most benefit long-term from gradually expanding plant diversity rather than restricting it.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/gut.md
git commit -m "feat: author gut health condition content"
```

### Task 5.5: Author the cardiovascular condition file

**Files:**
- Create: `src/content/conditions/cardiovascular.md`

- [ ] **Step 1: Create `src/content/conditions/cardiovascular.md`**

```markdown
---
slug: cardiovascular
name: Cardiovascular Health
order: 4
shortDescription: Inflammation drives atherosclerosis, hypertension progression, and adverse cardiac events independent of cholesterol levels.
pathways:
  - Endothelial activation and adhesion molecule expression
  - Oxidized LDL uptake by macrophages forming foam cells
  - Vascular smooth muscle inflammation
  - Elevated CRP, IL-6, and fibrinogen
dietaryPatterns:
  - name: Mediterranean diet
    evidence: PREDIMED trial showed ~30% reduction in cardiovascular events versus low-fat control.
  - name: DASH diet
    evidence: Reduces blood pressure and CRP; especially effective for sodium-sensitive hypertension.
  - name: Plant-forward eating
    evidence: Higher plant-to-animal protein ratio associates with lower all-cause mortality in cohort studies.
foodsToAvoid:
  - name: Trans fats (partially hydrogenated oils)
    reason: Promote endothelial dysfunction and raise inflammatory markers more than any other fat.
  - name: Excess sodium from processed foods
    reason: Drives endothelial inflammation and hypertension in salt-sensitive individuals.
  - name: Sugar-sweetened beverages
    reason: Linked to elevated CRP, triglycerides, and cardiovascular events in long-term studies.
  - name: Processed and cured meats
    reason: Nitrates, sodium, and AGEs combine to elevate cardiovascular risk.
---

## How inflammation drives cardiovascular disease

Atherosclerosis is fundamentally an inflammatory disease. It begins when the endothelium — the thin layer lining blood vessels — becomes activated by stressors like oxidized LDL, high blood pressure, smoking, or insulin resistance. Activated endothelial cells express adhesion molecules that recruit monocytes, which migrate into the vessel wall and become macrophages. These macrophages engulf oxidized LDL and turn into foam cells, the building blocks of atherosclerotic plaques. Inflammatory cytokines released in the lesion attract more immune cells, weaken the fibrous cap, and ultimately set the stage for plaque rupture and thrombosis.

CRP, IL-6, and other inflammatory markers predict cardiovascular events independently of cholesterol levels. The CANTOS trial demonstrated that targeting IL-1β with an antibody reduces cardiovascular events even without changing lipid levels — proof that inflammation is causal, not merely a marker.

## Why these foods help

Long-chain omega-3 fatty acids from fatty fish are the most consistent intervention: they lower triglycerides, reduce vascular inflammation, and improve endothelial function. Polyphenols in extra virgin olive oil (especially oleocanthal and hydroxytyrosol) reduce LDL oxidation and improve flow-mediated dilation. Soluble fiber from oats, legumes, and apples binds bile acids and lowers LDL. Nitrates from leafy greens and beets convert to nitric oxide, which relaxes blood vessels and improves endothelial function. Magnesium and potassium from greens, nuts, and legumes support healthy blood pressure regulation.

The Mediterranean pattern reduces cardiovascular events by roughly 30% in randomized trials — a result no single drug class achieves through diet alone.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/cardiovascular.md
git commit -m "feat: author cardiovascular condition content"
```

### Task 5.6: Author the autoimmune condition file

**Files:**
- Create: `src/content/conditions/autoimmune.md`

- [ ] **Step 1: Create `src/content/conditions/autoimmune.md`**

```markdown
---
slug: autoimmune
name: Autoimmune Conditions
order: 5
shortDescription: Conditions where immune dysregulation drives self-tissue inflammation, including Hashimoto's, lupus, MS, psoriasis, and IBD.
pathways:
  - Loss of self-tolerance and Th17 polarization
  - Reduced T-regulatory cell function
  - Chronic systemic cytokine elevation
  - Gut barrier disruption and molecular mimicry
dietaryPatterns:
  - name: Mediterranean diet
    evidence: Reduces disease activity in lupus, RA, and psoriasis cohorts.
  - name: AIP (autoimmune protocol) for elimination phase only
    evidence: Some evidence for symptom reduction in Hashimoto's and IBD; not a long-term diet — reintroduce foods to maintain diversity.
  - name: Adequate vitamin D and omega-3
    evidence: Both correlate inversely with autoimmune disease activity in observational and small interventional studies.
foodsToAvoid:
  - name: Highly processed foods with additives
    reason: Emulsifiers and preservatives may disrupt gut barrier and contribute to autoimmune triggering.
  - name: Excess omega-6 industrial seed oils
    reason: Skews eicosanoid balance toward pro-inflammatory pathways.
  - name: Trigger-specific foods (varies by individual)
    reason: Common reactive foods include gluten (especially in celiac and Hashimoto's), dairy, and nightshades — but reactivity is highly individual.
---

## How inflammation drives autoimmune conditions

Autoimmunity arises when the immune system loses tolerance to self-tissue. Genetic susceptibility sets the stage, but environmental triggers — infections, stress, dysbiosis, gut barrier disruption — initiate and sustain the autoimmune response. T-regulatory cells, which normally suppress aberrant immune responses, are often deficient or dysfunctional, while Th17 cells drive inflammation through IL-17 and other cytokines.

The gut plays a central role. Many autoimmune conditions share gut barrier dysfunction as a feature; bacterial products and undigested food fragments crossing into circulation can trigger immune responses through molecular mimicry — where bacterial proteins resemble self-tissue proteins. This is well-established in conditions like celiac disease (gluten ↔ tissue transglutaminase) and increasingly recognized in Hashimoto's, MS, and others.

## Why these foods help

Omega-3 fatty acids reduce systemic inflammation and shift T-cell populations toward more regulatory phenotypes. Polyphenols, especially from berries, green tea, and turmeric, suppress Th17 responses. Vitamin D-rich foods (and adequate sun exposure) support T-regulatory cell function — vitamin D deficiency is consistently associated with worse autoimmune outcomes. Fermented foods and diverse fiber feed gut bacteria that produce butyrate, which supports gut barrier integrity and induces T-regulatory cells.

The right approach often involves both an addition (anti-inflammatory foods, gut-supportive nutrients) and a subtraction (identifying and removing personal trigger foods). Personalization matters more here than in any other category.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/autoimmune.md
git commit -m "feat: author autoimmune condition content"
```

### Task 5.7: Author the skin condition file

**Files:**
- Create: `src/content/conditions/skin.md`

- [ ] **Step 1: Create `src/content/conditions/skin.md`**

```markdown
---
slug: skin
name: Skin Health
order: 6
shortDescription: Inflammatory skin conditions including eczema, psoriasis, rosacea, and acne — driven by skin barrier disruption and systemic inflammation.
pathways:
  - Skin barrier (filaggrin and ceramide) dysfunction
  - Th2/Th17 imbalance in eczema and psoriasis respectively
  - Cutaneous oxidative stress and UV-induced inflammation
  - Gut-skin axis signaling via systemic cytokines
dietaryPatterns:
  - name: Mediterranean diet
    evidence: Lower psoriasis severity and rosacea flares in observational studies.
  - name: Adequate omega-3 and zinc
    evidence: Both reduce eczema severity and improve barrier function in trials.
  - name: Plant-forward eating with diverse polyphenols
    evidence: Improves antioxidant capacity in skin and reduces UV damage in controlled studies.
foodsToAvoid:
  - name: High-glycemic foods and dairy (for acne)
    reason: Drive IGF-1 signaling and androgen-mediated sebum production.
  - name: Common rosacea triggers (alcohol, spicy food, hot beverages)
    reason: Trigger vasodilation and flushing — varies by individual.
  - name: Highly processed foods
    reason: Sugar, trans fats, and additives drive systemic inflammation that manifests in skin.
---

## How inflammation drives skin conditions

The skin is the largest organ and a major immune interface. Inflammatory skin conditions all share dysfunction of the barrier (the outer stratum corneum) plus an immune component. In eczema, barrier defects (often filaggrin mutations) allow allergens and microbes through, triggering a Th2-dominant immune response with IgE and IL-4/13. In psoriasis, the immune system is primarily dysregulated with Th17/IL-17 dominance, driving the rapid keratinocyte turnover that produces scaling plaques. Rosacea involves vascular hyperreactivity plus innate immune dysregulation. Acne combines hormonal sebum overproduction, follicular hyperkeratinization, C. acnes proliferation, and inflammatory cytokine release.

Underlying all of this is the gut-skin axis: systemic inflammation from gut dysbiosis or poor diet shows up on skin. CRP and IL-6 elevations track with skin disease severity in cohort studies.

## Why these foods help

Omega-3 fatty acids reduce systemic and cutaneous inflammation; meta-analyses show modest benefit in eczema and psoriasis. Vitamin D from fatty fish, eggs, and fortified foods supports immune regulation in skin. Zinc from oysters, beef, and pumpkin seeds is essential for barrier function and wound healing. Polyphenols from green tea, berries, and dark chocolate protect against UV damage and quench oxidative stress. Probiotics and fermented foods improve eczema in some trials, likely via gut-skin axis effects.

For acne specifically, lower-glycemic patterns and less dairy improve outcomes in trials — though the effect size is modest and individual.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/skin.md
git commit -m "feat: author skin health condition content"
```

### Task 5.8: Author the chronic pain condition file

**Files:**
- Create: `src/content/conditions/pain.md`

- [ ] **Step 1: Create `src/content/conditions/pain.md`**

```markdown
---
slug: pain
name: Chronic Pain
order: 7
shortDescription: Persistent pain driven by neuroinflammation, central sensitization, and peripheral cytokine signaling.
pathways:
  - Microglial activation and neuroinflammation
  - Peripheral nociceptor sensitization by cytokines
  - Central sensitization in dorsal horn neurons
  - Mitochondrial dysfunction and oxidative stress
dietaryPatterns:
  - name: Mediterranean diet
    evidence: Reduces pain scores in fibromyalgia and chronic musculoskeletal pain in trials.
  - name: Anti-inflammatory eating (high omega-3, low refined sugar)
    evidence: Improves pain in chronic widespread pain populations.
  - name: Adequate magnesium and vitamin D
    evidence: Both correlate inversely with chronic pain severity; supplementation helps deficient individuals.
foodsToAvoid:
  - name: Refined sugar and high-fructose corn syrup
    reason: Drive systemic inflammation and worsen pain perception in chronic pain populations.
  - name: Excess alcohol
    reason: Disrupts sleep (a major pain modulator), depletes B vitamins, and increases inflammation.
  - name: Highly processed foods
    reason: Combine pro-inflammatory ingredients while displacing nutrient-dense foods that support pain modulation.
---

## How inflammation drives chronic pain

Chronic pain is now understood as a neuroinflammatory condition rather than a purely peripheral one. When acute pain becomes chronic, microglia (the brain's resident immune cells) shift into a persistently activated state, releasing TNF-α, IL-1β, and IL-6 within the nervous system itself. This neuroinflammation sensitizes pain-signaling pathways at multiple levels: peripheral nociceptors become more reactive, dorsal horn neurons amplify signals, and descending pain-modulating systems lose their inhibitory function.

Diet and gut microbiome composition influence neuroinflammation through systemic inflammatory cytokines and direct vagal signaling. Poor sleep, common in chronic pain, further amplifies microglial activation. Mitochondrial dysfunction — increasingly seen in fibromyalgia and other chronic pain conditions — both contributes to and results from chronic neuroinflammation.

## Why these foods help

Omega-3 fatty acids cross the blood-brain barrier and shift the eicosanoid balance in nervous tissue toward less inflammatory mediators; resolvins and protectins derived from EPA and DHA actively resolve neuroinflammation. Polyphenols from turmeric, ginger, and green tea cross the BBB to varying degrees and modulate microglial activation. Magnesium-rich foods support NMDA receptor regulation, blunting central sensitization. CoQ10 and B vitamins from organ meats, eggs, and leafy greens support mitochondrial function.

Beyond specific compounds, blood sugar stability matters — large glucose excursions worsen pain perception in chronic pain patients. Anti-inflammatory eating combined with adequate sleep and gentle movement is the foundation; specific nutrient interventions stack on top.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/pain.md
git commit -m "feat: author chronic pain condition content"
```

### Task 5.9: Author the neurological condition file

**Files:**
- Create: `src/content/conditions/neurological.md`

- [ ] **Step 1: Create `src/content/conditions/neurological.md`**

```markdown
---
slug: neurological
name: Neurological Health
order: 8
shortDescription: Brain inflammation underlies cognitive decline, mood disorders, and neurodegenerative conditions through microglial dysregulation.
pathways:
  - Microglial activation and neuroinflammation
  - Blood-brain barrier dysfunction
  - Oxidative stress in neurons
  - Reduced BDNF and impaired neuroplasticity
dietaryPatterns:
  - name: MIND diet (Mediterranean-DASH hybrid for brain health)
    evidence: 35-53% reduction in Alzheimer's risk in long-term cohort studies.
  - name: Mediterranean diet
    evidence: Slower cognitive decline and reduced depression risk in trials and cohorts.
  - name: Adequate omega-3 (especially DHA)
    evidence: Higher DHA correlates with larger brain volume and slower cognitive decline.
foodsToAvoid:
  - name: Trans fats and excess saturated fat from processed sources
    reason: Strongly associated with accelerated cognitive decline and Alzheimer's risk.
  - name: Refined sugar and ultra-processed foods
    reason: Promote insulin resistance in the brain (sometimes called "type 3 diabetes" in the context of Alzheimer's).
  - name: Excess alcohol
    reason: Direct neurotoxicity at high doses; even moderate intake affects sleep architecture and BDNF.
---

## How inflammation drives neurological conditions

The brain is increasingly understood as an immunologically active organ where microglia function as resident immune cells. Under normal conditions, microglia patrol the brain, prune synapses, and maintain homeostasis. Under chronic stress — from systemic inflammation, oxidative damage, accumulated misfolded proteins, or persistent infection — microglia shift into an activated state, releasing pro-inflammatory cytokines and reactive oxygen species into the local environment. This neuroinflammation damages neurons, impairs synaptic plasticity, and contributes to virtually every chronic neurological condition.

In Alzheimer's disease, microglia respond to amyloid-β plaques but lose their ability to clear them effectively, instead sustaining chronic inflammation. In depression, peripheral inflammation raises cytokines that cross the blood-brain barrier and reduce serotonin synthesis while increasing kynurenine metabolites. In Parkinson's, α-synuclein aggregates trigger sustained microglial activation. Even normal aging involves a degree of microglial priming that amplifies inflammatory responses.

## Why these foods help

DHA from fatty fish is the dominant fatty acid in brain membranes and is critical for membrane fluidity and synaptic function. Polyphenols from berries, green tea, and dark chocolate cross the BBB and reduce microglial activation; flavanols specifically improve cerebral blood flow and cognitive performance in trials. Curcumin from turmeric reduces amyloid pathology in animal studies and shows promise in human trials for cognition. Choline and B vitamins support neurotransmitter synthesis and methylation pathways. Magnesium supports NMDA receptor function and synaptic plasticity.

The MIND diet, which combines the strongest brain-related elements of the Mediterranean and DASH patterns, shows the largest effect size in observational data — 35-53% reduction in Alzheimer's risk over 4-9 years of follow-up.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/conditions/neurological.md
git commit -m "feat: author neurological condition content"
```

### Task 5.10: End-of-phase verification and push

- [ ] **Step 1: Run build and verify all 8 condition pages render**

Run: `npm run build`
Expected: build succeeds. `dist/conditions/migraine/index.html`, `arthritis/index.html`, ... `neurological/index.html` all exist.

Run: `npm run preview`
Open `http://localhost:4321/inflammafree/conditions/migraine` and click through to each of the 8 conditions. Expected: each renders with hero, prose, top foods (some may be sparse with only 5 seed foods — that's fine, fills out in Phase 6), dietary patterns, foods-to-avoid panel.

Stop preview with Ctrl+C.

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Verify on production**

Wait for GH Actions to finish, then visit `https://bcarvalho3012.github.io/inflammafree/conditions/migraine` and at least 2 other condition pages.

End of Phase 5. All 8 condition pages live.

---

## Phase 6: Bulk Content

Goal: ~80-100 total foods in `foods.json`, verified citations on the top ~25-30, real meal plan and science pages, an auto-generated bibliography, and a real homepage replacing the placeholder.

### How to add a food (the pattern)

Every food entry in `foods.json` must conform to the schema in `src/lib/schemas.ts`. Use this template (fill in real values) — `citations: null` for now; citations get added in Task 6.11:

```json
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "category": "fruit | vegetable | protein | spice | grain | fat-oil | beverage | fermented | nut-seed | legume",
  "description": "1-2 sentences about the food, what makes it relevant.",
  "antiInflammatoryScore": 1-10,
  "activeCompounds": [
    { "name": "Compound name", "mechanism": "Specific anti-inflammatory mechanism" }
  ],
  "conditions": ["migraine", "arthritis", "gut", "cardiovascular", "autoimmune", "skin", "pain", "neurological"],
  "evidenceStrength": "strong | moderate | emerging",
  "citations": null,
  "tips": {
    "preparation": "...",
    "dosage": "...",
    "bioavailability": "...",
    "cautions": "..."
  }
}
```

Scoring guide:
- **9-10:** broad evidence across multiple conditions, multiple potent compounds, established mechanisms (turmeric, salmon, EVOO, blueberries, ginger)
- **7-8:** strong single-condition evidence or strong mechanism with broad applicability (broccoli, walnuts, green tea)
- **5-6:** moderate evidence, supportive role (oats, garlic, eggs)
- **3-4:** emerging evidence or modest single-pathway effect (most niche fermented or seed foods)
- **1-2:** rarely used — only if you want to include something with very preliminary evidence

After each batch task, run `npm run build` to ensure the Zod schema accepts the additions. If validation fails, the error message will point to the exact entry and field.

### Task 6.1: Add fruits batch (target: 10 fruits beyond blueberries)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add the following 10 fruit entries to `foods.json`**

Add these as new array entries (alongside existing 5). Foods to add:
- `tart-cherries` (Tart Cherries) — anthocyanins; arthritis, pain, neurological; score 8
- `pomegranate` (Pomegranate) — punicalagins, urolithins; cardiovascular, arthritis, gut; score 8
- `strawberries` (Strawberries) — anthocyanins, vitamin C; cardiovascular, neurological, skin; score 7
- `raspberries` (Raspberries) — ellagitannins, anthocyanins; cardiovascular, neurological, gut; score 7
- `blackberries` (Blackberries) — anthocyanins, ellagic acid; cardiovascular, neurological; score 7
- `oranges` (Oranges) — vitamin C, hesperidin; cardiovascular, skin, autoimmune; score 6
- `pineapple` (Pineapple) — bromelain; arthritis, pain, gut; score 7
- `papaya` (Papaya) — papain, lycopene, vitamin C; gut, skin, cardiovascular; score 6
- `kiwi` (Kiwi) — vitamin C, polyphenols; gut, cardiovascular, skin; score 6
- `apples` (Apples) — quercetin, pectin; cardiovascular, gut, neurological; score 6

For each, fill out all fields per the template. Set `citations: null` for now.

Example fully-filled entry for tart cherries:

```json
{
  "id": "tart-cherries",
  "name": "Tart Cherries",
  "category": "fruit",
  "description": "Sour cherry varieties (Montmorency, morello) with high concentrations of anthocyanins; well-studied for inflammation and sleep.",
  "antiInflammatoryScore": 8,
  "activeCompounds": [
    { "name": "Anthocyanins", "mechanism": "Inhibit COX-1 and COX-2 enzymes; reduce CRP and uric acid levels" },
    { "name": "Melatonin", "mechanism": "Antioxidant and circadian-regulating; modest contribution but unique among foods" }
  ],
  "conditions": ["arthritis", "pain", "neurological", "cardiovascular"],
  "evidenceStrength": "strong",
  "citations": null,
  "tips": {
    "preparation": "Fresh in season, frozen, or as unsweetened concentrate",
    "dosage": "1 cup whole cherries OR 1 oz concentrate daily",
    "bioavailability": "Anthocyanins are heat-stable; concentrate retains potency",
    "cautions": "Concentrate is high-sugar; check for added sweeteners"
  }
}
```

- [ ] **Step 2: Run build to validate**

Run: `npm run build`
Expected: validation passes. The `/foods` page now shows 15 foods.

- [ ] **Step 3: Commit**

```bash
git add src/data/foods.json
git commit -m "feat: add 10 fruit entries to food database"
```

### Task 6.2: Add vegetables batch (target: 15 vegetables)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add the following 15 vegetable entries**

Foods to add:
- `broccoli` — sulforaphane; arthritis, cardiovascular, autoimmune, neurological; score 8
- `kale` — vitamin K, lutein, sulforaphane, calcium; broad coverage; score 8
- `spinach` — magnesium, folate, lutein; migraine, cardiovascular, neurological; score 7
- `swiss-chard` — magnesium, vitamin K, betalains; cardiovascular, migraine; score 7
- `brussels-sprouts` — sulforaphane, vitamin K; arthritis, cardiovascular; score 7
- `red-cabbage` — anthocyanins, sulforaphane; gut, cardiovascular; score 7
- `cauliflower` — sulforaphane (less than broccoli), choline; arthritis, gut; score 6
- `beets` — betalains, nitrates; cardiovascular, pain; score 7
- `carrots` — beta-carotene, falcarinol; skin, cardiovascular; score 5
- `bell-peppers` — vitamin C, capsaicinoids (less than chiles); skin, cardiovascular; score 6
- `sweet-potato` — beta-carotene, anthocyanins (purple varieties); skin, cardiovascular; score 6
- `tomatoes` — lycopene; cardiovascular, skin; score 6
- `asparagus` — glutathione, inulin; gut, cardiovascular; score 6
- `garlic` — allicin, organosulfur compounds; cardiovascular, autoimmune, gut; score 8
- `onions` — quercetin, sulfur compounds; cardiovascular, gut; score 7

Use the same template pattern as Task 6.1.

- [ ] **Step 2: Run build to validate**

Run: `npm run build`
Expected: validation passes. The `/foods` page shows 30 foods.

- [ ] **Step 3: Commit**

```bash
git add src/data/foods.json
git commit -m "feat: add 15 vegetable entries to food database"
```

### Task 6.3: Add proteins batch (target: 6 proteins beyond salmon)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add the following 6 protein entries**

Foods to add:
- `sardines` — EPA/DHA, vitamin D, calcium; cardiovascular, arthritis, neurological, autoimmune; score 9
- `mackerel` — EPA/DHA; cardiovascular, arthritis, neurological; score 8
- `anchovies` — EPA/DHA; cardiovascular, neurological; score 8
- `eggs` (pasture-raised) — choline, lutein, omega-3 (in pasture-raised); neurological, skin; score 6
- `oysters` — zinc, omega-3, B12; skin, autoimmune, neurological; score 7
- `bone-broth` — collagen peptides, glutamine, glycine; gut, arthritis, skin; score 6

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 6 protein entries to food database"
```

### Task 6.4: Add spices batch (target: 10 spices beyond turmeric and ginger)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add the following 10 spice entries**

Foods to add:
- `cinnamon` — cinnamaldehyde; cardiovascular, gut; score 7
- `cayenne` — capsaicin; pain, cardiovascular; score 7
- `black-pepper` — piperine; bioavailability enhancer; gut, neurological; score 6
- `cloves` — eugenol; arthritis, gut; score 7
- `rosemary` — carnosic acid, rosmarinic acid; neurological, arthritis; score 7
- `oregano` — carvacrol, thymol; gut, autoimmune; score 7
- `thyme` — thymol, rosmarinic acid; gut, skin; score 6
- `sage` — rosmarinic acid, carnosol; neurological, skin; score 6
- `basil` (especially holy basil/tulsi) — eugenol, ursolic acid; neurological, autoimmune; score 6
- `parsley` (and cilantro) — apigenin, vitamin K; cardiovascular, autoimmune; score 6

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 10 spice entries to food database"
```

### Task 6.5: Add grains batch (target: 5 grains)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add 5 grain entries**

- `oats` — beta-glucan, avenanthramides; cardiovascular, gut, skin; score 7
- `quinoa` — quercetin, complete protein; cardiovascular, gut; score 6
- `brown-rice` — magnesium, fiber; gut, cardiovascular; score 5
- `buckwheat` — rutin, magnesium; cardiovascular, neurological; score 6
- `barley` — beta-glucan, fiber; cardiovascular, gut; score 6

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 5 grain entries to food database"
```

### Task 6.6: Add fats and oils batch (target: 4 beyond olive oil)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add 4 entries**

- `avocado` — monounsaturated fat, lutein, fiber; cardiovascular, skin, neurological; score 8
- `flaxseed-oil` — ALA omega-3, lignans; cardiovascular, autoimmune, skin; score 7
- `walnut-oil` — ALA omega-3, polyphenols; cardiovascular, neurological; score 6
- `coconut-oil` — MCTs, lauric acid; gut, neurological; score 5 (note: more controversial — moderate score reflects mixed evidence)

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 4 fat/oil entries to food database"
```

### Task 6.7: Add beverages batch (target: 5 beverages)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add 5 entries**

- `green-tea` — EGCG, L-theanine; broad coverage including neurological, cardiovascular, autoimmune; score 8
- `matcha` — EGCG (concentrated), L-theanine; same as green tea but higher dose; score 8
- `rooibos-tea` — aspalathin, nothofagin; cardiovascular, autoimmune; score 6
- `hibiscus-tea` — anthocyanins, hibiscus acids; cardiovascular, skin; score 6
- `coffee` (in moderation) — chlorogenic acid, caffeine; neurological, cardiovascular; score 6

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 5 beverage entries to food database"
```

### Task 6.8: Add fermented foods batch (target: 6 fermented)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add 6 entries**

- `kefir` — diverse probiotic strains; gut, autoimmune, skin; score 8
- `yogurt` (live cultures, unsweetened) — Lactobacillus, Bifidobacterium; gut, autoimmune, skin; score 7
- `kimchi` — diverse Lactobacillus species, plant compounds; gut, autoimmune, cardiovascular; score 8
- `sauerkraut` (raw, unpasteurized) — Lactobacillus, isothiocyanates; gut, cardiovascular; score 7
- `miso` — diverse fermentation products, isoflavones; gut, cardiovascular; score 6
- `tempeh` — fermented soy isoflavones, probiotics; cardiovascular, gut; score 7

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 6 fermented food entries to food database"
```

### Task 6.9: Add nuts and seeds batch (target: 8 nuts/seeds)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add 8 entries**

- `walnuts` — ALA, polyphenols, urolithins (after gut conversion); cardiovascular, neurological; score 8
- `almonds` — vitamin E, magnesium; cardiovascular, skin; score 7
- `chia-seeds` — ALA, fiber; cardiovascular, gut; score 7
- `flaxseeds` — ALA, lignans, fiber; cardiovascular, autoimmune; score 8
- `hemp-seeds` — balanced omega-3/6, complete protein; cardiovascular, skin; score 7
- `pumpkin-seeds` — magnesium, zinc, tryptophan; migraine, neurological; score 7
- `brazil-nuts` — selenium (very high); autoimmune, neurological; score 7
- `sesame-seeds` — sesamin, lignans; cardiovascular, arthritis; score 6

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 8 nut/seed entries to food database"
```

### Task 6.10: Add legumes batch (target: 5 legumes)

**Files:**
- Modify: `src/data/foods.json`

- [ ] **Step 1: Add 5 entries**

- `lentils` — fiber, folate, magnesium; cardiovascular, gut; score 7
- `chickpeas` — fiber, folate, manganese; cardiovascular, gut; score 7
- `black-beans` — anthocyanins, fiber; cardiovascular, gut; score 7
- `kidney-beans` — fiber, magnesium; cardiovascular, gut; score 6
- `edamame` (whole soy) — isoflavones, complete protein; cardiovascular, skin; score 7

- [ ] **Step 2: Run build, commit**

```bash
npm run build
git add src/data/foods.json
git commit -m "feat: add 5 legume entries to food database"
```

### Task 6.11: Verify and add citations to top-tier foods

**Files:**
- Modify: `src/data/foods.json`

Citation policy: every citation must be a real, locatable study. Verify each one before inserting via PubMed search (https://pubmed.ncbi.nlm.nih.gov/) or Google Scholar. Prefer systematic reviews and meta-analyses. If a specific claim cannot be verified, leave `citations: null` for that food rather than fabricating.

- [ ] **Step 1: Identify the top-tier foods to cite**

The 25-30 highest-evidence foods in the database. Suggested list (review and adjust as you go):

1. Turmeric (curcumin) — broad evidence
2. Ginger — migraine, pain
3. Salmon (omega-3) — cardiovascular, autoimmune
4. Sardines (omega-3, vitamin D)
5. Extra virgin olive oil (oleocanthal)
6. Blueberries (anthocyanins)
7. Tart cherries (anthocyanins, pain/sleep)
8. Walnuts (ALA, brain health)
9. Green tea (EGCG)
10. Matcha (concentrated EGCG)
11. Broccoli (sulforaphane)
12. Kale (multiple)
13. Garlic (allicin, cardiovascular)
14. Pomegranate (punicalagins)
15. Avocado (monounsaturated, brain)
16. Chia seeds (ALA, fiber)
17. Flaxseeds (ALA, lignans)
18. Spinach (magnesium, migraine)
19. Pumpkin seeds (magnesium, migraine)
20. Beets (nitrates, vascular)
21. Kefir (probiotics, gut)
22. Kimchi (probiotics, gut)
23. Oats (beta-glucan)
24. Cinnamon (cardiovascular)
25. Brazil nuts (selenium)
26. Onions (quercetin)
27. Cayenne (capsaicin, pain)
28. Pineapple (bromelain)

- [ ] **Step 2: For each top-tier food, search PubMed and add 1-3 verified citations**

For each food in the list above:

1. Open https://pubmed.ncbi.nlm.nih.gov/
2. Search: `<food name> inflammation systematic review` OR `<food name> <condition> randomized trial`
3. Identify a recent (preferably 2015+), peer-reviewed systematic review, meta-analysis, or large RCT.
4. Capture: full title, journal name, year, PubMed URL.
5. Edit the corresponding food entry in `foods.json`. Replace `"citations": null` with:

```json
"citations": [
  {
    "title": "Exact title as it appears on PubMed",
    "journal": "Journal name",
    "year": 2021,
    "url": "https://pubmed.ncbi.nlm.nih.gov/12345678/"
  }
]
```

If you find a stronger second citation, add it as a second array entry (max 3 per food).

After every 5 foods, run `npm run build` to confirm validation still passes (the URL validator catches malformed URLs).

- [ ] **Step 3: Commit incrementally**

Commit every 5-10 cited foods rather than all at the end:

```bash
git add src/data/foods.json
git commit -m "feat: add verified citations to <food1>, <food2>, ..."
```

- [ ] **Step 4: Final build check**

After all top-tier foods have citations:

```bash
npm run build
```

Expected: passes. Any food without verifiable citation legitimately keeps `citations: null` — that's the spec policy, not a failure.

### Task 6.12: Build the bibliography helper

**Files:**
- Create: `src/lib/bibliography.ts`

- [ ] **Step 1: Create `src/lib/bibliography.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/bibliography.ts
git commit -m "feat: add bibliography builder grouping citations by condition"
```

### Task 6.13: Author the science page content

**Files:**
- Modify: `src/content/config.ts` (add standalone collection)
- Create: `src/content/standalone/science.md`

- [ ] **Step 1: Update `src/content/config.ts` to register the standalone collection**

```ts
import { defineCollection, z } from 'astro:content';
import { CONDITION_SLUGS } from '../lib/types';

const conditions = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.enum(CONDITION_SLUGS),
    name: z.string(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    shortDescription: z.string(),
    pathways: z.array(z.string()).min(1),
    dietaryPatterns: z.array(z.object({
      name: z.string(),
      evidence: z.string(),
    })).default([]),
    foodsToAvoid: z.array(z.object({
      name: z.string(),
      reason: z.string(),
    })).default([]),
  }),
});

const standalone = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { conditions, standalone };
```

- [ ] **Step 2: Create `src/content/standalone/science.md`**

```markdown
---
title: Science of Inflammation
description: How chronic inflammation drives disease, the markers used to measure it, and what the food evidence is built on.
---

## Acute vs. chronic inflammation

Inflammation is the body's response to injury or threat. **Acute inflammation** is a short-term, well-orchestrated process: immune cells rush to a site, contain damage, and then trigger resolution programs that return tissue to baseline. Without it, infections become catastrophic and wounds don't heal.

**Chronic inflammation** is what happens when the resolution step fails. Instead of a brief, well-controlled response, the body sits in a low-grade inflammatory state for months or years. The cellular machinery that should resolve inflammation is overwhelmed, immune cells stay activated, and pro-inflammatory cytokines circulate continuously. Over time, this background inflammation damages tissue and drives disease.

This is why inflammation is implicated in such a broad range of conditions — migraine, arthritis, cardiovascular disease, autoimmune conditions, depression, neurodegeneration, and many cancers all share chronic inflammation as a contributing mechanism, even when the surface-level symptoms look completely different.

## Why diet matters

Every meal triggers a temporary inflammatory response — even healthy meals. The question is whether the response resolves cleanly or accumulates. A diet built on refined carbohydrates, industrial seed oils, and ultra-processed foods drives larger and longer-lasting postprandial inflammation. A diet built on omega-3-rich fish, polyphenol-rich plants, and fermentable fiber actively dampens inflammation and provides the substrates for resolution.

Across decades of research, the dietary patterns most strongly associated with reduced chronic disease — Mediterranean, MIND, DASH, traditional Okinawan — are also the ones that most reduce systemic inflammatory markers. The connection between diet and inflammation isn't a fad; it's reproducible, mechanistically grounded, and consistent across observational, interventional, and trial-based evidence.

## Key inflammatory markers

These are the biomarkers most commonly used in research and (sometimes) in clinical practice to quantify inflammation:

### CRP (C-reactive protein)

A protein produced by the liver in response to IL-6 signaling. **High-sensitivity CRP (hs-CRP)** is the practical marker — values under 1 mg/L are low risk, 1-3 mg/L moderate, over 3 mg/L high. CRP is non-specific (rises in infection too), but persistently elevated CRP without a clear cause is a strong signal of chronic systemic inflammation.

### IL-6 (Interleukin-6)

A cytokine that acts as a master regulator of the inflammatory response. IL-6 is what drives the liver to produce CRP. Visceral fat tissue produces IL-6 directly, which is part of why central obesity drives chronic inflammation independent of total body weight.

### TNF-α (Tumor Necrosis Factor alpha)

A pro-inflammatory cytokine that recruits immune cells, activates them, and amplifies inflammation. TNF-α is the target of biologic drugs (Humira, Enbrel) used in rheumatoid arthritis, IBD, and psoriasis — illustrating how directly relevant chronic TNF-α elevation is to disease.

### NF-κB

A transcription factor that switches on hundreds of inflammatory genes when activated. Many anti-inflammatory food compounds — curcumin, resveratrol, EGCG, sulforaphane — work primarily by inhibiting NF-κB activation. It's the master switch upstream of much of the inflammatory cascade.

### COX-2

An enzyme that produces inflammatory prostaglandins from arachidonic acid. Blocked by NSAIDs (ibuprofen, naproxen). Several food compounds — oleocanthal in olive oil, gingerols in ginger, curcumin — also inhibit COX-2, providing milder but more sustained pharmacology.

## How citations were sourced

Every specific study citation on this site was verified by searching PubMed at the time of authoring. Where a food is broadly accepted as anti-inflammatory but the specific citation could not be verified to a satisfactory standard, the entry shows the mechanism and evidence tier without a citation rather than fabricating one. This site favors honest gaps over confident-looking but unreliable references.

## Disclaimer

This site is for educational purposes only. It does not constitute medical advice, diagnosis, or treatment. Consult your healthcare provider before making dietary changes — especially if you take medications (some foods interact with anticoagulants, immunosuppressants, and others), have an existing condition, are pregnant or nursing, or are managing a chronic illness. Individual response varies, and what helps in clinical trials may not help every individual.
```

- [ ] **Step 3: Verify build still works**

Run: `npm run build`
Expected: passes. The standalone collection has one entry; no page consumes it yet (that's Task 6.14).

- [ ] **Step 4: Commit**

```bash
git add src/content/config.ts src/content/standalone/science.md
git commit -m "feat: author science page content and register standalone collection"
```

### Task 6.14: Build the science page

**Files:**
- Modify: `src/pages/science.astro`

- [ ] **Step 1: Replace `src/pages/science.astro`**

```astro
---
import { getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import { buildBibliography } from '../lib/bibliography';

const science = await getEntry('standalone', 'science');
if (!science) throw new Error('science.md missing from content/standalone/');
const { Content } = await science.render();

const bibliography = buildBibliography();
---

<Base title="Science" description={science.data.description}>
  <article class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl md:text-5xl font-serif">{science.data.title}</h1>
    <p class="mt-4 text-lg text-slate-600 leading-relaxed">{science.data.description}</p>

    <div class="mt-8 prose prose-lg max-w-none">
      <Content />
    </div>

    <section class="mt-16">
      <h2 class="text-3xl font-serif">Bibliography</h2>
      <p class="mt-2 text-sm text-slate-500">
        Citations from the food database, grouped by condition. Sourced from PubMed at authoring time.
      </p>

      {bibliography.length === 0 ? (
        <p class="mt-6 text-slate-500">No citations yet.</p>
      ) : (
        <div class="mt-8 space-y-10">
          {bibliography.map((group) => (
            <div>
              <h3 class="text-xl font-serif text-navy-900">{group.conditionLabel}</h3>
              <ol class="mt-3 space-y-2 list-decimal list-inside text-sm text-slate-600">
                {group.entries.map(({ foodName, citation }) => (
                  <li>
                    <span class="text-navy-900 font-medium">{foodName}:</span>{' '}
                    {citation.url
                      ? <a href={citation.url} target="_blank" rel="noopener noreferrer" class="underline hover:text-sage-800">{citation.title}</a>
                      : <span>{citation.title}</span>}
                    <span class="text-slate-500"> — {citation.journal}, {citation.year}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>

    <section class="mt-16 rounded-xl bg-terra-400/10 border-l-4 border-terra-600 p-6">
      <h2 class="text-xl font-serif text-navy-900">Disclaimer</h2>
      <p class="mt-2 text-sm text-slate-600">
        Educational content only. Not medical advice. Consult your healthcare provider before changing your diet, especially if you take medications, have an existing condition, are pregnant or nursing, or are managing a chronic illness.
      </p>
    </section>
  </article>
</Base>
```

- [ ] **Step 2: Build and verify**

Run: `npm run build && npm run preview`
Open `http://localhost:4321/inflammafree/science`. Expected: prose body, bibliography grouped by condition with hyperlinked titles, disclaimer panel. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/science.astro
git commit -m "feat: build science page with auto-generated bibliography"
```

### Task 6.15: Author and build the meal plan

**Files:**
- Create: `src/content/standalone/meal-plan.md`
- Modify: `src/pages/meal-plan.astro`

- [ ] **Step 1: Update content collection schema for meal-plan-style entries**

Modify `src/content/config.ts` to add a meal-plan schema:

```ts
import { defineCollection, z } from 'astro:content';
import { CONDITION_SLUGS } from '../lib/types';

const conditions = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.enum(CONDITION_SLUGS),
    name: z.string(),
    featured: z.boolean().default(false),
    order: z.number().int(),
    shortDescription: z.string(),
    pathways: z.array(z.string()).min(1),
    dietaryPatterns: z.array(z.object({
      name: z.string(),
      evidence: z.string(),
    })).default([]),
    foodsToAvoid: z.array(z.object({
      name: z.string(),
      reason: z.string(),
    })).default([]),
  }),
});

const standalone = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const mealPlan = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    meals: z.array(z.object({
      slot: z.enum(['breakfast', 'snack-1', 'lunch', 'snack-2', 'dinner']),
      slotLabel: z.string(),
      name: z.string(),
      whyItHelps: z.string(),
      keyFoods: z.array(z.string()),
    })).length(5),
  }),
});

export const collections = { conditions, standalone, mealPlan };
```

- [ ] **Step 2: Create `src/content/mealPlan/example-day.md`**

```markdown
---
title: An Example Anti-Inflammatory Day
description: A realistic, balanced day of eating built on the foods in this database.
meals:
  - slot: breakfast
    slotLabel: Breakfast
    name: Berry-walnut overnight oats with cinnamon
    whyItHelps: Beta-glucan from oats lowers cholesterol and CRP; walnuts deliver ALA omega-3; berries supply anthocyanins; cinnamon helps blood sugar response.
    keyFoods:
      - oats
      - blueberries
      - walnuts
      - cinnamon
  - slot: snack-1
    slotLabel: Mid-morning snack
    name: Green tea + a handful of brazil nuts
    whyItHelps: EGCG in green tea targets multiple inflammatory pathways; selenium from brazil nuts supports antioxidant systems and thyroid function.
    keyFoods:
      - green-tea
      - brazil-nuts
  - slot: lunch
    slotLabel: Lunch
    name: Salmon, kale, and chickpea bowl with olive oil and lemon
    whyItHelps: Salmon delivers EPA/DHA omega-3s; kale brings vitamin K, lutein, and sulforaphane precursors; chickpeas add fiber and folate; olive oil provides oleocanthal — a meal that hits cardiovascular, neurological, and joint pathways simultaneously.
    keyFoods:
      - salmon
      - kale
      - chickpeas
      - extra-virgin-olive-oil
  - slot: snack-2
    slotLabel: Afternoon snack
    name: Greek yogurt with chia seeds and tart cherries
    whyItHelps: Live cultures support gut health; chia delivers ALA and fiber; tart cherries lower CRP and uric acid and may improve sleep through melatonin.
    keyFoods:
      - yogurt
      - chia-seeds
      - tart-cherries
  - slot: dinner
    slotLabel: Dinner
    name: Turmeric-ginger lentil stew with garlic, onions, and spinach
    whyItHelps: Turmeric (with black pepper for absorption) and ginger are foundational anti-inflammatory spices; lentils add fiber and folate; garlic and onions bring sulfur compounds and quercetin; spinach contributes magnesium that benefits migraine sufferers specifically.
    keyFoods:
      - turmeric
      - ginger
      - lentils
      - garlic
      - onions
      - spinach
---

This is one realistic day, not a prescription. The pattern matters more than any single meal.

A few principles to notice:

- **Variety across colors and categories.** A green vegetable, a deeply pigmented fruit, an omega-3 source, fermented food, and at least two anti-inflammatory spices show up in a single day.
- **Polyphenol density at every meal.** Berries, green tea, olive oil, herbs and spices, dark leafy greens, and nuts all contribute polyphenols that target NF-κB and oxidative stress.
- **Fiber throughout the day.** Oats, chickpeas, vegetables, and seeds support a healthy gut microbiome and steady blood sugar.
- **Pairings matter.** Turmeric with black pepper for absorption; fat-soluble compounds (carotenoids in spinach) with olive oil; magnesium-rich foods at dinner to support sleep.

Adjust portions to your appetite and goals. Hydrate consistently. If you eat earlier or later, that's fine — meal *timing* matters less than what's in the meals.
```

- [ ] **Step 3: Replace `src/pages/meal-plan.astro`**

```astro
---
import { getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import { findFoodById } from '../lib/foods';

const plan = await getEntry('mealPlan', 'example-day');
if (!plan) throw new Error('example-day meal plan missing');
const { Content } = await plan.render();
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---

<Base title="Meal Plan" description={plan.data.description}>
  <article class="mx-auto max-w-3xl px-6 py-16">
    <h1 class="text-4xl md:text-5xl font-serif">{plan.data.title}</h1>
    <p class="mt-4 text-lg text-slate-600 leading-relaxed">{plan.data.description}</p>

    <ol class="mt-12 space-y-6">
      {plan.data.meals.map((meal, i) => (
        <li class="rounded-xl bg-cream-100 p-6 relative">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sage-600 text-cream-50 text-sm font-medium">
              {i + 1}
            </span>
            <p class="text-xs uppercase tracking-wide text-sage-600">{meal.slotLabel}</p>
          </div>
          <h2 class="mt-3 font-serif text-2xl">{meal.name}</h2>
          <p class="mt-2 text-slate-600">{meal.whyItHelps}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            {meal.keyFoods.map((id) => {
              const food = findFoodById(id);
              return food ? (
                <a
                  href={`${base}/foods/${food.id}`}
                  class="inline-block rounded-full border border-sage-400 px-3 py-1 text-xs text-sage-800 hover:bg-sage-400/10 hover:no-underline"
                >
                  {food.name}
                </a>
              ) : (
                <span class="inline-block rounded-full bg-cream-50 px-3 py-1 text-xs text-slate-500">{id} (not in database)</span>
              );
            })}
          </div>
        </li>
      ))}
    </ol>

    <div class="mt-12 prose prose-lg max-w-none">
      <Content />
    </div>
  </article>
</Base>
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Open `http://localhost:4321/inflammafree/meal-plan`. Expected: timeline of 5 meal cards, each with slot label, name, why-it-helps, and clickable food chips that navigate to food detail pages. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/content/config.ts src/content/mealPlan/example-day.md src/pages/meal-plan.astro
git commit -m "feat: build meal plan page with single example day"
```

### Task 6.16: Build the real homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create a `ConditionPill` component for the condition navigator**

Create `src/components/ConditionPill.astro`:

```astro
---
import { CONDITION_LABELS } from '../lib/types';
import type { ConditionSlug } from '../lib/types';

interface Props {
  slug: ConditionSlug;
  shortDescription: string;
  featured?: boolean;
}

const { slug, shortDescription, featured = false } = Astro.props;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const baseClasses = 'block rounded-2xl p-5 transition-shadow shadow-sm hover:shadow-md no-underline hover:no-underline';
const featuredClasses = featured ? 'bg-sage-600 text-cream-50' : 'bg-cream-100 text-navy-900 border border-cream-100';
---

<a href={`${base}/conditions/${slug}`} class={`${baseClasses} ${featuredClasses}`}>
  <p class="font-serif text-lg">{CONDITION_LABELS[slug]}</p>
  <p class={`mt-1 text-xs ${featured ? 'text-cream-50/80' : 'text-slate-500'}`}>{shortDescription}</p>
</a>
```

- [ ] **Step 2: Replace `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import FoodCard from '../components/FoodCard.astro';
import ConditionPill from '../components/ConditionPill.astro';
import { allFoods } from '../lib/foods';
import { sortFoods } from '../lib/filter';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const featured = sortFoods(allFoods, 'score').slice(0, 6);
const conditions = (await getCollection('conditions')).sort((a, b) => a.data.order - b.data.order);
---

<Base title="InflammaFree">
  <!-- Hero -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-50 to-sage-400/10 -z-10"></div>
    <div class="mx-auto max-w-4xl px-6 py-24 text-center">
      <p class="text-sm uppercase tracking-wide text-sage-600">Anti-inflammatory food reference</p>
      <h1 class="mt-3 text-5xl md:text-6xl font-serif leading-tight">Food as medicine for chronic inflammation.</h1>
      <p class="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
        A research-backed guide covering migraines, arthritis, gut health, cardiovascular and other inflammatory conditions —
        with detailed mechanisms and evidence-graded coverage of {allFoods.length}+ foods.
      </p>
      <form action={`${base}/foods`} method="get" class="mt-10 max-w-xl mx-auto flex gap-2">
        <input
          type="search"
          name="q"
          placeholder="Search foods, compounds, conditions..."
          class="flex-1 rounded-full border border-cream-100 bg-cream-50 px-5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
        <button type="submit" class="rounded-full bg-sage-600 px-6 py-3 text-cream-50 hover:bg-sage-800 hover:no-underline">
          Search
        </button>
      </form>
    </div>
  </section>

  <!-- Stat strip -->
  <section class="mx-auto max-w-4xl px-6 -mt-6">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="rounded-xl bg-cream-100 p-5 text-center">
        <p class="font-serif text-3xl text-sage-600">{allFoods.length}+</p>
        <p class="mt-1 text-sm text-slate-500">Anti-inflammatory foods</p>
      </div>
      <div class="rounded-xl bg-cream-100 p-5 text-center">
        <p class="font-serif text-3xl text-sage-600">{conditions.length}</p>
        <p class="mt-1 text-sm text-slate-500">Conditions covered</p>
      </div>
      <div class="rounded-xl bg-cream-100 p-5 text-center">
        <p class="font-serif text-3xl text-sage-600">Research</p>
        <p class="mt-1 text-sm text-slate-500">Backed citations</p>
      </div>
    </div>
  </section>

  <!-- Condition navigator -->
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h2 class="text-3xl font-serif">Pick a condition</h2>
    <p class="mt-2 text-slate-500">Each page covers the inflammatory pathways involved, top foods, and what to avoid.</p>
    <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {conditions.map((c) => (
        <ConditionPill slug={c.data.slug} shortDescription={c.data.shortDescription} featured={c.data.featured} />
      ))}
    </div>
  </section>

  <!-- Featured foods -->
  <section class="mx-auto max-w-6xl px-6 pb-16">
    <div class="flex items-baseline justify-between mb-6">
      <h2 class="text-3xl font-serif">Highest-scoring foods</h2>
      <a href={`${base}/foods`} class="text-sm text-sage-800 hover:underline">Browse the full database →</a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {featured.map((food) => <FoodCard food={food} />)}
    </div>
  </section>

  <!-- Cross-links -->
  <section class="mx-auto max-w-6xl px-6 pb-24">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <a href={`${base}/meal-plan`} class="block rounded-xl bg-cream-100 p-6 hover:shadow-md transition-shadow no-underline hover:no-underline">
        <p class="text-sm uppercase tracking-wide text-sage-600">Practical</p>
        <p class="mt-1 font-serif text-2xl text-navy-900">See an example day →</p>
        <p class="mt-1 text-sm text-slate-500">A realistic anti-inflammatory day, meal by meal.</p>
      </a>
      <a href={`${base}/science`} class="block rounded-xl bg-cream-100 p-6 hover:shadow-md transition-shadow no-underline hover:no-underline">
        <p class="text-sm uppercase tracking-wide text-sage-600">Background</p>
        <p class="mt-1 font-serif text-2xl text-navy-900">How inflammation works →</p>
        <p class="mt-1 text-sm text-slate-500">CRP, IL-6, TNF-α explained — and how food acts on them.</p>
      </a>
    </div>
  </section>
</Base>
```

- [ ] **Step 3: Verify in dev**

Run: `npm run dev`
Open `http://localhost:4321/inflammafree/`. Expected: hero with search form, stat strip, condition navigator (migraine pill is sage-filled, others outlined), 6 featured food cards, two cross-link cards. Submit a search ("turmeric") — should land on `/foods?q=turmeric` with the term applied. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/components/ConditionPill.astro src/pages/index.astro
git commit -m "feat: build real homepage with hero, navigator, featured foods"
```

### Task 6.17: End-of-phase verification and push

- [ ] **Step 1: Run tests + build**

```bash
npm test && npm run build
```

Expected: 12 tests pass, build succeeds. The dist now contains all the per-food pages, all condition pages, science, meal-plan, homepage, 404.

- [ ] **Step 2: Click through preview**

Run: `npm run preview`
Verify on every page that nav, content, and links work. Test the food filter on `/foods` thoroughly — search, category chips, condition chips, score slider, evidence dropdown, view toggle, sort. Confirm URL params persist on reload.

- [ ] **Step 3: Push**

```bash
git push
```

- [ ] **Step 4: Verify live**

After GH Actions completes, test on `https://bcarvalho3012.github.io/inflammafree/`:
- Search a food from homepage — should arrive at `/foods?q=...` with results
- Click into a food → detail page shows compounds, citations (where present), tips
- Visit each condition page
- Open `/science` and confirm bibliography is populated with citations
- Open `/meal-plan` and confirm food chips are clickable

End of Phase 6. The site is content-complete.

---

## Phase 7: Polish

Goal: a deliberate quality pass. Decorative botanical accents, mobile sweep, accessibility audit, and final visual consistency check.

### Task 7.1: Add botanical decorative accents

**Files:**
- Create: `src/components/decorative/Leaf.astro`
- Modify: `src/pages/index.astro` (add an accent to hero)
- Modify: `src/pages/science.astro` (add a section divider accent)

- [ ] **Step 1: Create `src/components/decorative/Leaf.astro`**

```astro
---
interface Props {
  className?: string;
}
const { className = '' } = Astro.props;
---

<svg class={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path
    d="M32 4C18 16 8 28 8 42c0 12 10 18 24 18s24-6 24-18C56 28 46 16 32 4Z"
    stroke="currentColor"
    stroke-width="1.2"
    stroke-linecap="round"
  />
  <path
    d="M32 8v50M20 22c4 4 8 8 12 12M44 22c-4 4-8 8-12 12M16 36c5 3 11 6 16 8M48 36c-5 3-11 6-16 8"
    stroke="currentColor"
    stroke-width="1"
    stroke-linecap="round"
  />
</svg>
```

- [ ] **Step 2: Add a leaf accent to the homepage hero**

In `src/pages/index.astro`, add the import and place a decorative leaf element inside the hero section. Edit the hero section by adding the import and the absolute-positioned leaf:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import FoodCard from '../components/FoodCard.astro';
import ConditionPill from '../components/ConditionPill.astro';
import Leaf from '../components/decorative/Leaf.astro';
import { allFoods } from '../lib/foods';
import { sortFoods } from '../lib/filter';

// ... rest unchanged
---

<Base title="InflammaFree">
  <!-- Hero -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-50 to-sage-400/10 -z-10"></div>
    <Leaf className="hidden md:block absolute right-8 top-12 w-24 text-sage-400/30 -z-10" />
    <Leaf className="hidden md:block absolute left-12 bottom-8 w-16 text-sage-400/20 -z-10 rotate-45" />
    <div class="mx-auto max-w-4xl px-6 py-24 text-center">
      <!-- ... rest of hero unchanged ... -->
    </div>
  </section>
  <!-- ... rest of page unchanged ... -->
</Base>
```

(Apply only the import and the two `<Leaf />` placements. Leave everything else from the previous task in place.)

- [ ] **Step 3: Add a leaf divider to the science page above the bibliography**

In `src/pages/science.astro`, between the prose `<Content />` and the bibliography section, add:

```astro
<div class="mt-16 flex justify-center">
  <Leaf className="w-12 text-sage-400" />
</div>
```

And add the import at the top:

```astro
import Leaf from '../components/decorative/Leaf.astro';
```

- [ ] **Step 4: Verify visually**

Run: `npm run dev`
Open homepage and `/science`. The leaves should be subtle — visible but not loud. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/components/decorative/Leaf.astro src/pages/index.astro src/pages/science.astro
git commit -m "feat: add subtle botanical decorative accents to hero and science divider"
```

### Task 7.2: Mobile sweep

This task is a manual checklist — no code change required unless issues are found. Run the dev server (`npm run dev`) and keep it open.

- [ ] **Step 1: Use browser dev tools to switch to mobile viewport (375×667 — iPhone SE size)**

For each page, verify:

- [ ] Homepage: hero text doesn't overflow; search form stays usable; condition pills wrap into 1 column or 2; featured food cards stack
- [ ] /foods: filter bar is usable (chips wrap, sliders fit); food cards stack to 1 column; list view is dense and readable
- [ ] /foods/turmeric (or any food): hero, compounds, conditions, tips all readable; no horizontal scroll
- [ ] /conditions/migraine (or any condition): hero, prose, top-foods grid (1 col), foods-to-avoid panel
- [ ] /meal-plan: timeline cards stack; food chips wrap properly
- [ ] /science: prose readable; bibliography lists wrap; disclaimer panel readable
- [ ] /404: links stack vertically and are tappable
- [ ] Header hamburger: opens disclosure menu, links work, menu closes after navigating
- [ ] Footer: 3-column grid collapses to 1 column

- [ ] **Step 2: Fix any issues found**

If any layout breaks at 375px width, edit the relevant page/component, retest, and commit each fix:

```bash
git add <file>
git commit -m "fix: <specific mobile issue>"
```

If no issues, no commit needed — proceed to next task.

### Task 7.3: Accessibility audit

This is a manual checklist task with possible fixes.

- [ ] **Step 1: Keyboard navigation**

Open the site in a browser. Press Tab repeatedly from the URL bar. Verify:
- Focus visibly moves through every interactive element (link, button, input)
- The focus ring is clearly visible (sage-400 ring should appear)
- You can navigate to every nav link, search input, food card, filter chip
- Enter activates links/buttons; Space activates buttons

- [ ] **Step 2: Screen reader smoke test (optional but valuable)**

Use VoiceOver (Mac), NVDA (Windows free), or browser screen-reader extension. On the homepage, verify the page reads in a sensible order (h1 → hero text → stat strip → condition navigator → featured foods). On `/foods`, confirm the filter result count announces when filters change (the `aria-live="polite"` region in `ResultsHeader` handles this).

- [ ] **Step 3: Color contrast**

Use the browser dev tools color contrast checker (Chrome: right-click → Inspect → click any text element → Contrast ratio in styles panel) on:
- Body text on cream-50 background → must hit 4.5:1
- Slate-500 captions on cream-50 → check; if below 4.5:1 either accept (it's used only for non-essential supplementary text) or upgrade to `slate-600`
- White text on sage-600 buttons → must hit 4.5:1
- Text on terra-400/10 panels → check

- [ ] **Step 4: Image and SVG alt text**

Verify all decorative SVGs have `aria-hidden="true"` (already set in Leaf component and Header hamburger). Verify the hamburger button has `aria-label="Toggle navigation"` (already set in Header).

- [ ] **Step 5: Apply any fixes found**

Common fixes:
- Bump muted text from `slate-500` to `slate-600` if contrast fails
- Add `aria-label` to any interactive element with only an icon
- Ensure all `<a>` and `<button>` have visible text or a label

Commit each fix with descriptive messages:

```bash
git add <file>
git commit -m "fix(a11y): improve contrast on muted captions"
```

### Task 7.4: Visual consistency final pass

- [ ] **Step 1: Spot-check spacing rhythm**

Walk through every page. Section padding should be `py-16 md:py-24`; card padding `p-6` (some `p-5`). Heading sizes should match the type scale established in Phase 1. If anything looks off rhythm, adjust.

- [ ] **Step 2: Verify the foods-to-avoid panel is consistent**

It appears on every condition page and on the food detail page (cautions tip). Both should use the `bg-terra-400/10` + `border-l-4 border-terra-600` treatment.

- [ ] **Step 3: Verify hover states**

Hover any card, button, link, filter chip. Each should have the right hover treatment (shadow lift, color shift, or background tint per the visual spec).

- [ ] **Step 4: Commit any consistency fixes**

```bash
git add <file>
git commit -m "polish: <specific consistency fix>"
```

### Task 7.5: Lighthouse audit

- [ ] **Step 1: Build and preview**

```bash
npm run build && npm run preview
```

- [ ] **Step 2: Run Lighthouse on the homepage and `/foods`**

Open Chrome DevTools → Lighthouse tab → check Performance, Accessibility, Best Practices, SEO → Mobile profile → Generate.

Target scores:
- Performance: ≥ 90 (likely 95+ given static rendering)
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90

If any score drops below target, the report will list specific issues. Fix and re-run.

Common fixable issues:
- Missing `lang` attribute on `<html>` → already set in Base.astro
- Missing meta description → already set
- Buttons without discernible text → check FilterBar
- Color contrast failures → addressed in Task 7.3

- [ ] **Step 3: Commit any Lighthouse fixes**

```bash
git add <file>
git commit -m "polish: address Lighthouse <audit> finding"
```

### Task 7.6: Final deploy and verify

- [ ] **Step 1: Run the full check**

```bash
npm test && npm run build
```

Expected: tests pass, build succeeds.

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Final live verification**

After GH Actions finishes (≈1-3 min), visit `https://bcarvalho3012.github.io/inflammafree/` from both desktop and a phone. Walk through every section. The site is now done.

End of Phase 7. The site is polished, tested, deployed.

---

## Done

You've now built and shipped InflammaFree end-to-end. Maintenance from here is content edits — add a food entry to `foods.json`, edit a condition's markdown, push. The deploy pipeline handles the rest.

If you change your mind about cut features (food diary, multiple meal plans, dark mode), the data layer is decoupled enough that adding them later won't require restructuring.

### Deferred polish (intentionally not implemented)

These are spec items that can be added later without disrupting anything:

- **Scroll-reveal fade-up animations** on cards/sections — would use IntersectionObserver. Skipped as low-value polish; the global stylesheet already honors `prefers-reduced-motion` so any future animation will respect it.
- **Filter result transition** (opacity-only fade-in on filter changes) — same rationale as above.
- **Custom domain** — add a `CNAME` file at the repo root and configure DNS. Astro's `base` would change accordingly.
- **Print stylesheet** for a paper-friendly food list view.
- **Fuse.js fuzzy search** — only worth it if the food count grows past ~150 and substring search starts feeling sparse.

