# Test Report

**Date:** 2026-10-10 · **Branch:** `ccr-c47bdbec-m0nd38` · **Base commit:** `abb7f2f` (work committed on top of it — see `git log`)
**Environment:** Linux container, Node 22.22, Astro 7.3.8, Chromium (Playwright 1.52 driver) at `/opt/pw-browsers/chromium`, Lighthouse 13.5.0, axe-core 4.10.2.

Run everything: `cd review-platform && npm test` → **last result: all green (10 unit + 12 build-output + 141 browser checks, typecheck 0 errors).**

| Requirement | Result | How |
|---|---|---|
| Config validation | **VERIFIED** | `npm run validate` |
| Build | **VERIFIED** | `astro build` (real data) and fixture build (5 businesses / 7 branches) |
| TypeScript | **VERIFIED** | `astro check`: 0 errors, 0 warnings (12 files; initial 18 errors were missing `@types/node` + a `never` typing issue — **FIXED**) |
| Linting | **PARTIAL** | No ESLint configured; strict `astro check` + validators are the static gates. Not claimed as linting. |
| Dependency security | **FIXED / VERIFIED** | `npm audit`: 3 vulns on Astro 5 → upgraded to 7.3.8 → 0 |
| Google URL validation | **VERIFIED** | 10 unit tests / 25+ malicious URL vectors (`tests/unit.test.ts`) |
| Route tests | **VERIFIED** | one page per branch; unknown id → no file (404.html); `/` neutral |
| Branch isolation | **VERIFIED** | Each page has exactly one `href`, its own; no other branch's URL/name/label appears; per-branch welcome override doesn't leak |
| Disabled / withdrawn / draft | **VERIFIED** | Inert notice; no button, no URL, no business name (HTML test + screenshot) |
| Missing logo | **VERIFIED / FIXED** | Falls back to icon in a real browser (a race bug was found and fixed here) |
| Demo disclaimer | **VERIFIED** | Present for demo; absent only for `approved` |
| No stars / no NFC branding | **VERIFIED** | Pattern scan over all generated pages (both datasets) |
| RTL layout | **VERIFIED** | `dir=rtl` computed at 7 viewports |
| Horizontal overflow | **VERIFIED** | 0 overflow at 320/360/375/393/768/884 px + landscape 780×360 (3 pages × 7) |
| Accessibility | **VERIFIED** | axe-core WCAG 2 A/AA, 2.1 AA + best-practice: 0 violations on 6 page states; Lighthouse a11y 100; keyboard Tab focuses the button with a ≥2 px ring |
| Interaction | **VERIFIED** | busy state, status text, double-tap blocked, exactly one navigation to the exact URL, retry message after 6 s, offline message |
| Reduced motion | **VERIFIED** | emulated |
| CSP | **VERIFIED locally** | Browser tests ran under the shipped CSP; no violations |
| Lighthouse (local prod build, localhost) | **VERIFIED** | Mobile preset: Perf **100**, A11y **100**, BP **100**, SEO **45**; FCP 0.8 s, LCP 0.9 s, TBT 0, CLS 0, 8 KiB. Desktop: 100/100/100/45, FCP 0.3 s |
| SEO score | **Accepted** | 45 is *caused by design*: `noindex`, `Disallow: /`, no meta description. Pages must not be indexed; target of 90+ is not applicable to NFC pages. Lighthouse also lists "render-blocking" for the single 3.5 KB stylesheet (kept external for strict CSP). |
| Screenshots | **VERIFIED** | `docs/screenshots/` (26 PNGs) |
| Admin CLI | **VERIFIED (manual)** | add business/branch, activate, disable, reject `https://evil.example` and low-contrast colour with nothing written; data restored afterwards. Not covered by automated tests. |
| Real Android/iOS device rendering, Samsung Internet, Safari | **BLOCKED** | No physical devices/browsers (only Chromium emulation) |
| Physical NFC tap test | **BLOCKED** | No NFC hardware. **Not claimed.** |
| Deployment to Cloudflare Pages | **BLOCKED** | No authorised account/domain; not attempted. Instructions in `DEPLOYMENT_GUIDE_AR.md` |
| Production headers observed | **BLOCKED** | Requires deployment |
| Demo Place ID is really جباتي راشد and opens a working review form | **BLOCKED / UNVERIFIED** | Needs a human to open the link in a browser while logged in to Google. Stored with `destinationVerified:false`; page is labelled demo. |

## Caveats
* Browser tests use Chromium with a local static server mimicking Cloudflare's pretty-URL + `_headers` behaviour; this is a close but not identical stand-in.
* Lighthouse numbers are from a single run each, on localhost with simulated throttling.
* Fixture Place IDs (`ChIJ_AAAA…`) are fake and exist only in `tests/fixtures/`.
