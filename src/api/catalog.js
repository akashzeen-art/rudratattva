// Catalogue via our local Gems & Jewels API (copied snapshot — no remote admin).
import { fetchPageBundle, fetchSlugInfo } from './localStore'
import {
  filterCatalogChildren,
  filterCatalogProducts,
  FLATTEN_IDOL_TO_PRODUCTS_SLUGS,
} from '../data/catalogFilters'
import {
  getRegularRedirect,
  mapRudrakshaChildrenToRegular,
  mapRudrakshaSectionImages,
} from '../data/rudrakshaRegular'
import { mapYantraSectionImages } from '../data/yantraImages'
import { getYantraProductImage } from '../data/yantraProductImages'
import {
  getGemstoneBuyRedirect,
  mapGemstoneChildrenToBuy,
} from '../data/gemstoneBuy'

const MAIN_TYPE = {
  1: 'puja',
  2: 'gemstone',
  3: 'rudraksha',
  4: 'yantra',
  5: 'other',
}

const MAIN_NAV = {
  1: { label: 'Pujas', to: '/pujas' },
  2: { label: 'Gemstones', to: '/p/natural-jyotish-gemstones' },
  3: { label: 'Rudraksha', to: '/rudraksha' },
  4: { label: 'Yantras', to: '/yantra' },
  5: { label: 'Idols', to: '/idols' },
}

export async function slugSearch(slugValue) {
  return fetchSlugInfo(slugValue)
}

function resolveEndpoint(slugInfo) {
  const level = Number(slugInfo?.level)
  const main = Number(slugInfo?.mainprodtype)
  const hasProducts = Boolean(slugInfo?.product_list) || level === 3

  if (level === 1) {
    return {
      mode: hasProducts ? 'products' : 'categories',
      path: hasProducts
        ? 'mobileapp/other-product-basedon-first-level'
        : 'mobileapp/other-dependent-maincategory',
    }
  }

  if (level === 2) {
    switch (main) {
      case 1:
        return {
          mode: hasProducts ? 'products' : 'categories',
          path: hasProducts
            ? 'mobileapp/puja-product-basedon-maincategory'
            : 'mobileapp/puja-dependent-sub-category',
        }
      case 2:
        return { mode: 'categories', path: 'mobileapp/gemstone-dependent-sub-category' }
      case 3:
        return { mode: 'categories', path: 'mobileapp/rudraksha-dependent-sub-category' }
      case 4:
        return {
          mode: hasProducts ? 'products' : 'categories',
          path: hasProducts
            ? 'mobileapp/yantra-product-basedon-maincategory'
            : 'mobileapp/yantra-dependent-sub-category',
        }
      case 5:
        return {
          mode: hasProducts ? 'products' : 'categories',
          path: hasProducts
            ? 'mobileapp/other-product-basedon-maincategory'
            : 'mobileapp/other-dependent-sub-category',
        }
      default:
        return null
    }
  }

  if (level === 3) {
    switch (main) {
      case 1:
        return { mode: 'products', path: 'mobileapp/puja-product-basedon-subcategory' }
      case 2:
        return { mode: 'products', path: 'mobileapp/gemstone-product-basedon-subcategory' }
      case 3:
        return { mode: 'products', path: 'mobileapp/rudraksha-product-basedon-subcategory' }
      case 4:
        return { mode: 'products', path: 'mobileapp/yantra-product-basedon-maincategory' }
      case 5:
        return { mode: 'products', path: 'mobileapp/other-product-basedon-subcategory' }
      default:
        return null
    }
  }

  return null
}

function strFilter(value) {
  if (value == null || value === '') return ''
  return String(value)
}

function productPayload(slugValue, mainType, pageNo = 1, filters = {}) {
  const base = {
    slug_value: slugValue,
    max_price: strFilter(filters.maxPrice),
    min_price: strFilter(filters.minPrice),
    sort_by: strFilter(filters.sortBy),
    page_no: String(pageNo),
  }

  if (mainType === 'rudraksha') {
    return {
      ...base,
      size_grade: strFilter(filters.sizeGrade),
      bead_max_size: strFilter(filters.beadMax),
      bead_min_size: strFilter(filters.beadMin),
    }
  }

  if (mainType === 'gemstone') {
    return {
      ...base,
      max_carat_weight: strFilter(filters.caratMax),
      min_carat_weight: strFilter(filters.caratMin),
      max_ratti_weight: strFilter(filters.rattiMax),
      min_ratti_weight: strFilter(filters.rattiMin),
      max_price_per_carat: strFilter(filters.pricePerCaratMax),
      min_price_per_carat: strFilter(filters.pricePerCaratMin),
      origin: strFilter(filters.origin),
      shape_cut_style: strFilter(filters.shape),
    }
  }

  if (mainType === 'yantra') {
    return { ...base, diety: strFilter(filters.diety) }
  }

  if (mainType === 'other') {
    return { ...base, filters: strFilter(filters.filters) }
  }

  return base
}

function mapFilterMeta(constant, mainType) {
  if (!constant || typeof constant !== 'object') {
    return {
      mainType,
      price: null,
      beadSize: null,
      sizeGrades: [],
      carat: null,
      origins: [],
      shapes: [],
    }
  }

  const num = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  const priceMin = num(constant.minprice)
  const priceMax = num(constant.maxprice)

  const origins = Array.isArray(constant.originlist)
    ? constant.originlist.map(o => (typeof o === 'string' ? o : o?.name || o?.origin || '')).filter(Boolean)
    : []
  const shapes = Array.isArray(constant.shape_cut_style_list)
    ? constant.shape_cut_style_list.map(s => (typeof s === 'string' ? s : s?.name || '')).filter(Boolean)
    : []

  return {
    mainType,
    price: priceMin != null && priceMax != null ? { min: priceMin, max: priceMax } : null,
    // Bead size / size grade / carat filters removed site-wide
    beadSize: null,
    sizeGrades: [],
    carat: null,
    origins,
    shapes,
  }
}

/** Map legacy rudraksha-ratna.com paths onto this app's routes. */
export function mapLegacyPath(rawPath = '/') {
  let path = String(rawPath || '/').trim() || '/'
  if (!path.startsWith('/')) path = `/${path}`
  const [pathname, query = ''] = path.split('?')
  const clean = pathname.replace(/\/+$/, '') || '/'
  const q = query ? `?${query}` : ''
  const lower = clean.toLowerCase()

  if (/^\/(buy|k|p|c)(\/|$)/i.test(clean)) return `${clean}${q}`
  if (/^\/cart$/i.test(clean)) return '/cart'
  if (/^\/contact(-us)?$/i.test(clean)) return '/contact-us'
  if (/^\/consultation(\/|$)/i.test(clean)) return '/consultation'
  if (/^\/rudraksha(\/|$)/i.test(clean)) return clean === '/rudraksha' ? '/rudraksha' : clean.replace(/^\/rudraksha/i, '/rudraksha')
  if (/^\/gemstones?(\/|$)/i.test(clean)) return '/p/natural-jyotish-gemstones'
  if (/^\/yantras?(\/|$)/i.test(clean)) return '/yantra'
  if (/^\/idols?(\/|$)/i.test(clean)) return '/idols'
  if (/^\/pujas?(\/|$)/i.test(clean)) return '/pujas'

  if (/^\/articles(\/|$)/i.test(clean)) {
    const slug = lower.replace(/^\/articles\/?/, '')
    if (!slug) return '/'
    if (/yantra/.test(slug)) return '/yantra'
    if (/rudraksha/.test(slug)) return '/rudraksha'
    if (/gem/.test(slug)) return '/p/natural-jyotish-gemstones'
    if (/puja|pooja/.test(slug)) return '/pujas'
    if (/idol|murti|god|goddess|deity|shiva|vishnu|ganesh|laxmi|lakshmi|durga|kali|hanuman|krishna|rama/.test(slug)) {
      return '/idols'
    }
    if (/consult|astrology|horoscope|pandit|sakhashree/.test(slug)) return '/consultation'
    return '/'
  }

  return `${clean}${q}`
}

/** Fully remove YouTube (no embeds, links, thumbnails, or bare URLs). */
export function stripYoutube(text = '') {
  let out = String(text)

  // iframes / embeds / objects pointing at YouTube
  out = out.replace(
    /<(?:iframe|embed|object)\b[^>]*(?:youtube\.com|youtu\.be|ytimg\.com)[^>]*>[\s\S]*?<\/(?:iframe|embed|object)>/gi,
    ''
  )
  out = out.replace(
    /<(?:iframe|embed|object)\b[^>]*(?:youtube\.com|youtu\.be|ytimg\.com)[^>]*\/?>/gi,
    ''
  )

  // Anchors to YouTube — remove entirely (no label left behind)
  out = out.replace(
    /<a\b[^>]*href=["'][^"']*(?:youtube\.com|youtu\.be|ytimg\.com)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
    ''
  )

  // YouTube thumbnail / preview images
  out = out.replace(
    /<img\b[^>]*(?:youtube\.com|youtu\.be|ytimg\.com)[^>]*\/?>/gi,
    ''
  )

  // Figures / wrappers that only hosted a video
  out = out.replace(
    /<(?:figure|div|p|span)\b[^>]*(?:youtube|yt-video|video-embed)[^>]*>[\s\S]*?<\/(?:figure|div|p|span)>/gi,
    ''
  )

  // Bare YouTube URLs left in copy (including HTML entities like &amp;)
  out = out.replace(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?[\w=&;%-]*|embed\/[\w-]+|shorts\/[\w-]+|live\/[\w-]+)|youtu\.be\/[\w?-]+)/gi,
    ''
  )

  return out
}

/** Strip absolute legacy-site hosts and rewrite hrefs to local routes. */
export function rewriteLegacyUrls(text = '') {
  let out = String(text)

  // Absolute / protocol-relative legacy hosts → local path
  out = out.replace(
    /(?:https?:)?\/\/(?:www\.)?rudraksha-ratna\.com(\/[^"'>\s]*)?/gi,
    (_, path = '/') => mapLegacyPath(path || '/')
  )

  // Bare host in href/src (www.rudraksha-ratna.com/…)
  out = out.replace(
    /(\b(?:href|src)=["'])(?:www\.)?rudraksha-ratna\.com(\/[^"']*)?(["'])/gi,
    (_, pre, path = '/', post) => `${pre}${mapLegacyPath(path || '/')}${post}`
  )

  // Relative /articles links that would 404 here
  out = out.replace(
    /href=(["'])\/?articles(\/[^"']*)?\1/gi,
    (_, quote, rest = '') => `href=${quote}${mapLegacyPath(`/articles${rest || ''}`)}${quote}`
  )

  return out
}

/** Drop legacy CMS “Read more” links that point nowhere useful on this site. */
function stripReadMore(html = '') {
  return String(html || '')
    .replace(/<a\b[^>]*>[\s\S]*?read\s*more[\s\S]*?<\/a>/gi, '')
    .replace(/(?:<br\s*\/?>|\s)*read\s*more(?:\s*<br\s*\/?>)?/gi, '')
}

/** Drop “Click to see video of …” CTAs (and their video links) from CMS copy. */
function stripVideoCta(html = '') {
  return String(html || '')
    .replace(
      /(?:<br\s*\/?>|\s|&nbsp;)*click\s+to\s+see\s+video\s+of\s*(?:<a\b[^>]*>[\s\S]*?<\/a>)?/gi,
      '',
    )
    .replace(/(?:<br\s*\/?>|\s|&nbsp;)*click\s+to\s+see\s+video(?:\s+of)?(?:\s*<br\s*\/?>)?/gi, '')
}

/** Replace legacy brand names + outbound legacy-site links in API / CMS copy. */
export function brandify(text = '') {
  return rewriteLegacyUrls(
    stripYoutube(
      stripVideoCta(
        stripReadMore(
          String(text)
            .replace(/Rudra\s*Tattva/gi, 'Gems & Jewels')
            .replace(/Rudra\s*Centre/gi, 'Gems & Jewels')
            .replace(/Rudra\s*Center/gi, 'Gems & Jewels')
            .replace(/Rudraksha\s*Ratna(?!\s*Chakra)/gi, 'Gems & Jewels')
        )
      )
    )
  )
}

/** Remove CMS spacer paragraphs (&nbsp; / empty) that create large gaps above tab content. */
export function stripLeadingEmptyHtml(html = '') {
  let out = String(html)
  const emptyBlock =
    /^(?:\s|&nbsp;|<br\s*\/?>|<p[^>]*>\s*(?:&nbsp;|\s|<br\s*\/?>)*<\/p>|<div[^>]*>\s*(?:&nbsp;|\s|<br\s*\/?>)*<\/div>)+/i
  while (emptyBlock.test(out)) {
    out = out.replace(emptyBlock, '')
  }
  return out.trim()
}

function stripHtml(html = '') {
  return brandify(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatListingPrice(priceRaw) {
  if (priceRaw == null || priceRaw === '') return null
  if (typeof priceRaw === 'number') {
    return Number.isFinite(priceRaw) ? priceRaw.toLocaleString('en-IN') : null
  }
  const text = String(priceRaw).trim()
  if (!text) return null
  if (/[-–]/.test(text)) {
    return text
      .split(/\s*[-–]\s*/)
      .map(part => {
        const n = Number(String(part).replace(/[^\d.]/g, ''))
        return Number.isFinite(n) ? n.toLocaleString('en-IN') : part.trim()
      })
      .join(' - ')
  }
  const n = Number(text.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n.toLocaleString('en-IN') : text
}

function mapProduct(item) {
  const priceRaw = item.display_price ?? item.selling_price ?? item.ordering_price
  let price = null
  if (typeof priceRaw === 'number') price = priceRaw
  else if (typeof priceRaw === 'string' && priceRaw.trim()) {
    const n = Number(String(priceRaw).split(/[-–]/)[0].replace(/[^\d.]/g, ''))
    price = Number.isFinite(n) ? n : null
  }

  const slug = item.slug_value ? `/${item.slug_value}` : '#'
  return {
    id: item.product_id || item.id,
    name: brandify(item.product_name || item.name || 'Product'),
    sku: item.product_code || '',
    img: item.image || '/images/shared/logo.jpg',
    price,
    priceLabel: formatListingPrice(priceRaw),
    beadSize: '',
    grade: '',
    inStock: !(item.out_of_stock === true),
    to: slug,
  }
}

function mapCategory(item) {
  const slug = item.slug_value || ''
  return {
    label: item.name || 'Category',
    to: slug.startsWith('/') ? slug : `/${slug}`,
    img: item.image || '/images/shared/logo.jpg',
  }
}

function mapIntro(intro, fallbackTitle) {
  if (!intro) {
    return {
      title: fallbackTitle,
      description: `Explore authentic ${fallbackTitle} from Gems & Jewels.`,
      tabs: null,
      faqs: [],
      breadcrumbs: [],
    }
  }

  const tabs = intro.tabs
    ? [1, 2, 3, 4, 5].map(n => ({
        heading: brandify(intro.tabs[`tab${n}_heading`] || '').trim(),
        html: stripLeadingEmptyHtml(brandify(intro.tabs[`tab${n}_description`] || '')),
      })).filter(t =>
        t.heading
        && stripHtml(t.html)
        && !/size\s*grade|bead\s*size|carat|dimension|ratti|size\s*guide/i.test(t.heading)
      )
    : null

  const faqs = Array.isArray(intro.faqs)
    ? intro.faqs.map(f => ({
        q: brandify(f.question || f.q || ''),
        a: stripHtml(f.answer || f.a || ''),
        aHtml: brandify(f.answer || f.a || ''),
      })).filter(f => f.q)
    : []

  const level = Number(intro.level)
  const crumbs = []
  const currentLabel = intro.third_level_name || intro.mainheadingtext || intro.name || fallbackTitle

  const firstNavTo = (slug = '') => {
    if (slug.includes('rudraksha')) return '/rudraksha'
    if (slug.includes('gemstone') || slug.includes('jyotish') || slug.includes('ratna-vedic')) return '/p/natural-jyotish-gemstones'
    if (slug.includes('yantra')) return '/yantra'
    if (slug.includes('idol') || slug.includes('god')) return '/idols'
    if (slug.includes('puja')) return '/pujas'
    return MAIN_NAV[Number(intro.mainprodtype)]?.to
  }

  // Level-1 category homes are a single crumb (current page).
  if (level === 1) {
    crumbs.push({ label: currentLabel })
  } else {
    if (intro.first_level_name) {
      crumbs.push({
        label: intro.first_level_name,
        to: firstNavTo(intro.first_level_slug || ''),
      })
    } else {
      const main = MAIN_NAV[Number(intro.mainprodtype)]
      if (main) crumbs.push(main)
    }

    if (intro.second_level_name && intro.second_level_slug) {
      const isCurrentSecond = !intro.third_level_name && (
        intro.second_level_name === intro.name
        || Number(intro.level) === 2
      )
      if (isCurrentSecond) {
        crumbs.push({ label: intro.second_level_name })
      } else {
        crumbs.push({
          label: intro.second_level_name,
          to: `/${intro.second_level_slug}`,
        })
        if (intro.third_level_name || (intro.name && intro.name !== intro.second_level_name)) {
          crumbs.push({ label: currentLabel })
        }
      }
    } else if (currentLabel) {
      crumbs.push({ label: currentLabel })
    }
  }

  return {
    title: brandify(intro.mainheadingtext || intro.name || fallbackTitle),
    description: stripHtml(intro.intro_content) || `Explore authentic ${fallbackTitle} from Gems & Jewels.`,
    descriptionHtml: stripLeadingEmptyHtml(brandify(intro.intro_content || '')),
    tabs,
    faqs,
    breadcrumbs: crumbs,
    bannerImage: intro.image || '',
  }
}

function applyLocalFilters(products = [], filters = {}) {
  let list = [...products]

  const minPrice = Number(filters.minPrice)
  const maxPrice = Number(filters.maxPrice)
  if (Number.isFinite(minPrice) && filters.minPrice !== '') {
    list = list.filter(p => Number(p.price) >= minPrice)
  }
  if (Number.isFinite(maxPrice) && filters.maxPrice !== '') {
    list = list.filter(p => Number(p.price) <= maxPrice)
  }

  const beadMin = Number(filters.beadMin)
  const beadMax = Number(filters.beadMax)
  if (Number.isFinite(beadMin) && filters.beadMin !== '') {
    list = list.filter(p => Number.parseFloat(p.beadSize) >= beadMin)
  }
  if (Number.isFinite(beadMax) && filters.beadMax !== '') {
    list = list.filter(p => Number.parseFloat(p.beadSize) <= beadMax)
  }

  if (filters.sizeGrade) {
    const grade = String(filters.sizeGrade).toLowerCase()
    list = list.filter(p => String(p.grade || '').toLowerCase() === grade)
  }

  if (filters.sortBy === 'price-asc') {
    list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
  } else if (filters.sortBy === 'price-desc') {
    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
  } else if (filters.sortBy === 'name-asc') {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }

  return list
}

function normalizeLocalProduct(item) {
  if (!item) return null
  if (item.to || item.sku != null || item.priceLabel != null) {
    const slug = String(item.slug || item.to || '')
      .replace(/^\//, '')
      .trim()
    const localYantra = getYantraProductImage(slug)
    return {
      ...item,
      name: brandify(item.name || 'Product'),
      to: item.to?.startsWith('/') ? item.to : item.slug ? `/${item.slug}` : item.to || '#',
      img: localYantra || item.img || item.image || '/images/shared/logo.jpg',
      image: localYantra || item.image || item.img || '/images/shared/logo.jpg',
    }
  }
  const mapped = mapProduct(item)
  const slug = String(mapped.to || '').replace(/^\//, '')
  const localYantra = getYantraProductImage(slug)
  if (localYantra) {
    mapped.img = localYantra
    mapped.image = localYantra
  }
  return mapped
}

/**
 * Load a category / product-list page from our local catalogue API (paginated).
 */
export async function loadCatalogPage(slugValue, pageNo = 1, filters = {}) {
  const slug = String(slugValue || '').replace(/^\//, '')

  const regular = getRegularRedirect(slug)
  if (regular?.productSlug) {
    return {
      redirectTo: `/${regular.productSlug}`,
      mode: 'redirect',
      mainType: 'rudraksha',
      mainprodtype: 3,
      level: 3,
      intro: {
        title: regular.productLabel,
        description: '',
        descriptionHtml: '',
        tabs: null,
        faqs: [],
        breadcrumbs: [],
        bannerImage: '',
      },
      products: [],
      children: [],
      total: 0,
      pageNo: 1,
      hasMore: false,
      filterMeta: null,
    }
  }

  const gemBuy = getGemstoneBuyRedirect(slug)
  if (gemBuy?.productSlug) {
    return {
      redirectTo: `/${gemBuy.productSlug}`,
      mode: 'redirect',
      mainType: 'gemstone',
      mainprodtype: 2,
      level: 3,
      intro: {
        title: gemBuy.productLabel,
        description: '',
        descriptionHtml: '',
        tabs: null,
        faqs: [],
        breadcrumbs: [],
        bannerImage: gemBuy.img || '',
      },
      products: [],
      children: [],
      total: 0,
      pageNo: 1,
      hasMore: false,
      filterMeta: null,
    }
  }

  const bundle = await fetchPageBundle(slug, pageNo, filters)
  const page = bundle?.page
  const cat = bundle?.category

  if (!page && !cat) {
    throw new Error('Slug not found')
  }

  let mode = page?.mode
    || (cat?.children?.length ? 'categories' : 'products')
  const mainprodtype = Number(page?.mainprodtype || cat?.mainprodtype || 5)
  // Brass Idols: show priced products, not deity sub-category cards
  if (FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug)) mode = 'products'
  const level = Number(page?.level || cat?.level || 2)
  const mainType = MAIN_TYPE[mainprodtype] || 'other'
  const fallbackTitle = slug.split('/').pop()?.replace(/-/g, ' ') || 'Catalogue'

  const intro = page?.intro?.rawIntro
    ? mapIntro(page.intro.rawIntro, fallbackTitle)
    : {
        title: brandify(page?.intro?.title || cat?.name || fallbackTitle),
        description: page?.intro?.description
          || `Explore authentic ${brandify(cat?.name || fallbackTitle)} from Gems & Jewels.`,
        descriptionHtml: stripLeadingEmptyHtml(brandify(page?.intro?.descriptionHtml || '')),
        tabs: page?.intro?.tabs || null,
        faqs: page?.intro?.faqs || [],
        breadcrumbs: page?.intro?.breadcrumbs?.length
          ? page.intro.breadcrumbs
          : [{ label: brandify(page?.intro?.title || cat?.name || fallbackTitle) }],
        bannerImage: page?.intro?.bannerImage || cat?.image || '',
      }

  let children = mode === 'categories'
    ? (page?.children || cat?.children || []).map(c => ({
        label: brandify(c.label || c.name || 'Category'),
        to: c.to?.startsWith('/') ? c.to : `/${String(c.slug || c.to || '').replace(/^\//, '')}`,
        img: c.img || c.image || '/images/shared/logo.jpg',
        slug: String(c.slug || c.to || '').replace(/^\//, ''),
      }))
    : []

  let products = mode === 'products'
    ? (page?.products || []).map(normalizeLocalProduct).filter(Boolean)
    : []

  children = filterCatalogChildren(children, slug, mainprodtype)
  children = mapRudrakshaSectionImages(children, slug)
  children = mapYantraSectionImages(children, slug)
  children = mapRudrakshaChildrenToRegular(children, slug)
  children = mapGemstoneChildrenToBuy(children, slug)
  products = filterCatalogProducts(products, slug, mainprodtype)

  return {
    mode,
    mainType,
    mainprodtype,
    level,
    intro,
    products,
    children,
    total: mode === 'categories'
      ? children.length
      : (Number(page?.total) || products.length),
    pageNo: Number(page?.pageNo || pageNo) || 1,
    hasMore: Boolean(page?.hasMore),
    filterMeta: mode === 'products' ? mapFilterMeta(page?.constant || null, mainType) : null,
  }
}

export async function loadMoreProducts(slugValue, mainprodtype, pageNo, filters = {}) {
  void mainprodtype
  const page = await loadCatalogPage(slugValue, pageNo, filters)
  if (page.mode !== 'products') {
    return { products: [], hasMore: false, pageNo }
  }
  return {
    products: page.products,
    pageNo: page.pageNo,
    total: page.total,
    hasMore: page.hasMore,
    filterMeta: page.filterMeta,
  }
}
