# MK-MealScout — Design Baseline (V3 Phase 0)

**Date**: 2026-07-23. Method: full source review of styles/components + prior wave-2 audit cross-check (`docs/release-reports/DESIGN_ACCESSIBILITY_AUDIT.md`). No new browser screenshots taken in this audit.

## Design system as it exists

| Token / element | Value | Source |
|---|---|---|
| Primary | `--color-culinary-primary: #b45309` (amber-700) | `src/style.css` `@theme` |
| Secondary | `--color-culinary-secondary: #c2410c` (orange-700) | same |
| Accent | `#10b981` (emerald) — barely used | same |
| Light bg | `#ece4f0` (`--culinary-bg`) — note: `index.html` body class says `bg-[#fffbf7]`, a **second, conflicting light background** | `style.css` vs `index.html:96` |
| Dark bg | `#0f0a1a` | style.css |
| Display font | Playfair Display (900 italic/regular) | Google Fonts |
| Body font | Inter 400-800 | Google Fonts |
| Shape language | Extremely rounded: `rounded-2xl` buttons, `rounded-[2rem]`/`[2.5rem]`/`[3rem]` cards/panels/modals | components |
| Effects | `.glass` glassmorphism, radial gradient blobs on body, shadow-tinted CTAs | style.css |
| Icons | lucide-vue-next, consistent sizing 14-24 | components |
| Theme system | dark / light / system with class-based Tailwind v4 `@custom-variant dark` (repaired in wave 2; persisted + OS-change listener) | `stores/settings.ts` |

Overall: a coherent, personality-heavy "editorial culinary" look (uppercase black-weight labels, tracking-widest, serif display headings). Not generic — worth preserving in V3.

## Accessibility state (post wave-2 fixes, code-verified)

Already fixed and shipped (aa740ca): CTA contrast 5.02:1, dark-mode class binding, favorites aria-label binding, CookMatches keyboard operability (role=button, Enter/Space, focus-visible), pantry autocomplete full combobox pattern (aria-activedescendant etc.), Settings dialog focus trap + restore, editable-target shortcut guard. This is genuinely above-average a11y for a portfolio SPA.

## Findings

### DES1 — `role="application"` on the root div — HIGH (a11y)
`App.vue:103` wraps the whole app in `role="application"`, which tells screen readers to disable normal document-browsing keys. This app is a document-style UI (headings, lists, articles) — the role actively harms SR navigation. Remove it (use landmarks already present: banner/main/contentinfo).

### DES2 — Two conflicting light-mode backgrounds — LOW
`index.html` body hardcodes `bg-[#fffbf7]` while the design system defines `--app-bg-light: #ece4f0` (lavender-tinted). First paint flashes one color, hydrated app shows another.

### DES3 — Footer looks interactive but is not — MEDIUM
Six `<li cursor-pointer hover:text-...>` items with no action (BROKEN_FEATURE_INVENTORY B6). Affordance without function is a design integrity defect; two items name non-existent features.

### DES4 — Native `confirm()` for stats reset — LOW
`SettingsPanel.vue:83` uses `window.confirm` — visually jarring against the glassmorphism system and unstylable. Low priority; replace with the existing dialog pattern in V3.

### DES5 — Serving scaler max 12 / baseline 4 is honest but unlabelled in grid — INFO
The 4-serving assumption is disclosed in the modal (good). No time/difficulty/nutrition shown anywhere — correctly resisting fabricated data. V3 must maintain this: TheMealDB provides no time/nutrition; any such badge must come from a real source or not exist.

### DES6 — Empty-state coverage is good, one gap — LOW
Discover/pantry/matches/grocery all have designed empty states. Gap: Discover has no dedicated **error** state distinct from "no recipes found" — API failure shows the empty-state card with the error message inline (`App.vue:387-407`), which reads as "no results" at a glance. Wave-2 audit had related notes; V3 should give network failure its own retry-focused state.

### DES7 — Brand string inconsistency — LOW
Footer credit: `Kazi Musharraf — Kazi Developer` (`App.vue:484`). Canonical brand per operator guidance is **"Kazi Musharraf"**; the "— Kazi Developer" suffix is off-brand. JSON-LD, README, manifest all correctly use "Kazi Musharraf" / "MK MealScout". Legacy "Culinara" name survives only in localStorage keys (invisible to users). No "Qazi"/"Musharof" misspellings remain anywhere (grep-verified — the P0 fix held).

### DES8 — Favicon/manifest icons — MEDIUM
Default Vite favicon; manifest icon is an inline emoji SVG. Installed-app and tab identity are unbranded. V3: proper icon set (SVG + 192/512 raster + maskable).

## V3 design guidance

1. Keep the editorial identity (Playfair + uppercase micro-labels + warm amber) — it is distinctive; V3 features (planner grid, AI panel) should extend these tokens, not introduce a new system.
2. Fix DES1 and DES3 immediately (cheap, high-integrity wins).
3. Self-host fonts (perf) without changing the typographic identity.
4. Planner UI will need a denser data grid than anything existing — design the week view against the existing token set before building.
5. All new "smart" surfaces (AI suggestions) must carry the same honesty pattern as the serving scaler: label approximations, never invent nutrition/time/cost.
