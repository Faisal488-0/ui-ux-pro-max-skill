# Smart Review Platform

Arabic-first, RTL, mobile-first landing pages that take a customer from an NFC card straight to the
correct business's **Google review form**. Static site, zero backend, zero tracking, free-tier hosting.

```
NFC card ──► https://<final-domain>/r/branch-001 ──► Arabic landing page ──► [قيّم تجربتك على Google] ──► Google review form
```

* **Permanent card URL, editable destination.** The card stores only `/r/<branch-id>`. The Google link lives in
  `data/businesses.json`; change it, deploy, and every already-sold card follows. No card is ever rewritten.
* **No stars, no NFC header, no rating UI** anywhere on the customer page. Customers choose their rating inside Google.
* **No client-side admin.** Management is a local CLI + git (no public admin endpoint to attack).

## Quick start

```bash
cd review-platform
npm install
npm run dev          # http://localhost:4321/r/branch-001
npm test             # validate + typecheck + build + unit + build-output + real-browser tests
npm run build        # -> dist/ (deploy this folder)
```

## Operator commands (`npm run admin -- <cmd>`)

| Command | Effect |
|---|---|
| `list` | All businesses/branches, status, DEMO vs OFFICIAL, verified flag, resolved Google URL (card→branch assignments) |
| `add-business "<اسم>" <restaurant\|cafe\|salon\|retail\|service> [#hex]` | New business (starts as **demo**) |
| `add-branch <biz-id> "<الفرع>" [placeId\|https-url]` | New branch; allocates the next immutable `branch-NNN`, status `draft` |
| `set-destination <branch-id> <placeId\|url>` | Change where the button goes (resets *verified*) |
| `verify <branch-id>` | Mark destination verified **after you opened it and confirmed the business** |
| `activate` / `disable <branch-id>` | Go live / switch a page off (shows a neutral "unavailable" notice) |
| `set-name`, `set-theme` | Edit Arabic name / theme colour (contrast-checked) |
| `approve` / `withdraw <biz-id>` | Record / withdraw the business's authorisation (`approve` removes the demo label — only with written permission) |
| `place-url <placeId>` | Print the review URL for a Place ID |

Every change is validated *before* anything is written; invalid changes write nothing. Preview locally with
`npm run dev`, then commit + push; the host rebuilds.

## Data model (`data/businesses.json`)

Business: `id, nameAr, nameEn?, category, logo?, themeColor, welcomeMessage?, approval (demo|approved|withdrawn)`.
Branch: `id (immutable), labelAr, placeId | reviewUrl, destinationVerified, welcomeMessage?, status (active|disabled|draft), updatedAt`.
`data/assignments.lock.json` is the **id ledger**: a branch id can never be reassigned to another business or deleted
(use `disabled`); `npm run validate` and the build fail otherwise.

Allowed destinations (everything else is rejected at build time): `https://search.google.com/local/writereview?placeid=<id>`
and `https://g.page/r/<id>/review`. The final URL is *re-built* from the parsed parts, never copied from input.

## Page behaviour

* `/r/<id>` active → landing page. `disabled`/`draft`/`withdrawn`/unknown → neutral Arabic notice, no button, no URL, no business name.
* Demo (`approval ≠ approved`) pages show **«نموذج توضيحي غير رسمي»**; logos render only for approved businesses; a missing logo falls back to a category icon.
* Button: real `<a href>` (works without JS). Enhancement script adds busy state, double-tap guard, offline message, 6 s retry hint.
* All pages are `noindex`; `robots.txt` disallows all. No cookies, analytics, fonts or third-party requests.

## Repository layout

`src/lib/validate.ts` (security core) · `src/pages/r/[id].astro` (page) · `src/styles/global.css` (tokens) ·
`public/_headers` (CSP & friends) · `scripts/admin.ts` · `tests/` · `docs/screenshots/`.

## Docs

`BUSINESS_SETUP_AR.md` · `NFC_CARD_SETUP_AR.md` · `DEPLOYMENT_GUIDE_AR.md` · `UX_UI_AUDIT.md` · `SECURITY_AUDIT.md` · `TEST_REPORT.md`

## Status snapshot (see TEST_REPORT.md for evidence)

Branch `ccr-c47bdbec-m0nd38`. UX skill used: **`ui-ux-pro-max`** at `.claude/skills/ui-ux-pro-max/SKILL.md` (this repo).
**Not done / blocked:** production deployment, final domain, physical NFC tap test, verification that the demo Place ID is really *جباتي راشد*.
