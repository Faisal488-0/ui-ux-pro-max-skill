// Builds the 5-business / 7-branch fixture and the real dataset, then inspects the generated HTML.
import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs';

const sh = (c: string, env = {}) => execSync(c, { stdio: 'pipe', env: { ...process.env, ...env } });
const html = (dir: string, id: string) => readFileSync(`${dir}/r/${id}.html`, 'utf8').replace(/&amp;/g, '&'); // compare decoded attribute values
const FX = 'dist-fixture';

before(() => {
  sh(`npx astro build --outDir ${FX}`, { REVIEW_DATA_FILE: 'tests/fixtures/multi.json' });
  mkdirSync(`${FX}/logos`, { recursive: true });
  copyFileSync('tests/fixtures/test-logo.svg', `${FX}/logos/test-logo.svg`);
  sh('npx astro build --outDir dist');
});

test('one static page per branch, plus 404', () => {
  assert.deepEqual(readdirSync(`${FX}/r`).sort(), Array.from({ length: 7 }, (_, i) => `branch-00${i + 1}.html`));
  assert.ok(existsSync(`${FX}/404.html`));
});
test('unknown ids have no page (served by 404.html)', () => assert.ok(!existsSync(`${FX}/r/branch-999.html`)));

const FORBIDDEN = [/NFC/i, /★|☆|⭐|✩|✪/, /star/i, /rating/i, /SMART REVIEWS/i, /تقييم\s*بالنجوم/, /نجوم|نجمة/];
test('no stars, no NFC branding on ANY page (customer-facing)', () => {
  for (const dir of [FX, 'dist']) for (const f of readdirSync(`${dir}/r`)) {
    const h = readFileSync(`${dir}/r/${f}`, 'utf8').replace(/<style[\s\S]*?<\/style>/g, '');
    for (const re of FORBIDDEN) assert.doesNotMatch(h, re, `${dir}/r/${f} matches ${re}`);
  }
});
test('required Arabic copy is present and exact (branch-001)', () => {
  const h = html(FX, 'branch-001');
  for (const t of ['شكراً لزيارتك!', 'جباتي راشد', 'رأيك يهمنا ويساعدنا على تحسين خدماتنا.', 'قيّم تجربتك على', 'سيتم نقلك إلى Google لكتابة تقييمك بحرية.', 'نموذج توضيحي غير رسمي']) assert.ok(h.includes(t), t);
  assert.match(h, /<html lang="ar" dir="rtl">/);
});
test('layout order matches spec', () => {
  const h = html(FX, 'branch-001');
  const order = ['data-mark', 'شكراً لزيارتك!', 'class="biz"', 'class="msg"', 'data-review', 'class="note"', 'class="demo"'].map((t) => h.indexOf(t));
  assert.ok(order.every((n) => n >= 0) && order.every((n, i) => i === 0 || n > order[i - 1]!), String(order));
});
test('branch isolation: each page links only to its own destination and shows only its own name', () => {
  const expect: Record<string, { href: string; name: string; label: string }> = {
    'branch-001': { href: 'https://search.google.com/local/writereview?placeid=ChIJ_aTomeKZzz8RLgO2Hy19XaM&hl=ar', name: 'جباتي راشد', label: 'عبدالله المبارك' },
    'branch-002': { href: 'https://search.google.com/local/writereview?placeid=ChIJ_AAAAAAAAAAAAAAAAAAAAAA1&hl=ar', name: 'مقهى الندى', label: 'السالمية' },
    'branch-003': { href: 'https://search.google.com/local/writereview?placeid=ChIJ_BBBBBBBBBBBBBBBBBBBBBB2&hl=ar', name: 'مقهى الندى', label: 'حولي' },
    'branch-005': { href: 'https://g.page/r/Cabcdefgh12345/review', name: 'صالون لمسة', label: 'الفروانية' },
  };
  const allHrefs = Object.values(expect).map((e) => e.href);
  for (const [id, e] of Object.entries(expect)) {
    const h = html(FX, id);
    const hrefs = [...h.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(hrefs, [e.href], id);
    for (const other of allHrefs.filter((x) => x !== e.href)) assert.ok(!h.includes(other), `${id} leaks ${other}`);
    assert.ok(h.includes(e.name) && h.includes(e.label), id);
    for (const [oid, o] of Object.entries(expect)) if (oid !== id && o.name !== e.name) assert.ok(!h.includes(o.name), `${id} shows ${o.name}`);
    assert.ok(!(h.match(/[^\x00-\x7f]*الجهراء/)), `${id} leaks disabled branch`);
  }
});
test('per-branch welcome message override', () => {
  assert.ok(html(FX, 'branch-003').includes('أهلاً بكم في فرع حولي.'));
  assert.ok(html(FX, 'branch-002').includes('نسعد بخدمتكم دائماً.'));
  assert.ok(!html(FX, 'branch-002').includes('أهلاً بكم'));
});
test('disabled, withdrawn and draft branches render an inert notice: no button, no URL, no business name', () => {
  for (const [id, name] of [['branch-004', 'مقهى الندى'], ['branch-006', 'متجر الأفق'], ['branch-007', 'ورشة النخبة']] as const) {
    const h = html(FX, id);
    assert.ok(h.includes('هذه الصفحة غير متاحة حالياً'), id);
    assert.ok(!h.includes('data-review') && !/google/i.test(h.replace(/<style[\s\S]*?<\/style>/g, '')) && !h.includes(name), id);
  }
});
test('demo disclaimer: shown for demo, hidden for approved', () => {
  assert.ok(html(FX, 'branch-001').includes('نموذج توضيحي غير رسمي'));
  assert.ok(!html(FX, 'branch-002').includes('نموذج توضيحي غير رسمي'));
});
test('logo only for approved business; missing logo path falls back to the category icon in markup', () => {
  assert.match(html(FX, 'branch-002'), /<img src="\/logos\/test-logo\.svg"[^>]*data-logo/);
  assert.match(html(FX, 'branch-002'), /<svg class="glyph"/); // fallback present
  assert.match(html(FX, 'branch-005'), /<svg class="glyph"/);
  assert.ok(!html(FX, 'branch-001').includes('<img'));
});
test('no third-party requests, no inline scripts, no event handlers', () => {
  for (const dir of [FX, 'dist']) for (const f of readdirSync(`${dir}/r`)) {
    const h = readFileSync(`${dir}/r/${f}`, 'utf8');
    assert.deepEqual([...h.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]).filter((s) => !/src="\/r\.js"/.test(s)), []);
    assert.doesNotMatch(h, /\son[a-z]+\s*=/i);
    assert.deepEqual([...h.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]!.replace(/&amp;/g, '&')).hostname).filter((x) => x !== 'search.google.com' && x !== 'g.page'), []);
  }
});
test('real dataset: branch-001 is generated and robots/CSP files ship', () => {
  assert.ok(existsSync('dist/r/branch-001.html'));
  assert.match(readFileSync('dist/_headers', 'utf8'), /Content-Security-Policy: default-src 'none'/);
  assert.match(readFileSync('dist/robots.txt', 'utf8'), /Disallow: \//);
});
