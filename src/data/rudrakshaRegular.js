import map from './rudrakshaRegularMap.js'

export const RUDRAKSHA_REGULAR_BY_CATEGORY = map.byCategory || {}
export const RUDRAKSHA_REGULAR_BY_PRODUCT = map.byProduct || {}

export const RUDRAKSHA_REGULAR_PARENT_SLUGS = new Set([
  'p/rudraksha-1-mukhi---21-mukhi',
  'p/rudraksha-1-mukhi-21-mukhi-java-indonesia',
  'p/rudraksha-bracelets',
  'p/rudraksha-kantha-rudraksha-mala',
])

/** Top-level Rudraksha section cards (Nepal / Java / Bracelets / Malas). */
export const RUDRAKSHA_SECTION_IMAGES = {
  'c/rudraksha': '/image/rudraksh/01-nepal-rudraksha.jpg',
  'p/rudraksha-1-mukhi---21-mukhi': '/image/rudraksh/01-nepal-rudraksha.jpg',
  'p/rudraksha-1-mukhi-21-mukhi-java-indonesia': '/image/rudraksh/02-java-indonesian-rudraksha.jpg',
  'p/rudraksha-bracelets': '/image/rudraksh/03-rudraksha-bracelets.jpg',
  'p/rudraksha-kantha-rudraksha-mala': '/image/rudraksh/04-rudraksha-malas-kanthas.jpg',
}

export function isRudrakshaRegularParent(slug = '') {
  return RUDRAKSHA_REGULAR_PARENT_SLUGS.has(String(slug || '').replace(/^\//, ''))
}

/** @deprecated use isRudrakshaRegularParent */
export function isNepalOrJavaParent(slug = '') {
  return isRudrakshaRegularParent(slug)
}

export function getRegularRedirect(slug = '') {
  const s = String(slug || '').replace(/^\//, '')
  return RUDRAKSHA_REGULAR_BY_CATEGORY[s] || null
}

export function getRegularParentForProduct(slug = '') {
  const s = String(slug || '').replace(/^\//, '')
  return RUDRAKSHA_REGULAR_BY_PRODUCT[s] || null
}

/** Force Nepal/Java/Bracelets/Malas cards onto heading images. */
export function mapRudrakshaSectionImages(children = [], pageSlug = '') {
  const parent = String(pageSlug || '').replace(/^\//, '')
  if (parent !== 'c/rudraksha' && parent !== 'rudraksha') return children || []
  return (children || []).map((child) => {
    const slug = String(child.slug || child.to || '')
      .replace(/^\//, '')
      .trim()
    const img = RUDRAKSHA_SECTION_IMAGES[slug]
    if (!img) return child
    return { ...child, img, image: img }
  })
}

/** Remap mukhi/bracelet/mala category cards to Regular product links. */
export function mapRudrakshaChildrenToRegular(children = [], pageSlug = '') {
  if (!isRudrakshaRegularParent(pageSlug)) return children || []
  return (children || []).map(child => {
    const slug = String(child.slug || child.to || '')
      .replace(/^\//, '')
      .trim()
    const hit = RUDRAKSHA_REGULAR_BY_CATEGORY[slug]
    if (!hit) return child
    return {
      ...child,
      label: hit.productLabel || child.label,
      to: `/${hit.productSlug}`,
      slug: hit.productSlug,
      img: (hit.img?.startsWith('/image/') ? hit.img : null) || child.img || hit.img || child.image,
    }
  })
}
