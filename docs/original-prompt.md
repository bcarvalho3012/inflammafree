# Claude Code Prompt — Anti-Inflammatory Foods Website

> Copy everything below the line and paste it into Claude Code as your prompt.

---

## Project Overview

Build a comprehensive, modern single-page web application called **"InflammaFree"** (or suggest a better name) — a research-backed guide to anti-inflammatory foods, designed primarily for people suffering from chronic migraines but also covering other inflammatory conditions (arthritis, IBS/gut health, autoimmune conditions, cardiovascular inflammation, skin conditions like eczema/psoriasis, and general chronic pain).

The site should feel trustworthy, calming, and medically credible — not like a fad diet blog. Think: clean health-tech aesthetic, not wellness influencer.

---

## Phase 1: Research (Do This First)

Before writing any code, conduct thorough web research to compile the most complete and accurate dataset possible. This is the foundation of the entire project — take your time here.

### Food Database Research

Search for and compile a comprehensive list of anti-inflammatory foods. For EACH food, research and document:

1. **Basic info**: Food name, category (fruit, vegetable, protein, spice, grain, fat/oil, beverage, fermented, nut/seed, legume), a brief description
2. **Active compounds**: The specific anti-inflammatory compounds (e.g., curcumin in turmeric, oleocanthal in olive oil, anthocyanins in berries, sulforaphane in broccoli, omega-3s in salmon)
3. **Mechanism of action**: How the compound reduces inflammation (e.g., inhibits COX-2, reduces TNF-α, blocks NF-κB pathway, reduces CRP levels)
4. **Conditions it helps**: Map each food to the specific conditions it has evidence for — migraine, arthritis, gut health/IBS, cardiovascular, autoimmune, skin/dermatological, general chronic pain, neurological/cognitive
5. **Strength of evidence**: Rate as "strong" (multiple RCTs or large meta-analyses), "moderate" (observational studies, small trials), or "emerging" (preliminary/mechanistic studies, case reports)
6. **Key research citations**: At minimum, the name of a relevant study or review, the journal, and the year. Aim for 1-3 citations per food.
7. **Practical tips**: Optimal preparation method, recommended daily amount where known, bioavailability tips (e.g., "pair turmeric with black pepper to increase curcumin absorption by 2000%"), and any cautions or interactions
8. **Anti-inflammatory score**: Create a 1-10 rating based on breadth of evidence, potency of compounds, and number of conditions supported

### Condition Research

For each condition category (migraines, arthritis, gut health, cardiovascular, autoimmune, skin, chronic pain, neurological), research and write:

1. A brief explanation of the role inflammation plays in that condition
2. The specific inflammatory pathways involved (e.g., trigeminovascular activation in migraines, TNF-α in rheumatoid arthritis)
3. The top 10-15 most evidence-backed foods for that condition specifically
4. Any dietary patterns with evidence (Mediterranean diet, DASH, LIFE diet, low omega-6/high omega-3, etc.)
5. Foods or substances that WORSEN inflammation for that condition (triggers to avoid)

### Sample Meal Plan Research

Research and create 3 sample daily meal plans:
1. **Migraine-Focused Plan** — optimized for migraine prevention, avoiding common triggers
2. **General Anti-Inflammatory Plan** — balanced across all conditions
3. **Gut Health Recovery Plan** — focused on gut barrier repair and microbiome support

Each plan should include breakfast, lunch, dinner, and 2 snacks with brief descriptions of why each meal helps.

---

## Phase 2: Build the Website

Build this as a React application (single JSX file or a small project, your call based on complexity). Use Tailwind CSS for styling. The site should be fully responsive and work beautifully on mobile.

### Design Direction

- **Aesthetic**: Clean, calming, medically credible. Think muted earth tones — sage greens, warm terra cotta, soft cream backgrounds, with a deep navy or charcoal for text. NOT clinical/sterile, NOT wellness-influencer pink/gold.
- **Typography**: Use a refined serif for headings (something like Playfair Display, Lora, or Merriweather) paired with a clean sans-serif for body text (like Source Sans Pro, Nunito, or DM Sans). Import from Google Fonts.
- **Visual touches**: Subtle botanical line art or leaf motifs as decorative elements. Soft gradients. Generous whitespace. Cards with gentle shadows.
- **Tone**: Warm but authoritative. "Your doctor's smartest friend who also cooks."

### Site Structure & Features

#### 1. Hero Section
- Compelling headline about food as medicine for inflammation
- Brief tagline mentioning migraines and chronic conditions
- A prominent search bar that filters the entire food database
- Quick-stat callout cards (e.g., "150+ Anti-Inflammatory Foods", "8 Conditions Covered", "Research-Backed")

#### 2. Condition Navigator
- Horizontal scrollable pills/tabs for each condition: Migraines (featured/highlighted), Arthritis, Gut Health, Cardiovascular, Autoimmune, Skin Health, Chronic Pain, Neurological
- When a condition is selected, show:
  - The condition overview (how inflammation drives it)
  - Top recommended foods for that condition (filterable cards)
  - Dietary patterns with evidence
  - Foods/triggers to AVOID (displayed in a distinct warning style)

#### 3. Food Database (The Core)
- Filterable, searchable grid/list of ALL anti-inflammatory foods
- **Filter options**: By category (fruits, vegetables, proteins, spices, etc.), by condition, by evidence strength, by anti-inflammatory score
- **Each food card shows**: Name, category badge, anti-inflammatory score (visual meter or badge), top conditions it helps (as small tags), and the primary active compound
- **Expanded food detail** (click/tap to expand or modal): Full description, all active compounds with mechanisms, complete list of conditions helped, evidence strength indicator, research citations, practical tips (preparation, dosage, bioavailability), and any cautions
- Include a toggle between grid view and list view

#### 4. Meal Plans Section
- Display the 3 sample meal plans in an attractive card layout
- Each meal plan shows its focus condition, all meals for the day, and brief explanations
- Visual timeline format (breakfast → snack → lunch → snack → dinner)

#### 5. Food Diary / Symptom Tracker (Simple V1)
- A local-storage-based daily log where users can:
  - Select date
  - Check off anti-inflammatory foods they ate that day from the database
  - Rate their symptom severity (1-10 scale) for any conditions they're tracking
  - Add brief notes
- Show a simple 7-day or 30-day view with a basic chart correlating foods eaten vs. symptom scores over time
- Include a "streak" counter for consecutive days of tracking
- Add a data export button (download as CSV)

#### 6. Science & Research Section
- A concise, well-written overview of the inflammation-disease connection
- Explanation of key inflammatory markers (CRP, IL-6, TNF-α, etc.) in plain language
- A bibliography/references section listing all cited studies, organized by condition
- Disclaimer: "This site is for educational purposes only. Consult your healthcare provider before making dietary changes."

#### 7. Footer
- Medical disclaimer
- Brief "About" blurb
- Links to major references (National Headache Foundation, American Migraine Foundation, etc.)

### Technical Requirements

- All data should be embedded in the app (JSON object or similar) — no external API dependencies for the food database
- Use localStorage for the food diary/symptom tracker (no backend needed for V1)
- Smooth scroll navigation between sections
- All filtering and search should be instant (client-side)
- Responsive: mobile-first design, works great on phones, tablets, and desktop
- Accessibility: proper heading hierarchy, alt text concepts, sufficient color contrast, keyboard navigable
- Performance: lazy load sections if needed, keep initial load fast
- Include smooth animations on scroll reveal and filter transitions

### Data Architecture Suggestion

Structure the food database as a JSON array of objects like:

```json
{
  "id": "turmeric",
  "name": "Turmeric",
  "category": "spice",
  "description": "...",
  "antiInflammatoryScore": 9,
  "activeCompounds": [
    {
      "name": "Curcumin",
      "mechanism": "Inhibits NF-κB pathway, reduces COX-2 expression, lowers TNF-α and IL-6 levels"
    }
  ],
  "conditions": ["migraine", "arthritis", "gut", "cardiovascular", "autoimmune", "skin", "pain", "neurological"],
  "evidenceStrength": "strong",
  "citations": [
    {
      "title": "Efficacy of curcumin in management of migraine...",
      "journal": "Phytotherapy Research",
      "year": 2020
    }
  ],
  "tips": {
    "preparation": "Use ground or fresh root in cooking",
    "dosage": "500-1000mg curcumin equivalent daily",
    "bioavailability": "Pair with black pepper (piperine) to increase absorption by up to 2000%",
    "cautions": "May interact with blood thinners"
  }
}
```

---

## Important Reminders

- **Accuracy matters**: This is health information. Do not fabricate study names, mechanisms, or claims. If you're unsure about a specific citation, note it as "evidence suggests" rather than inventing a fake study.
- **Completeness matters**: Aim for at least 80-100 individual foods in the database. Cover all major categories. Don't just list 20 obvious ones.
- **Migraine emphasis**: Migraines should be the featured/default condition throughout the site. Give it the most detailed coverage, the most specific food recommendations, and the most thorough trigger-avoidance list.
- **Medical disclaimer**: Include appropriate disclaimers that this is educational content, not medical advice.
- **No placeholder content**: Every section should have real, researched content. No "Lorem ipsum" or "Content coming soon."

---

## Stretch Goals (If Time Permits)

- Dark mode toggle
- Print-friendly food list view
- "Build Your Plate" interactive tool where users drag foods onto a plate visual
- Sharable food profile cards (generate a card image for social sharing)
- Seasonal eating guide (which anti-inflammatory foods are in season by month)
