# MK-MealScout — Security Baseline (V3 Phase 0)

**Date**: 2026-07-23. No secret values appear in this report.

## Threat surface summary

Static SPA, no backend, no auth, no user accounts, no server-side data. Attack surface = client bundle + third-party API (TheMealDB) + localStorage + backup-file import. Risk posture is inherently low today; it changes materially the moment V3 adds an AI gateway or any serverless function.

## Verified clean

| Check | Result | Evidence |
|---|---|---|
| Secrets in source | **Clean** | No API keys/tokens in `src/`, configs, or docs. `.env.example` contains names only, AI keys commented out |
| Secrets in shipped bundle | **Clean** | grep of deployed `index-B9lsdcxx.js` + HTML: no `sk-`, `AIza`, GTM/GA IDs; only URLs found are themealdb.com, mkazi.live, github.com, vuejs.org |
| localhost/staging URLs in prod | **Clean** | zero `localhost` occurrences in the shipped bundle |
| Hardcoded analytics IDs | **Clean** | GTM/GA4 injection is env-gated with regex validation and placeholder rejection (`index.html:64-87`) |
| XSS via API data | **Low risk** | All TheMealDB fields render through Vue text interpolation (`{{ }}`); no `v-html` anywhere in `src/` (grep-verified). `strYoutube`/`strSource` are used as `href` — see risk R2 |
| Backup import | **Good** | `utils/backup.ts` + `utils/pantry.ts`/`grocery.ts` schema-validate every entry, drop invalid items, never throw on corrupt JSON; app/version marker required. 31 tests cover parsing/corruption paths |
| Dependency install scripts | Controlled | npm allowScripts blocked esbuild/fsevents postinstall (policy working as intended) |

## Live security headers (production, curl-verified)

`x-content-type-options: nosniff`, `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`, `strict-transport-security: max-age=63072000; includeSubDomains; preload`. Immutable caching on hashed assets.

## Findings

### R1 — No Content-Security-Policy — MEDIUM
No CSP header or meta. Current inline analytics bootstrap script and Google Fonts would need `script-src`/`style-src`/`font-src` allowances. Cheap insurance against any future injection; add in V3 alongside the AI gateway work (which will also need `connect-src`).

### R2 — External URLs from API rendered as hyperlinks — LOW
`RecipeDetailModal.vue:49-50` binds `strSource`/`strYoutube` from TheMealDB directly to `href` (`target="_blank" rel="noopener noreferrer"` — good). A malicious/compromised upstream record could serve a `javascript:` URL. Mitigation for V3: allowlist `http(s):` schemes before binding.

### R3 — npm audit — dev-chain only, but numerically loud
`npm audit` (2026-07-23): **12 vulnerabilities (1 moderate, 10 high, 1 critical)** — every one in the dev toolchain (vitest UI [critical], vite, rollup, happy-dom, ws, lodash, minimatch, picomatch, js-cookie, brace-expansion, editorconfig, postcss). **Zero runtime-dependency vulnerabilities** — the shipped bundle's deps are vue/pinia/lucide only. Not exploitable in production; still worth a toolchain bump in V3 to keep CI audits green. `npm audit --omit=dev`: 1 moderate (postcss, build-time only).

### R4 — Silent global error handler — MEDIUM (security-adjacent)
`src/main.ts:9-11` discards all Vue errors. Security incidents that manifest as thrown errors (e.g., corrupted state, failed sanitization) become invisible. Fix in V3.

### R5 — Rate-limit exposure on TheMealDB — LOW
`CookMatches.vue` issues up to 8 parallel requests per click with no client throttle/cache/backoff. Free-tier abuse could get the shared test key throttled for all users. V3: cache `filter.php?i=` responses (they change rarely) and debounce.

### R6 — localStorage privacy — INFO
All user data (pantry, grocery, favorites, stats) is plain localStorage on a shared-device basis — no encryption, no clear-data control beyond browser tools. `docs/PRIVACY.md` honestly documents the model. V3's IndexedDB move should add an in-app "delete all my data" action.

## V3 security pre-conditions (AI gateway)

1. **No provider keys in the client — ever.** All AI calls through a serverless function; keys in Vercel env vars. The existing `.env.example` placeholders correctly omit the `VITE_` prefix (would be bundled if prefixed) — keep it that way.
2. Gateway must add: rate limiting per IP, input length caps, output sanitization before render, spend caps/alerts, and no logging of user pantry contents alongside identifiers.
3. Add CSP with `connect-src` pinned to the gateway + themealdb.com.
4. Prompt-injection posture: recipe/API text must never be treated as instructions by any V3 AI feature.
