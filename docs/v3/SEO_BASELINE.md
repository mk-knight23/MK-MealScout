# MK-MealScout — SEO Baseline (V3 Phase 0)

**Date**: 2026-07-23. All production checks against https://17-web-culinary-discovery.vercel.app (live curl, raw HTML).

## What is live and correct

| Item | Status | Evidence |
|---|---|---|
| Title | OK | `MK MealScout — Ingredient-Based Recipe & Meal Planner` (55 chars) |
| Meta description | Present but **overclaims** | "Filter by cuisine, diet, and time. Build shopping lists and plan weekly meals." — diet/time filters and planner do not exist (see BROKEN_FEATURE_INVENTORY B5) |
| Canonical | OK | `https://17-web-culinary-discovery.vercel.app/` |
| robots.txt | OK | 200; `Allow: /` + sitemap reference |
| sitemap.xml | OK but thin | 200; **one URL only** (`/`), lastmod 2026-07-22 |
| JSON-LD | OK | `WebApplication`, price 0, author/creator "Kazi Musharraf" + mkazi.live + GitHub sameAs |
| OG tags | Partial | og:type/title/description/url/site_name present. **No `og:image`** |
| Twitter card | Broken pairing | `twitter:card = summary_large_image` **without any `twitter:image`** — large-image card with no image renders poorly/falls back |
| Robots meta | OK | `index, follow` |
| lang / viewport / charset | OK | `lang="en"` |
| Favicon | Weak | Default Vite `vite.svg` — not brand |
| Manifest | Present | Emoji-SVG icon only; no raster icons |

## Problems, ranked

1. **No og:image / twitter:image** — every share on any platform renders imageless. Single highest-impact SEO/social fix. (Also flagged in the earlier `SEO_AEO_ANALYTICS_REPORT.md`.)
2. **Meta description promises features that do not exist** (diet/time filters, weekly meal planning). Truth-in-metadata fix; also a CTR/bounce risk.
3. **Deep routes 404** (B1) — today there is only one indexable URL, so impact is latent; the moment V3 adds recipe/planner routes, crawlability depends on fixing the Vercel rewrite. Client-rendered SPA additionally means an empty `<div id="app">` for crawlers on every future route — V3 should consider prerendering or per-route meta at minimum.
4. **Sitemap has one URL** and is hand-maintained. V3 with routes needs generated sitemap entries (recipe detail pages could be a large organic surface: TheMealDB has ~300 meals — a `/recipe/:id` page per meal with JSON-LD `Recipe` schema is the obvious V3 SEO play, **but only with honest data**: no fabricated cook times/nutrition, since the API provides none).
5. **Keywords meta tag** (`index.html:10`) — obsolete, ignored by engines; harmless noise.
6. **Vercel default domain** (`17-web-culinary-discovery.vercel.app`) — no custom domain; brand equity and E-E-A-T accrue to a numbered subdomain. Canonical/OG/sitemap/robots all hardcode it in 6+ places (`index.html`, `robots.txt`, `sitemap.xml`) — a domain move requires a coordinated sweep.
7. **Render-blocking Google Fonts** (2 families, 6 weights) — see PERFORMANCE_BASELINE; LCP affects rankings.
8. **No structured data for content** — only `WebApplication`. No `Recipe`, no `FAQPage`, no `BreadcrumbList`. All possible in V3 with real routes.

## Analytics baseline

- **Nothing fires today** — verified: no GTM/GA IDs in shipped HTML/JS; the injection script requires a build-time env var matching `^GTM-[A-Z0-9]+$` / `^G-[A-Z0-9]+$` and explicitly rejects the literal `%VITE_*%` placeholder. `docs/ANALYTICS.md` documents this honestly.
- Vercel Web Analytics/Speed Insights: dashboard-controlled, not observable from the HTML (no injected scripts seen in prod response).
- Consequence: **zero visibility** into current traffic/behavior. V3 baseline metrics (before/after) require enabling at least Vercel Web Analytics before the V3 launch to have a comparison window.

## V3 SEO checklist (carried forward)

- [ ] Fix SPA rewrite (prerequisite for any route indexing)
- [ ] Add og:image + twitter:image (1200×630 branded card)
- [ ] Rewrite meta description to match real features
- [ ] Real favicon + PWA raster icons
- [ ] Per-route titles/meta + `Recipe` JSON-LD on recipe pages (honest fields only)
- [ ] Generated sitemap with recipe routes
- [ ] Decide custom domain before building backlinks
- [ ] Enable Vercel Web Analytics now to capture the pre-V3 baseline
