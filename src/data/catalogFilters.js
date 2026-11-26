import {
  filterPujaChildren,
  filterPujaProducts,
} from './pujaFilters.js'

/** Idols home — keep only these top-level material categories. */
export const KEPT_IDOL_CATEGORY_SLUGS = new Set([
  'p/god-statues-and-idols', // Brass Idols
  'p/bronze-idols-of-gods-and-goddesses',
  'p/silver-idols-gods-goddesses',
])

/**
 * Idol category pages that should skip deity sub-category cards
 * and show priced products directly (same as Bronze / Silver).
 */
export const FLATTEN_IDOL_TO_PRODUCTS_SLUGS = new Set([
  'p/god-statues-and-idols', // Brass Idols
])

/** Brass (and other) idol subcategories to hide. */
export const HIDDEN_IDOL_CATEGORY_SLUGS = new Set([
  'k/other-idols',
  'k/lord-buddha-idols',
  'k/lord-dattatreya-idols',
  'k/indra-idols',
  'k/lord-kartikeya-idols',
  'k/navagrahas-idols',
  'k/panchayatana-deities',
  'k/sai-baba-idols',
  'k/brass-shankh',
  'k/vastu-animal-figurines',
])

/** Specific idol products to hide (e.g. from Silver Idols). */
export const HIDDEN_IDOL_PRODUCT_SLUGS = new Set([
  'buy/925-silver-modak-for-ganesh-puja',
  'buy/925-silver-naag-snake',
  'buy/925-silver-tirupati-balaji-paduka',
  'buy/sheshnag-925-sterling-silver',
  'buy/majestic-peacock-925-sterling-silver-idol',
  'buy/kurma-925-sterling-silver',
  'buy/925-silver-naag-naagin-pair',
])

/** Yantras home — keep only these top-level categories. */
export const KEPT_YANTRA_CATEGORY_SLUGS = new Set([
  'p/yantras', // Yantra Sheets
  'p/siddh-meru-yantras', // Siddh Meru Yantras
])

/** Nested yantra categories still hidden when browsing kept sections. */
export const HIDDEN_YANTRA_CATEGORY_SLUGS = new Set([
  'p/siddh-shree-yantra', // Meru Shree Yantra
  'p/gemstone-shree-yantra', // Gemstone Meru Shree Yantra
  'k/golden-sheet-yantra',
  'k/silver-yantra',
  'p/pocket-yantras',
  'p/yantra-sticker',
  'k/yantras-on-silk',
])

/** Gemstones home — keep only Natural Loose Gemstones. */
export const KEPT_GEMSTONE_CATEGORY_SLUGS = new Set([
  'p/natural-jyotish-gemstones',
])

/** Natural Loose Gemstone stone types to hide. */
export const HIDDEN_GEMSTONE_CATEGORY_SLUGS = new Set([
  'k/rose-quartz-stone',
  'k/lapis-lazuli-stone',
  'k/agate-stone',
  'k/aquamarine-stone',
  'k/blue-topaz-stone',
  'k/green-tourmaline-stone',
  'k/heliodor-stone',
  'k/kidney-stone',
  'k/peridot-stone',
  'k/white-zircon-stone',
])

/** Rudraksha categories to hide. */
export const HIDDEN_RUDRAKSHA_CATEGORY_SLUGS = new Set([
  'k/indrakshi-mala',
  'k/siddha-rudraksha',
  'p/rudraksha-ratna-chakra-jewellery',
  'p/divine-rudraksha-rings',
  'p/rudraksha-beading-kit',
  'p/rudraksha-ratna-chakra-therapy',
  'k/gauri-shankar-rudraksha-bracelets',
  'k/17-mukhi-rudraksha-mala',
  'k/gauri-shankar-rudraksha-mala',
  'k/rudraksha-japa-mala',
  'k/rudraksha-silver-mala',
  'k/rudraksha-copper-mala',
  'k/rudraksha-gold-mala',
  // Remapped Regular product slugs (same items)
  'buy/gauri-shankar-wrist-mala',
  'buy/17-mukhi-rudraksha-925-silver-plain-caps-mala',
  'buy/gauri-shankar-kantha--java-beads',
  'buy/rudraksha-sumarni-mala---10-mm',
  'buy/rudraksha-mala--6mm-with-silver-flowers',
  'buy/kriya-mala',
  'buy/rudraksha-and-crystal-beads-in-pure-gold---7mm',
])

function itemSlug(item = {}) {
  return String(item.slug || item.to || '')
    .replace(/^\//, '')
    .trim()
}

function isIdolContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 5 || /idol|god-statues|goddess|silver-idols|bronze-idols/i.test(slug)
}

function isYantraContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 4 || /yantra/i.test(slug)
}

function isGemstoneContext(pageSlug = '', mainprodtype) {
  const mt = Number(mainprodtype)
  if (mt === 2) return true
  // Explicit other sections must not be treated as gemstones (e.g. gemstone yantras).
  if (mt === 1 || mt === 3 || mt === 4 || mt === 5) return false
  const slug = String(pageSlug || '').replace(/^\//, '')
  if (/yantra/i.test(slug)) return false
  return /gemstone|jyotish|ratna|sapphire|ruby|emerald|pearl|coral|stone/i.test(slug)
}

function isGemstoneRoot(pageSlug = '') {
  return String(pageSlug || '').replace(/^\//, '') === 'c/ratna-vedic-gemstones'
}

function isRudrakshaContext(pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  return Number(mainprodtype) === 3 || /rudraksha|mukhi|mala|kantha|siddha|indrakshi/i.test(slug)
}

export function filterIdolChildren(children = [], pageSlug = '', mainprodtype) {
  let list = children || []
  const slug = String(pageSlug || '').replace(/^\//, '')

  if (slug === 'c/god-and-goddess-idols') {
    list = list.filter(c => KEPT_IDOL_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  if (isIdolContext(slug, mainprodtype)) {
    list = list.filter(c => !HIDDEN_IDOL_CATEGORY_SLUGS.has(itemSlug(c)))
  }

  // Brass Idols (and similar): hide deity sub-category cards — products are flattened instead.
  if (FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug)) {
    return []
  }

  return list
}

/** Collect priced products from child idol categories (for flattened Brass listing). */
export function collectFlattenedIdolProducts(pageSlug = '', pagesBySlug = {}) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  if (!FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug)) return null

  const parent = pagesBySlug[slug]
  const childSlugs = (parent?.children || [])
    .map(c => itemSlug(c))
    .filter(s => s && !HIDDEN_IDOL_CATEGORY_SLUGS.has(s))

  const seen = new Set()
  const products = []
  for (const childSlug of childSlugs) {
    const childPage = pagesBySlug[childSlug]
    for (const item of childPage?.products || []) {
      const key = itemSlug(item) || String(item.id || '') || String(item.sku || '')
      if (!key || seen.has(key)) continue
      if (HIDDEN_IDOL_PRODUCT_SLUGS.has(itemSlug(item))) continue
      seen.add(key)
      products.push(item)
    }
  }
  return products
}

export function filterIdolProducts(products = [], pageSlug = '', mainprodtype) {
  if (!isIdolContext(pageSlug, mainprodtype)) return products || []
  const slug = String(pageSlug || '').replace(/^\//, '')
  let list = (products || []).filter(p => !HIDDEN_IDOL_PRODUCT_SLUGS.has(itemSlug(p)))
  // Brass / Bronze / Silver Idols: hide out-of-stock items from the listing
  if (
    slug === 'p/god-statues-and-idols' ||
    slug === 'p/bronze-idols-of-gods-and-goddesses' ||
    slug === 'p/silver-idols-gods-goddesses'
  ) {
    list = list.filter(p => p.inStock !== false && !p.out_of_stock)
  }
  // Brass Idols: keep a curated set of 70 products
  if (slug === 'p/god-statues-and-idols') {
    list = list.slice(0, 70)
  }
  return list
}

function isYantraRoot(pageSlug = '') {
  return String(pageSlug || '').replace(/^\//, '') === 'c/yantras-and-mahayantras'
}

export function filterYantraChildren(children = [], pageSlug = '', mainprodtype) {
  let list = children || []
  const slug = String(pageSlug || '').replace(/^\//, '')
  if (isYantraRoot(slug)) {
    list = list.filter(c => KEPT_YANTRA_CATEGORY_SLUGS.has(itemSlug(c)))
  }
  if (!isYantraContext(slug, mainprodtype)) return list
  return list.filter(c => !HIDDEN_YANTRA_CATEGORY_SLUGS.has(itemSlug(c)))
}

/** Max in-stock yantra products shown per category listing. */
export const YANTRA_PRODUCT_CAP = 60

/** Yantras: hide out-of-stock items and cap large category listings at 60. */
export function filterYantraProducts(products = [], pageSlug = '', mainprodtype) {
  if (!isYantraContext(pageSlug, mainprodtype)) return products || []
  let list = (products || []).filter(p => p.inStock !== false && !p.out_of_stock)
  if (list.length > YANTRA_PRODUCT_CAP) list = list.slice(0, YANTRA_PRODUCT_CAP)
  return list
}

export function filterGemstoneChildren(children = [], pageSlug = '', mainprodtype) {
  let list = children || []
  if (isGemstoneRoot(pageSlug)) {
    list = list.filter(c => KEPT_GEMSTONE_CATEGORY_SLUGS.has(itemSlug(c)))
  }
  if (isGemstoneContext(pageSlug, mainprodtype)) {
    list = list.filter(c => !HIDDEN_GEMSTONE_CATEGORY_SLUGS.has(itemSlug(c)))
  }
  return list
}

/** Max in-stock gemstone products shown per stone category listing. */
export const GEMSTONE_PRODUCT_CAP = 30

/** Gemstones: hide out-of-stock items and cap large stone listings. */
export function filterGemstoneProducts(products = [], pageSlug = '', mainprodtype) {
  if (!isGemstoneContext(pageSlug, mainprodtype)) return products || []
  let list = (products || []).filter(p => p.inStock !== false && !p.out_of_stock)
  if (list.length > GEMSTONE_PRODUCT_CAP) list = list.slice(0, GEMSTONE_PRODUCT_CAP)
  return list
}

export function filterRudrakshaChildren(children = [], pageSlug = '', mainprodtype) {
  if (!isRudrakshaContext(pageSlug, mainprodtype)) return children || []
  return (children || []).filter(c => !HIDDEN_RUDRAKSHA_CATEGORY_SLUGS.has(itemSlug(c)))
}

/** Apply section-specific catalogue filters. */
export function filterCatalogChildren(children = [], pageSlug = '', mainprodtype) {
  let list = children || []
  const slug = String(pageSlug || '').replace(/^\//, '')
  const isPuja = Number(mainprodtype) === 1 || /puja|gau|cow-donation/i.test(slug)

  if (isPuja) list = filterPujaChildren(list)
  list = filterIdolChildren(list, slug, mainprodtype)
  list = filterYantraChildren(list, slug, mainprodtype)
  list = filterGemstoneChildren(list, slug, mainprodtype)
  list = filterRudrakshaChildren(list, slug, mainprodtype)
  return list
}

export function filterCatalogProducts(products = [], pageSlug = '', mainprodtype) {
  const slug = String(pageSlug || '').replace(/^\//, '')
  const isPuja = Number(mainprodtype) === 1 || /puja|gau|cow-donation/i.test(slug)
  let list = products || []
  if (isPuja) list = filterPujaProducts(list, slug)
  list = filterIdolProducts(list, slug, mainprodtype)
  list = filterYantraProducts(list, slug, mainprodtype)
  list = filterGemstoneProducts(list, slug, mainprodtype)
  return list
}

export { filterPujaChildren, filterPujaProducts }
