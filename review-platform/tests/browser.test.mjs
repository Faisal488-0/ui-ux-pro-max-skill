// Real-browser checks (Chromium via playwright-core). Serves dist-fixture with the real _headers CSP applied.
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const ROOT = 'dist-fixture';
const csp = readFileSync(`${ROOT}/_headers`, 'utf8').match(/Content-Security-Policy: (.+)/)[1];
const types = { html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', txt: 'text/plain' };
const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  const cands = [p, p + '.html', p + '/index.html'].map((c) => ROOT + c);
  const file = cands.find((c) => existsSync(c) && !c.endsWith('/')) ;
  const body = file && readFileSync(file);
  const h = { 'content-security-policy': csp, 'x-content-type-options': 'nosniff' };
  if (!body) { res.writeHead(404, { ...h, 'content-type': types.html }); return res.end(readFileSync(`${ROOT}/404.html`)); }
  res.writeHead(200, { ...h, 'content-type': types[file.split('.').pop()] ?? 'application/octet-stream' }); res.end(body);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
mkdirSync('docs/screenshots', { recursive: true });
let pass = 0; const fail = [];
const check = (name, ok, extra = '') => { ok ? pass++ : fail.push(`${name} ${extra}`); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${ok ? '' : extra}`); };

const devices = [
  ['galaxy-s-small-320x568', 320, 568, 2], ['galaxy-s23-360x780', 360, 780, 3], ['iphone-se-375x667', 375, 667, 2],
  ['iphone-15-393x852', 393, 852, 3], ['galaxy-fold-inner-884x1104', 884, 1104, 2], ['tablet-768x1024', 768, 1024, 2], ['landscape-phone-780x360', 780, 360, 3],
];
for (const id of ['branch-001', 'branch-002', 'branch-005']) {
  for (const [name, w, h, dpr] of devices) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: w < 800, locale: 'ar-KW' });
    const page = await ctx.newPage();
    const errors = []; const requests = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('request', (r) => requests.push(r.url()));
    await page.goto(`${base}/r/${id}`);
    const tag = `${id} @ ${name}`;
    const m = await page.evaluate(() => {
      const b = document.querySelector('[data-review]').getBoundingClientRect();
      const de = document.documentElement;
      return { sw: de.scrollWidth, cw: de.clientWidth, sh: de.scrollHeight, ch: de.clientHeight, btn: { top: b.top, bottom: b.bottom, h: b.height, w: b.width, l: b.left, r: b.right }, dir: getComputedStyle(document.body).direction, bizSize: parseFloat(getComputedStyle(document.querySelector('.biz')).fontSize), fam: getComputedStyle(document.body).fontFamily.slice(0, 20) };
    });
    check(`no horizontal overflow  ${tag}`, m.sw <= m.cw, JSON.stringify(m));
    check(`RTL  ${tag}`, m.dir === 'rtl');
    check(`CTA >=48px tall, within viewport width  ${tag}`, m.btn.h >= 48 && m.btn.l >= 0 && m.btn.r <= w);
    if (!(w === 780 && h === 360)) check(`CTA visible without scrolling  ${tag}`, m.btn.bottom <= h && m.sh <= m.ch + 1, `bottom=${m.btn.bottom} h=${h} sh=${m.sh}`);
    const expected404 = id === 'branch-005'; // fixture deliberately points at a missing logo file
    check(`no console errors / CSP violations  ${tag}`, errors.filter((e) => !(expected404 && e.includes('404'))).length === 0, errors.join('|'));
    check(`only same-origin requests  ${tag}`, requests.every((u) => u.startsWith(base) || u.startsWith('data:')), requests.join(' '));
    if (id === 'branch-001' || name.startsWith('galaxy-s23')) await page.screenshot({ path: `docs/screenshots/${id}-${name}.png` });
    await ctx.close();
  }
}

// Accessibility (axe-core, injected from local node_modules), on every state
for (const id of ['branch-001', 'branch-002', 'branch-003', 'branch-005', 'branch-004', 'branch-006']) {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce' });
  await page.goto(`${base}/r/${id}`);
  await page.addScriptTag({ content: axeSrc }).catch(() => {}); // CSP blocks inline script: fall back to evaluate
  const res = await page.evaluate(async (src) => { if (!window.axe) { (0, eval)(src); } return (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 60) + ' ' + (n.any[0]?.message ?? '')).join(' ; ')}`); }, axeSrc).catch((e) => ['axe failed: ' + e.message]);
  check(`axe-core: 0 violations  ${id}`, res.length === 0, res.join(', '));
  await page.close();
}

// Interaction: loading feedback, double-tap guard, destination, delayed navigation
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, hasTouch: true });
  const page = await ctx.newPage();
  const nav = [];
  await ctx.route('https://search.google.com/**', (r) => { nav.push(r.request().url()); r.fulfill({ status: 204 }); }); // 204 = stay on page (simulates stalled navigation)
  await page.goto(`${base}/r/branch-001`);
  const r1 = await page.evaluate(() => {
    const a = document.querySelector('[data-review]');
    a.click();
    const first = { busy: a.getAttribute('aria-busy'), msg: document.querySelector('[data-status]').textContent };
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true }); a.dispatchEvent(ev);
    return { first, secondPrevented: ev.defaultPrevented };
  });
  check('click sets busy + status message', r1.first.busy === 'true' && r1.first.msg.includes('جارٍ فتح'), JSON.stringify(r1));
  check('second tap while busy is prevented (no double navigation)', r1.secondPrevented === true);
  await page.waitForTimeout(500);
  check('exactly one navigation to the exact validated Google URL', nav.length === 1 && nav[0] === 'https://search.google.com/local/writereview?placeid=ChIJ_aTomeKZzz8RLgO2Hy19XaM&hl=ar', JSON.stringify(nav));
  await page.waitForTimeout(6200);
  const r2 = await page.evaluate(() => ({ busy: document.querySelector('[data-review]').getAttribute('aria-busy'), msg: document.querySelector('[data-status]').textContent }));
  check('delayed navigation: button re-enabled with retry message', r2.busy === null && r2.msg.includes('اضغط الزر مرة أخرى'), JSON.stringify(r2));
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await ctx.route('https://search.google.com/**', (r) => r.abort());
  await page.goto(`${base}/r/branch-001`);
  await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { get: () => false }));
  await page.locator('[data-review]').click({ noWaitAfter: true });
  await page.waitForTimeout(100);
  const so = await page.evaluate(() => ({ busy: document.querySelector('[data-review]').getAttribute('aria-busy'), msg: document.querySelector('[data-status]').textContent }));
  check('offline: friendly message, no busy state', so.msg.includes('لا يوجد اتصال') && so.busy === null, JSON.stringify(so));
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); await page.goto(`${base}/r/branch-001`);
  check('reduced motion: no animation or transition on the button', await page.evaluate(() => { const c = getComputedStyle(document.querySelector('.cta')); return c.animationName === 'none' && parseFloat(c.transitionDuration) === 0; }));
  check('content paints immediately: no entrance animation / zero-opacity start', await page.evaluate(() => getComputedStyle(document.querySelector('.card')).animationName === 'none'));
  await ctx.close();
}
{
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(`${base}/r/branch-003`); // approved + logo? (branch-003 has café logo): ensure it renders
  check('logo renders when approved & present', await page.evaluate(() => { const i = document.querySelector('[data-logo]'); return !!i && i.naturalWidth > 0; }));
  await page.screenshot({ path: 'docs/screenshots/branch-003-approved-logo.png' });
  const p5 = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await p5.goto(`${base}/r/branch-005`); // logo path missing -> 404 -> fallback icon
  await p5.waitForTimeout(300);
  check('missing logo file falls back to category icon', await p5.evaluate(() => document.querySelector('[data-mark]').hasAttribute('data-fallback') && getComputedStyle(document.querySelector('.glyph')).display !== 'none'));
  await p5.waitForTimeout(450); await p5.screenshot({ path: 'docs/screenshots/branch-005-missing-logo-fallback.png' });
  for (const [path, shot] of [['/r/branch-004', 'disabled'], ['/r/branch-999', 'not-found']]) {
    const p = await browser.newPage({ viewport: { width: 360, height: 780 } });
    const resp = await p.goto(base + path);
    check(`${path} shows safe notice, no review button`, (await p.locator('[data-review]').count()) === 0 && (await p.locator('h1').innerText()).length > 0 && (shot !== 'not-found' || resp.status() === 404));
    await p.waitForTimeout(450); await p.screenshot({ path: `docs/screenshots/${shot}.png` });
  }
}
{ // keyboard: first Tab lands on the review button, visible focus ring
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(`${base}/r/branch-001`); await page.keyboard.press('Tab');
  check('keyboard: first Tab focuses the review button with visible outline', await page.evaluate(() => document.activeElement?.hasAttribute('data-review') && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2));
  await page.screenshot({ path: 'docs/screenshots/focus-ring.png' });
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail.length} failed`);
if (fail.length) { console.log(fail.join('\n')); process.exit(1); }
