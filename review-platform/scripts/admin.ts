// Local operator tool. There is deliberately NO public admin endpoint: changes are made here,
// validated, committed to git and deployed. Usage: npm run admin -- <command> [args]
import { readFileSync, writeFileSync } from 'node:fs';
import { buildPlaceReviewUrl, resolveDestination, validateConfig, validateLedger, CATEGORIES, type Config, type Business, type Branch } from '../src/lib/validate.ts';

const F = new URL('../data/businesses.json', import.meta.url);
const L = new URL('../data/assignments.lock.json', import.meta.url);
const cfg = JSON.parse(readFileSync(F, 'utf8')) as Config;
const ledger = JSON.parse(readFileSync(L, 'utf8')) as Record<string, string>;
const [cmd, ...a] = process.argv.slice(2);
const now = () => new Date().toISOString();
function die(m: string): never { console.error('✗ ' + m); process.exit(1); }
const biz = (id?: string) => cfg.businesses.find((b) => b.id === id) ?? die(`unknown business ${id}`);
const find = (id?: string) => {
  for (const b of cfg.businesses) for (const br of b.branches) if (br.id === id) return { b, br };
  return die(`unknown branch ${id}`);
};
const next = (prefix: string, ids: string[]) => `${prefix}-${String(Math.max(0, ...ids.map((i) => parseInt(i.split('-')[1]!, 10))) + 1).padStart(3, '0')}`;
const issuedBranchIds = () => Object.keys(ledger);

/** "ChIJ…" => place id, "https://…" => direct review url. */
function setDest(br: Branch, v: string) {
  if (v.startsWith('https://')) { br.reviewUrl = v; br.placeId = null; } else { br.placeId = v; br.reviewUrl = null; }
  br.destinationVerified = false; // any change to the destination must be re-verified by a human
}

switch (cmd) {
  case 'list':
    for (const b of cfg.businesses) {
      console.log(`${b.id}  ${b.nameAr}  [${b.category}]  ${b.approval === 'approved' ? 'OFFICIAL' : 'DEMO/' + b.approval}`);
      for (const br of b.branches) console.log(`   /r/${br.id}  ${br.status.padEnd(8)} ${br.destinationVerified ? 'verified  ' : 'UNVERIFIED'} ${br.labelAr} → ${resolveDestination(br) ?? '(none)'}`);
    }
    process.exit(0);
  case 'add-business': {
    const [nameAr, category = 'restaurant', themeColor = '#1F5C4D'] = a;
    if (!nameAr || !CATEGORIES.includes(category as never)) die(`usage: add-business "<nameAr>" <${CATEGORIES.join('|')}> [#hex]`);
    const b: Business = { id: next('biz', cfg.businesses.map((x) => x.id)), nameAr: nameAr!, nameEn: null, category: category as never, logo: null, themeColor, welcomeMessage: null, approval: 'demo', branches: [] };
    cfg.businesses.push(b); console.log('added', b.id); break;
  }
  case 'add-branch': {
    const [bid, labelAr, dest] = a;
    const b = biz(bid);
    if (!labelAr) die('usage: add-branch <biz-id> "<label>" [placeId|https-url]');
    const id = next('branch', issuedBranchIds());
    const br: Branch = { id, labelAr: labelAr!, placeId: null, reviewUrl: null, destinationVerified: false, welcomeMessage: null, status: 'draft', updatedAt: now() };
    if (dest) setDest(br, dest);
    b.branches.push(br); ledger[id] = b.id; console.log('added', id, '→ NFC URL path: /r/' + id); break;
  }
  case 'set-destination': { const { br } = find(a[0]); if (!a[1]) die('usage: set-destination <branch-id> <placeId|https-url>'); setDest(br, a[1]!); br.updatedAt = now(); break; }
  case 'verify': { const { br } = find(a[0]); br.destinationVerified = true; br.updatedAt = now(); break; }
  case 'activate': { const { br } = find(a[0]); br.status = 'active'; br.updatedAt = now(); break; }
  case 'disable': { const { br } = find(a[0]); br.status = 'disabled'; br.updatedAt = now(); break; }
  case 'set-name': { biz(a[0]).nameAr = a[1] ?? die('usage: set-name <biz-id> "<nameAr>"'); break; }
  case 'set-theme': { biz(a[0]).themeColor = a[1] ?? die('usage: set-theme <biz-id> #RRGGBB'); break; }
  case 'approve': { biz(a[0]).approval = 'approved'; break; } // only after written authorisation
  case 'withdraw': { biz(a[0]).approval = 'withdrawn'; break; }
  case 'place-url': console.log(buildPlaceReviewUrl(a[0] ?? die('usage: place-url <placeId>'))); process.exit(0);
  default:
    console.log('commands: list | add-business | add-branch | set-destination | verify | activate | disable | set-name | set-theme | approve | withdraw | place-url');
    process.exit(cmd ? 1 : 0);
}
const errs = [...validateConfig(cfg), ...validateLedger(cfg, ledger)];
if (errs.length) die('change rejected, nothing written:\n - ' + errs.join('\n - '));
writeFileSync(F, JSON.stringify(cfg, null, 2) + '\n');
writeFileSync(L, JSON.stringify(ledger, null, 2) + '\n');
console.log('✓ saved and validated');
