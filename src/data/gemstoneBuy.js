/**
 * Natural Loose Gemstones: each stone type opens its primary /buy product
 * (price + Add to Cart) instead of the multi-SKU /k/ listing.
 * Product page shows the stone listing name/image — no carat wording.
 */
import map from './gemstoneBuyMap.js'

export const GEMSTONE_BUY_BY_CATEGORY = map.byCategory || {}
export const GEMSTONE_BUY_BY_PRODUCT = map.byProduct || {}

export const GEMSTONE_BUY_PARENT_SLUG = 'p/natural-jyotish-gemstones'

export function isGemstoneBuyParent(slug = '') {
  return String(slug || '').replace(/^\//, '') === GEMSTONE_BUY_PARENT_SLUG
}

export function getGemstoneBuyRedirect(slug = '') {
  const s = String(slug || '').replace(/^\//, '')
  return GEMSTONE_BUY_BY_CATEGORY[s] || null
}

export function getGemstoneDisplayForProduct(slug = '') {
  const s = String(slug || '').replace(/^\//, '')
  return GEMSTONE_BUY_BY_PRODUCT[s] || null
}

/** Remap Natural Loose Gemstone stone cards → primary buy product links. */
export function mapGemstoneChildrenToBuy(children = [], pageSlug = '') {
  if (!isGemstoneBuyParent(pageSlug)) return children || []
  return (children || []).map((child) => {
    const slug = String(child.slug || child.to || '')
      .replace(/^\//, '')
      .trim()
    const hit = GEMSTONE_BUY_BY_CATEGORY[slug]
    if (!hit?.productSlug) return child
    return {
      ...child,
      label: hit.displayName || child.label,
      to: `/${hit.productSlug}`,
      slug: hit.productSlug,
      img: hit.img || child.img || child.image,
    }
  })
}

/** Strip carat / weight sizing phrases from gemstone copy. */
export function stripGemstoneCaratCopy(text = '') {
  return String(text || '')
    .replace(/\s*[-–—|(]\s*\d+(?:\.\d+)?(?:\s*to\s*\d+(?:\.\d+)?)?\s*(?:carats?|cts?|cents?|ratti)\b[^)<]*/gi, '')
    .replace(/\b\d+(?:\.\d+)?(?:\s*to\s*\d+(?:\.\d+)?)?\s*(?:carats?|cts?|cents?|ratti)\b/gi, '')
    .replace(/\b(?:carat|ratti)\s*weight\s*:?\s*[^\n<]*/gi, '')
    .replace(/\bprice\s*\/?\s*carat\s*:?\s*[^\n<]*/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*[-–—|]\s*$/g, '')
    .trim()
}
