import { readFileSync } from 'node:fs';
import { validateConfig, type Business, type Branch, type Config } from './validate.ts';

// Build-time only. REVIEW_DATA_FILE lets the test-suite build a fixture dataset.
const file = process.env.REVIEW_DATA_FILE ?? 'data/businesses.json' // relative to project root (build cwd);
const cfg = JSON.parse(readFileSync(file, 'utf8')) as Config;
const errors = validateConfig(cfg);
if (errors.length) throw new Error('Invalid business configuration:\n - ' + errors.join('\n - '));

export const businesses: Business[] = cfg.businesses;
export const allBranches: { biz: Business; branch: Branch }[] = businesses.flatMap((biz) => biz.branches.map((branch) => ({ biz, branch })));
