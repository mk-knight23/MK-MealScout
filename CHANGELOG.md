# Changelog - MK MealScout

All notable changes to this project will be documented in this file.

## [2.3.0] - 2026-07-22
- P0 upgrade pass: fixed brand spelling (Qazi → Kazi), removed stale deploy artifacts, replaced legacy Vercel builds config with modern SPA rewrites + security headers.
- Truthful docs: real README, docs/ARCHITECTURE.md, docs/ANALYTICS.md, docs/PRIVACY.md, updated SECURITY.md.
- Analytics: GTM + GA4 only inject at build time when a valid env var is set; no fake tracking.
- PWA manifest added or corrected; JSON-LD upgraded with creator + author URLs.
- Centralized TheMealDB client (src/utils/mealdb.ts) with 12s timeout, AbortController cancellation, typed MealDbError. Store now surfaces errorCode/errorMessage instead of silently swallowing.
- Added src/utils/scaling.ts with 23 unit tests: fractions, unicode fractions, ranges, volume/mass conversion.
- Removed axios in favor of native fetch; bundle down from 133KB to 100KB.

## [2.2.0] - 2026-07-19
- Redesigned with premium glassmorphism.
- Unified brand identification under Kazi Musharraf.
- Modernized project dependencies.
- Added SEO pages, analytics wrapper, and sitemaps.
