// Pure, dependency-free validation. Shared by the build, the admin CLI and the tests.

export type Category = 'restaurant' | 'cafe' | 'salon' | 'retail' | 'service';
export type Approval = 'demo' | 'approved' | 'withdrawn';
export type BranchStatus = 'active' | 'disabled' | 'draft';

export interface Branch {
  id: string;
  labelAr: string;
  placeId?: string | null;
  reviewUrl?: string | null;
  destinationVerified: boolean;
  welcomeMessage?: string | null;
  status: BranchStatus;
  updatedAt: string;
}

export interface Business {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  category: Category;
  logo?: string | null;
  themeColor: string;
  welcomeMessage?: string | null;
  approval: Approval;
  branches: Branch[];
}

export interface Config {
  businesses: Business[];
}

export const CATEGORIES: readonly Category[] = ['restaurant', 'cafe', 'salon', 'retail', 'service'];
export const BRANCH_ID_RE = /^[a-z][a-z0-9]{1,11}-\d{3,6}$/; // e.g. branch-001 (immutable once issued)
export const BUSINESS_ID_RE = /^[a-z][a-z0-9]{1,11}-\d{3,6}$/;
export const PLACE_ID_RE = /^[A-Za-z0-9_-]{20,200}$/;
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export const LOGO_RE = /^\/logos\/[a-z0-9][a-z0-9-]{0,60}\.(svg|png|webp)$/;

/** Hostnames + path shapes we are willing to send a customer to. Everything else is rejected. */
const WRITE_REVIEW_HOST = 'search.google.com';
const WRITE_REVIEW_PATH = '/local/writereview';
const GPAGE_HOST = 'g.page';
const GPAGE_PATH_RE = /^\/r\/[A-Za-z0-9_-]{8,80}\/review$/;

export function isValidPlaceId(v: unknown): v is string {
  return typeof v === 'string' && PLACE_ID_RE.test(v);
}

/**
 * Validates a Google review destination and returns a *normalised* URL we construct ourselves
 * (never the raw input), or null if it is not an allowed shape.
 */
export function normaliseReviewUrl(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 600 || /[\u0000-\u001f\s\\]/.test(input)) return null;
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash) return null;
  if (u.hostname === WRITE_REVIEW_HOST && u.pathname === WRITE_REVIEW_PATH) {
    const keys = [...u.searchParams.keys()];
    if (keys.some((k) => k !== 'placeid' && k !== 'hl')) return null;
    if (u.searchParams.getAll('placeid').length !== 1) return null;
    const pid = u.searchParams.get('placeid');
    if (!isValidPlaceId(pid)) return null;
    return buildPlaceReviewUrl(pid);
  }
  if (u.hostname === GPAGE_HOST && GPAGE_PATH_RE.test(u.pathname) && !u.search) {
    return `https://${GPAGE_HOST}${u.pathname}`;
  }
  return null;
}

export function buildPlaceReviewUrl(placeId: string): string {
  return `https://${WRITE_REVIEW_HOST}${WRITE_REVIEW_PATH}?placeid=${encodeURIComponent(placeId)}&hl=ar`;
}

/** The single function that decides where the button points. Null = no safe destination. */
export function resolveDestination(b: Pick<Branch, 'placeId' | 'reviewUrl'>): string | null {
  const fromUrl = b.reviewUrl ? normaliseReviewUrl(b.reviewUrl) : null;
  if (b.reviewUrl && !fromUrl) return null;
  if (b.placeId) {
    if (!isValidPlaceId(b.placeId)) return null;
    const fromPid = buildPlaceReviewUrl(b.placeId);
    // If both are given they must describe the same place (prevents "wrong business" mixups).
    if (fromUrl && new URL(fromUrl).hostname === WRITE_REVIEW_HOST && fromUrl !== fromPid) return null;
    return fromUrl ?? fromPid;
  }
  return fromUrl;
}

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
export function contrastWithWhite(hex: string): number {
  return 1.05 / (lum(hex) + 0.05);
}

export function isEffectivelyActive(biz: Business, br: Branch): boolean {
  return br.status === 'active' && biz.approval !== 'withdrawn' && resolveDestination(br) !== null;
}

/** Returns a list of human-readable errors (empty = valid). */
export function validateConfig(cfg: unknown): string[] {
  const errs: string[] = [];
  const c = cfg as Config;
  if (!c || !Array.isArray(c.businesses)) return ['businesses must be an array'];
  const bizIds = new Set<string>();
  const brIds = new Set<string>();
  for (const b of c.businesses) {
    const bp = `business ${b?.id}`;
    if (!BUSINESS_ID_RE.test(b?.id ?? '')) errs.push(`${bp}: invalid id`);
    if (bizIds.has(b.id)) errs.push(`${bp}: duplicate business id`);
    bizIds.add(b.id);
    if (!b.nameAr || typeof b.nameAr !== 'string' || b.nameAr.length > 80) errs.push(`${bp}: nameAr required (<=80 chars)`);
    if (b.nameAr && /[<>]/.test(b.nameAr + (b.nameEn ?? ''))) errs.push(`${bp}: names must not contain < or >`);
    if (!CATEGORIES.includes(b.category)) errs.push(`${bp}: invalid category`);
    if (!['demo', 'approved', 'withdrawn'].includes(b.approval)) errs.push(`${bp}: invalid approval`);
    if (!HEX_RE.test(b.themeColor ?? '')) errs.push(`${bp}: themeColor must be #RRGGBB`);
    else if (contrastWithWhite(b.themeColor) < 4.5) errs.push(`${bp}: themeColor contrast with white text is ${contrastWithWhite(b.themeColor).toFixed(2)} (<4.5)`);
    if (b.logo && !LOGO_RE.test(b.logo)) errs.push(`${bp}: logo must be /logos/<name>.(svg|png|webp)`);
    if (b.welcomeMessage && b.welcomeMessage.length > 140) errs.push(`${bp}: welcomeMessage too long`);
    if (!Array.isArray(b.branches)) errs.push(`${bp}: branches must be an array`);
    for (const br of b.branches ?? []) {
      const p = `branch ${br?.id}`;
      if (!BRANCH_ID_RE.test(br?.id ?? '')) errs.push(`${p}: invalid id`);
      if (brIds.has(br.id)) errs.push(`${p}: duplicate branch id`);
      brIds.add(br.id);
      if (!br.labelAr || br.labelAr.length > 80 || /[<>]/.test(br.labelAr)) errs.push(`${p}: labelAr required (<=80 chars, no < >)`);
      if (!['active', 'disabled', 'draft'].includes(br.status)) errs.push(`${p}: invalid status`);
      if (br.welcomeMessage && br.welcomeMessage.length > 140) errs.push(`${p}: welcomeMessage too long`);
      if (Number.isNaN(Date.parse(br.updatedAt))) errs.push(`${p}: updatedAt must be ISO date`);
      const dest = resolveDestination(br);
      if ((br.reviewUrl || br.placeId) && !dest) errs.push(`${p}: review destination is invalid or placeId/reviewUrl mismatch`);
      if (br.status === 'active' && !dest) errs.push(`${p}: active branch needs a valid review destination`);
      if (br.status === 'active' && b.approval === 'approved' && !br.destinationVerified) errs.push(`${p}: approved business cannot go live with an unverified destination`);
    }
  }
  return errs;
}

/** Immutability ledger: a branch id, once issued, may never move to another business. */
export function validateLedger(cfg: Config, ledger: Record<string, string>): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const b of cfg.businesses) {
    for (const br of b.branches) {
      seen.add(br.id);
      if (!(br.id in ledger)) errs.push(`branch ${br.id}: missing from assignments.lock.json (run admin to register)`);
      else if (ledger[br.id] !== b.id) errs.push(`branch ${br.id}: was issued to ${ledger[br.id]}, now under ${b.id} (ids are never reused)`);
    }
  }
  for (const id of Object.keys(ledger)) if (!seen.has(id)) errs.push(`branch ${id}: issued earlier but removed from config (set status "disabled" instead of deleting)`);
  return errs;
}
