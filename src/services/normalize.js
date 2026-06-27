/**
 * Response normalization layer (anti-corruption layer).
 *
 * The backend returns raw Supabase rows: snake_case keys + nested relation
 * objects (e.g. `branch: { id, name }`). The frontend UI everywhere expects
 * flat camelCase fields (e.g. `branchName`, `branchId`). This module bridges
 * the two so components never have to change.
 *
 *   { branch_id, created_date, branch: { id, name } }
 *     -> { branchId, createdDate, branchName, branchId }
 */

const camelKey = (k) => k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())

/** Hoist nested relation objects into the flat fields the UI consumes. */
function flattenRelations(o) {
  // branch: { id, name } -> branchName / branchId
  if (o.branch && typeof o.branch === 'object') {
    o.branchName ??= o.branch.name
    o.branchId ??= o.branch.id
    delete o.branch
  }
  // staff: { id, name, avatarColor } -> staffName / staffId / avatarColor
  if (o.staff && typeof o.staff === 'object') {
    o.staffName ??= o.staff.name
    o.staffId ??= o.staff.id
    if (o.staff.avatarColor) o.avatarColor ??= o.staff.avatarColor
    delete o.staff
  }
  // lead: { id, name, refCode } -> leadName / leadId / leadRef
  if (o.lead && typeof o.lead === 'object') {
    o.leadName ??= o.lead.name
    o.leadId ??= o.lead.id
    o.leadRef ??= o.lead.refCode
    delete o.lead
  }
  // user: { id, name, avatarColor } -> userName + activity-feed `user`/avatarColor.
  // IMPORTANT: only collapse a *relation reference* (activity-feed rows) to a name
  // string. A full identity object — the /auth/login payload `{ user: {...} }` with
  // email/role/permissions — MUST be preserved intact, or the logged-in user would
  // lose its id/email/branchId and fall back to placeholder data.
  if (o.user && typeof o.user === 'object') {
    const isIdentity =
      o.user.email !== undefined || o.user.role !== undefined || o.user.permissions !== undefined
    o.userName ??= o.user.name
    if (o.user.avatarColor) o.avatarColor ??= o.user.avatarColor
    if (!isIdentity) o.user = o.user.name
  }
  // product: { id, name, unit } -> product (name string) / productId / unit
  if (o.product && typeof o.product === 'object') {
    o.productId ??= o.product.id
    o.unit ??= o.product.unit
    o.productName ??= o.product.name
    o.product = o.product.name
  }
  return o
}

/** Recursively camelCase keys and flatten relations through the whole tree. */
export function normalize(val) {
  if (Array.isArray(val)) return val.map(normalize)
  if (val && typeof val === 'object' && !(val instanceof Date)) {
    const out = {}
    for (const [k, v] of Object.entries(val)) out[camelKey(k)] = normalize(v)
    return flattenRelations(out)
  }
  return val
}

export default normalize
