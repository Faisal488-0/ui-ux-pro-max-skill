import { readFileSync } from 'node:fs';
import { validateConfig, validateLedger, type Config } from '../src/lib/validate.ts';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), 'utf8'));
const cfg = read('businesses.json') as Config;
const errs = [...validateConfig(cfg), ...validateLedger(cfg, read('assignments.lock.json'))];
if (errs.length) {
  console.error('✗ Configuration invalid:\n - ' + errs.join('\n - '));
  process.exit(1);
}
console.log(`✓ Configuration valid: ${cfg.businesses.length} business(es), ${cfg.businesses.reduce((n, b) => n + b.branches.length, 0)} branch(es).`);
