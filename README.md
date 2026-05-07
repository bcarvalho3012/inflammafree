# InflammaFree

A static reference site for anti-inflammatory foods. Personal day-to-day reference covering ~80-100 foods across 8 inflammatory condition categories.

**Live:** https://bcarvalho3012.github.io/inflammafree/

## Stack

Astro + React (one island) + Tailwind CSS v4 + TypeScript. Static-rendered, deployed to GitHub Pages via GitHub Actions.

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
- Meal plan: `src/content/mealPlan/example-day.md`.
- Science / inflammation primer: `src/content/standalone/science.md`.

Push to `main` and the deploy workflow runs automatically.

## Disclaimer

Educational use only. Not medical advice. Consult a healthcare provider before changing your diet, especially with existing conditions or medications.
