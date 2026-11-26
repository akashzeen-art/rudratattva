/** Categories hidden from Pujas browsing (nav + listing). */
export const HIDDEN_PUJA_CATEGORY_SLUGS = new Set([
  'p/pujas-in-hindu-temples',
  'k/pujas-at-prayagraj',
  'k/pujas-in-other-famous-hindu-temples',
  'k/pujas-at-vindhyavasini-devi',
  'k/pujas-at-trimbakeshwar',
  'p/shradh-puja-rituals',
  'p/maha-anushthan-pujas',
  'k/chakra-pujas',
  'k/pujas-and-homas-for-guru',
  'k/ved-and-scriptural-pujas',
  'k/maha-pujas',
])

/** Products hidden across puja listings. */
export const HIDDEN_PUJA_PRODUCT_SLUGS = new Set([
  'buy/chakshumati-puja-for-eyesight',
  'buy/bhumi-daan-land-donation',
  'buy/ayush-homam',
  'buy/shashti-purthi-pooja',
  'buy/uttar-puja',
  'buy/shodashopachara-puja',
])

/** On Cow Donation Gau Seva, only keep these products. */
export const COW_DONATION_KEEP_SLUGS = new Set([
  'buy/gau-puja-and-seva',
  'buy/cow-donation---gau-dan',
])

const HIDDEN_LABEL_RE =
  /pujas in hindu temples|shradh puja|chakshumati|maha anushthan|chakra pujas|bhumi daan|ayush homam|sashtiapthapoorthi|shashti.?purthi|uttar puja|shodashopachara|revered saint and guru|ved and scriptural|maha pujas/i

function itemSlug(item = {}) {
  return String(item.slug || item.to || '')
    .replace(/^\//, '')
    .trim()
}

function itemLabel(item = {}) {
  return String(item.label || item.name || item.title || '')
}

export function isHiddenPujaCategory(item) {
  const slug = itemSlug(item)
  if (slug && HIDDEN_PUJA_CATEGORY_SLUGS.has(slug)) return true
  return HIDDEN_LABEL_RE.test(itemLabel(item))
}

export function isHiddenPujaProduct(item, pageSlug = '') {
  const slug = itemSlug(item)
  if (pageSlug === 'p/cow-donation-charity' || /cow.?donation|gau.?seva/i.test(pageSlug)) {
    return !COW_DONATION_KEEP_SLUGS.has(slug)
  }
  if (slug && HIDDEN_PUJA_PRODUCT_SLUGS.has(slug)) return true
  return HIDDEN_LABEL_RE.test(itemLabel(item))
}

export function filterPujaChildren(children = []) {
  return (children || []).filter(c => !isHiddenPujaCategory(c))
}

export function filterPujaProducts(products = [], pageSlug = '') {
  return (products || []).filter(p => !isHiddenPujaProduct(p, pageSlug))
}
