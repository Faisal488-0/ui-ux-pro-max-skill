import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseReviewUrl, resolveDestination, validateConfig, validateLedger, contrastWithWhite, isEffectivelyActive, type Config } from '../src/lib/validate.ts';

const PID = 'ChIJ_aTomeKZzz8RLgO2Hy19XaM';
const GOOD = `https://search.google.com/local/writereview?placeid=${PID}&hl=ar`;

test('accepts the candidate Google write-review URL and normalises it', () => {
  assert.equal(normaliseReviewUrl(GOOD), GOOD);
  assert.equal(normaliseReviewUrl(`https://search.google.com/local/writereview?placeid=${PID}`), GOOD);
});
test('accepts g.page review links', () => {
  assert.equal(normaliseReviewUrl('https://g.page/r/Cabcdefgh12345/review'), 'https://g.page/r/Cabcdefgh12345/review');
});
test('rejects open-redirect and look-alike URLs', () => {
  const bad = [
    'http://search.google.com/local/writereview?placeid=' + PID,
    'https://search.google.com.evil.com/local/writereview?placeid=' + PID,
    'https://evil.com/?u=https://search.google.com/local/writereview?placeid=' + PID,
    'https://search.google.com@evil.com/local/writereview?placeid=' + PID,
    'https://user:pw@search.google.com/local/writereview?placeid=' + PID,
    'https://search.google.com:8443/local/writereview?placeid=' + PID,
    'https://search.google.com/url?q=https://evil.com',
    'https://search.google.com/local/writereview?placeid=' + PID + '&continue=https://evil.com',
    'https://search.google.com/local/writereview?placeid=a&placeid=b',
    'https://search.google.com/local/writereview?placeid=short',
    'https://xn--ggle-0nda.com/local/writereview?placeid=' + PID,
    'https://g.page/r/Cabcdefgh12345/review?next=https://evil.com',
    'https://g.page/evil/path',
    'javascript:alert(1)', 'data:text/html,<script>1</script>', '//evil.com', '/relative', '', 'https://search.google.com/local/writereview?placeid=' + PID + '\n',
    '  ' + GOOD, 'https:\\\\evil.com', 'https://search.google.com/local/writereview?placeid=' + PID + '#x',
  ];
  for (const u of bad) assert.equal(normaliseReviewUrl(u), null, `should reject: ${JSON.stringify(u)}`);
  for (const u of [null, undefined, 42, {}, []]) assert.equal(normaliseReviewUrl(u), null);
});
test('placeId and reviewUrl must describe the same place', () => {
  assert.equal(resolveDestination({ placeId: PID, reviewUrl: GOOD }), GOOD);
  assert.equal(resolveDestination({ placeId: 'ChIJ_BBBBBBBBBBBBBBBBBBBBBB2', reviewUrl: GOOD }), null);
  assert.equal(resolveDestination({ placeId: 'bad id!', reviewUrl: null }), null);
  assert.equal(resolveDestination({ placeId: null, reviewUrl: null }), null);
});

const mk = (over: Record<string, unknown> = {}, br: Record<string, unknown> = {}): Config => ({
  businesses: [{ id: 'biz-001', nameAr: 'اختبار', category: 'cafe', themeColor: '#1F5C4D', approval: 'demo', logo: null,
    branches: [{ id: 'branch-001', labelAr: 'فرع', placeId: PID, destinationVerified: false, status: 'active', updatedAt: '2026-01-01T00:00:00Z', ...br }], ...over } as never],
});
test('valid config passes', () => assert.deepEqual(validateConfig(mk()), []));
test('config validation catches errors', () => {
  assert.ok(validateConfig(mk({ themeColor: '#F5E000' })).some((e) => e.includes('contrast')));
  assert.ok(validateConfig(mk({ themeColor: 'red' })).length);
  assert.ok(validateConfig(mk({ nameAr: '<script>' })).length);
  assert.ok(validateConfig(mk({ logo: 'https://evil.com/x.png' })).length);
  assert.ok(validateConfig(mk({ logo: '/logos/../../x.png' })).length);
  assert.ok(validateConfig(mk({}, { id: 'Branch 1' })).length);
  assert.ok(validateConfig(mk({}, { placeId: null })).some((e) => e.includes('active')));
  assert.ok(validateConfig(mk({}, { reviewUrl: 'https://evil.com' })).length);
  assert.ok(validateConfig(mk({ approval: 'approved' })).some((e) => e.includes('unverified')));
  assert.deepEqual(validateConfig(mk({ approval: 'approved' }, { destinationVerified: true })), []);
});
test('branch ids: random 12-char and legacy accepted; guessable/odd forms rejected', () => {
  for (const id of ['k7m2qx9d4hpt', 'branch-001']) assert.deepEqual(validateConfig(mk({}, { id })), [], id);
  for (const id of ['k7m2qx9d4hp', 'k7m2qx9d4hptt', 'K7M2QX9D4HPT', 'k7m2qx9d4h0t', 'branch-1', '../etc', 'a b']) assert.ok(validateConfig(mk({}, { id })).length, id);
});
test('duplicate branch ids are rejected', () => {
  const c = mk(); c.businesses.push({ ...c.businesses[0]!, id: 'biz-002' });
  assert.ok(validateConfig(c).some((e) => e.includes('duplicate branch')));
});
test('ledger: ids are never reused or moved', () => {
  const c = mk();
  assert.deepEqual(validateLedger(c, { 'branch-001': 'biz-001' }), []);
  assert.ok(validateLedger(c, { 'branch-001': 'biz-009' }).length);
  assert.ok(validateLedger(c, { 'branch-001': 'biz-001', 'branch-002': 'biz-001' }).some((e) => e.includes('removed')));
  assert.ok(validateLedger(c, {}).length);
});
test('withdrawn / disabled / draft are never live', () => {
  const c = mk(); const b = c.businesses[0]!, br = b.branches[0]!;
  assert.equal(isEffectivelyActive(b, br), true);
  assert.equal(isEffectivelyActive({ ...b, approval: 'withdrawn' }, br), false);
  assert.equal(isEffectivelyActive(b, { ...br, status: 'disabled' }), false);
  assert.equal(isEffectivelyActive(b, { ...br, status: 'draft' }), false);
});
test('shipped data themes pass contrast', () => assert.ok(contrastWithWhite('#1F5C4D') >= 4.5));
