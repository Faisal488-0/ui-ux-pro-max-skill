# UX/UI Audit

## Skill used (verified)

| | |
|---|---|
| Skill | `ui-ux-pro-max` ("UI UX Pro Max") |
| Verified path | `.claude/skills/ui-ux-pro-max/SKILL.md` (+ `references/pro-rules.md`, `references/quick-reference.md`, `scripts/search.py`) |
| Found by | Directory inspection of `.claude/skills/` (also present: banner-design, brand, design, design-system, slides, ui-styling — not needed) |

### Commands actually executed (outputs read, not assumed)

```
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "review feedback landing page restaurant minimal arabic rtl mobile" --design-system -p "Review Landing" --variance 2 --motion 2 --density 2
python3 …/search.py "arabic rtl" --domain typography
python3 …/search.py "loading feedback disabled button touch target" --domain ux
python3 …/search.py "astro static" --stack astro
```
Also read `references/pro-rules.md` and applied its Pre-Delivery Checklist (below).

### How the skill's output was applied

| Skill output | Applied as |
|---|---|
| Pattern *Minimal Single Column* — single CTA, whitespace, no nav clutter | One column, one button, no nav/footer/banners |
| Dials variance 2 / motion 2 / density 2 | Centered layout; near-zero motion; spacious 24–48 px rhythm |
| UX rules: touch ≥44 px; loading feedback >300 ms; no frozen UI | Button 60 px tall; busy state + status text + 6 s retry |
| Pro-rules: stable press states, vector icons, no emoji, disabled-state clarity | SVG category glyph; press = colour/shadow only (no layout shift) |
| Stack rule "default to zero JS" (Astro) | HTML/CSS only; a 1 KB optional enhancement script |
| Reduced motion, 4.5:1 contrast, visible focus | Implemented and tested (axe + browser) |
| Typography: Noto Naskh/Sans Arabic via Google Fonts | **Deliberately not followed**: remote fonts add a render-blocking third-party request, privacy exposure and CSP holes. Used a local system Arabic stack (Noto Sans Arabic → SamsungOne → SF Arabic/Geeza Pro → Segoe/Tahoma) |
| Palette suggestion (navy/gold) | **Not followed**: product is multi-business; accent is per-business `themeColor`, contrast-validated ≥4.5:1 vs white |

## Defects found by the audit and fixed (FIXED = fixed and re-tested)

| # | Defect | How found | Status |
|---|---|---|---|
| 1 | Entrance fade started at `opacity:0` → Lighthouse `NO_FCP`; also delays real first paint | Lighthouse run | **FIXED** (animation removed; Perf 100) |
| 2 | Logo + fallback icon both visible (selector never matched) | Review of screenshots/markup | **FIXED** |
| 3 | Broken logo not replaced when image failed *before* the script attached its listener | Browser test (missing-logo case) | **FIXED** (`complete && naturalWidth===0` check) |
| 4 | Theme colours like yellow would give 1.35:1 button text | Admin CLI test | **FIXED** (validator rejects <4.5:1) |
| 5 | Screenshots taken mid-fade looked washed-out (test artefact) | Visual review | **FIXED** (resolved by #1) |

## Review against the brief

| Check | Result | Evidence |
|---|---|---|
| No rating stars anywhere | VERIFIED | Regex over every generated page (★☆⭐, "star", "rating", نجوم) — `tests/build.test.ts` |
| No "NFC SMART REVIEWS" header / NFC logo / NFC text | VERIFIED | Same test (`/NFC/i`, `SMART REVIEWS`) |
| Business name visible & prominent | VERIFIED | Largest type on the page (clamp 32–44 px, 800 weight, accent colour); screenshot |
| Button prominent, not ambiguous | VERIFIED | Full-width, 60 px, solid accent, shadow; only interactive element; focus-first on Tab |
| Layout order per spec | VERIFIED | Index-order test on generated HTML |
| Arabic copy exact | VERIFIED | String-equality test for all six texts |
| RTL, `lang=ar` | VERIFIED | `<html lang="ar" dir="rtl">`, computed `direction: rtl` at 7 viewports |
| No horizontal overflow | VERIFIED | 320, 360, 375, 393, 884, 768 px + landscape 780×360, 3 pages each |
| CTA visible without scrolling | VERIFIED | 320×568, 360×780, 375×667, 393×852, 768×1024, 884×1104 (landscape 360 px height intentionally scrolls) |
| Touch target ≥48 px | VERIFIED | measured 60 px |
| Contrast | VERIFIED | axe-core `wcag2a/aa/21aa` + best-practice: 0 violations on 6 page states; text-2 `#4A5560` = 7.2:1 on bg |
| Reduced motion | VERIFIED | `prefers-reduced-motion` emulated: animation none, transition 0 |
| Doesn't imitate Google's UI | VERIFIED (review) | No Google logo/colours/layout; the word "Google" is plain text only. Note: judged by inspection |
| Error/unavailable states | VERIFIED | Disabled and 404 screenshots; offline + delayed navigation tests |
| Loading behaviour | VERIFIED | 8 KiB total, FCP 0.8 s (mobile-throttled), LCP 0.9 s, CLS 0, TBT 0 |

## Remaining observations (not defects)

* **Dark mode intentionally omitted.** Light is primary; a per-business accent would need a second contrast-validated palette per theme — complexity without proven benefit for a 5-second interaction.
* **Golden ratio used once, where it is measurable:** free space above:below content = 1 : 1.618 (card centre ≈ 38 % from top = optical centre).
* Arabic glyph shapes depend on the device system font; verified only in this container's Chromium (Noto-type fallback). **Real Samsung Internet / iOS Safari rendering is UNVERIFIED** — check on a physical Galaxy and iPhone.
* The `Google` word is rendered LTR inside RTL text via `<bdi>`; looks right in Chromium; confirm on iOS.

## Pre-delivery checklist (from `references/pro-rules.md`)

- [x] No emoji icons · [x] one icon family/stroke · [x] press states don't shift layout · [x] touch ≥44/48 · [x] 150–300 ms micro-interactions only (160 ms colour) · [x] disabled/busy clear · [x] semantic tokens · [x] reduced motion · [x] focus order = visual order · [x] 320 px and landscape tested · [ ] dark mode (n/a by decision) · [ ] real-device Dynamic Type check (PARTIAL: layout uses rem/clamp, not device-tested)

Screenshots: `docs/screenshots/` (e.g. `branch-001-galaxy-s23-360x780.png`, `…-320x568.png`, `disabled.png`, `not-found.png`, `focus-ring.png`).
