# Security Audit

Scope: this application (`review-platform/`). Method: code review + automated tests + `npm audit` + browser runs with the real CSP.
Labels: VERIFIED (demonstrated by a check) · FIXED · PARTIAL · BLOCKED.

| Area | Finding / control | Status |
|---|---|---|
| **Open redirect** | There is **no redirect endpoint** and no URL taken from the request. The button `href` is baked in at build time from validated config. | VERIFIED (build test: only allowlisted hosts in any `href`) |
| **Destination allowlist** | Only `https://search.google.com/local/writereview?placeid=…` and `https://g.page/r/<id>/review`. Final URL is *rebuilt* from parsed parts. Rejected & tested (25 vectors): `http:`, `javascript:`, `data:`, `//host`, userinfo (`google.com@evil`), look-alike hosts, punycode, ports, extra params (`continue=`), duplicate `placeid`, fragments, whitespace/newlines, backslashes, non-strings. | VERIFIED (`tests/unit.test.ts`) |
| **Wrong-business protection** | If both `placeId` and `reviewUrl` are set they must agree, else the branch is invalid and the build fails. `approved` + `active` requires `destinationVerified: true`; changing a destination resets it. | VERIFIED (unit tests) |
| **Branch isolation** | Per-branch pages are generated from that branch only; test with 5 businesses / 7 branches shows no foreign URL/name/label on any page, and disabled-branch data never leaks. | VERIFIED |
| **Immutable ids** | `assignments.lock.json` ledger: reuse, re-homing or deletion of an issued branch id fails validation/build. | VERIFIED (unit tests) |
| **Route validation** | Static routes only; unknown ids → `404.html` (no page exists). Id format enforced `^[a-z][a-z0-9]{1,11}-\d{3,6}$`. | VERIFIED |
| **XSS** | Astro escapes all interpolations; names reject `<`/`>`; logo paths restricted to `/logos/<slug>.(svg\|png\|webp)`; theme colour must be `#RRGGBB` (it is placed in a `style` attribute); no `set:html` with data (only a constant icon map). No inline scripts, no `on*=` handlers. | VERIFIED (generated-HTML tests) |
| **CSP** | `default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`. `style-src-attr 'unsafe-inline'` is needed only for the validated `--accent` hex. Navigation to Google is a link, not governed by `connect-src`/`navigate-to`. | VERIFIED locally (140+ browser checks ran with this exact header, 0 CSP console errors) · PARTIAL for production (header delivered via `_headers`; must be confirmed on the real host after deploy) |
| **Other headers** | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (geo/camera/mic off), `HSTS`, `X-Robots-Tag`. Link also has `rel="noopener noreferrer"`. | PARTIAL (file present in `dist/`; not yet observed on a live host) |
| **HTTPS** | Cloudflare Pages serves HTTPS only; `upgrade-insecure-requests` + HSTS. NFC cards must be written with `https://`. | BLOCKED (no deployment performed) |
| **Admin access** | No web admin exists. Changes happen through a local CLI + git; repository permissions are the access control. Recommended: protect `main`, require PR review for `data/`. | VERIFIED (design) |
| **Secrets** | None required: no API keys, tokens, env vars or database. `REVIEW_DATA_FILE` is a build-time test hook only. | VERIFIED |
| **Dependencies** | `npm audit` on Astro 5.18.2 reported 3 vulns (1 critical: Astro XSS/RCE advisories in features this app doesn't use). **Upgraded to Astro 7.3.8 → `found 0 vulnerabilities`** (full tree incl. dev), app re-tested. Runtime JS dependencies of the shipped site: **none**. | FIXED |
| **Privacy** | No cookies, storage, analytics, fonts, CDNs, or requests to any third party from our page; no location/personal data requested; Referrer suppressed. The customer's data goes only to Google after they click. | VERIFIED (browser: only same-origin requests) |
| **Indexing** | `noindex,nofollow` meta + header + `Disallow: /` (NFC pages are not meant for search). | VERIFIED |
| **Enumeration** | Ids are sequential (`branch-001…`), so someone can guess other pages. Pages contain only public business info and a public Google review link, so impact is low. Use non-sequential ids if that becomes a concern. | Accepted risk (documented) |
| **Abuse by operator** | The tool prevents redirecting to non-Google hosts, but cannot stop an operator from pointing a card at the *wrong Google business*; mitigated by `destinationVerified` + manual verification step in `BUSINESS_SETUP_AR.md`. | PARTIAL (process control) |
| **Dev-time** | Dev server (esbuild/vite) is for local use only; do not expose `npm run dev` to the internet. | Documented |

## Not covered
No penetration test of the live host; no WAF/DDoS review (Cloudflare free tier default); Google-side behaviour is outside our control.
