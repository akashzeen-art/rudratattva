import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchRemoteProduct, isCompleteProduct } from './productFetch.js'
import {
  filterCatalogChildren,
  filterCatalogProducts,
  collectFlattenedIdolProducts,
  FLATTEN_IDOL_TO_PRODUCTS_SLUGS,
} from '../src/data/catalogFilters.js'
import {
  mapRudrakshaChildrenToRegular,
  mapRudrakshaSectionImages,
} from '../src/data/rudrakshaRegular.js'
import { mapYantraSectionImages } from '../src/data/yantraImages.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
export const CATALOG_PATH = path.join(root, 'public', 'data', 'local-catalog.json')
export const DETAILS_DIR = path.join(root, 'public', 'data', 'product-details')

let catalog = null
let listingIndex = null
let mtimeMs = 0
let reloadTimer = null
let reloading = false
const inflight = new Map()

function detailFilePath(slug) {
  const safe = String(slug || '').replace(/^\//, '').replace(/[\\/]+/g, '__')
  return path.join(DETAILS_DIR, `${safe}.json`)
}

function ensureDetailsDir() {
  if (!fs.existsSync(DETAILS_DIR)) fs.mkdirSync(DETAILS_DIR, { recursive: true })
}

function mergeDetailFiles(data) {
  if (!fs.existsSync(DETAILS_DIR)) return
  const files = fs.readdirSync(DETAILS_DIR).filter(f => f.endsWith('.json'))
  if (!data.products) data.products = {}
  for (const file of files) {
    try {
      const parsed = JSON.parse(fs.readFileSync(path.join(DETAILS_DIR, file), 'utf8'))
      const slug = String(parsed?.info?.slug_value || parsed?.raw?.slug_value || '')
        .replace(/^\//, '')
      if (!slug || !parsed?.raw) continue
      // Prefer on-disk product-details (local image overlays) over bundled catalog stubs
      if (isCompleteProduct(parsed)) {
        data.products[slug] = {
          info: parsed.info || { level: 4, mainprodtype: parsed.raw.mainprodtype, slug_value: slug },
          raw: parsed.raw,
          synthesized: false,
        }
      } else if (!isCompleteProduct(data.products[slug])) {
        data.products[slug] = {
          info: parsed.info || { level: 4, mainprodtype: parsed.raw.mainprodtype, slug_value: slug },
          raw: parsed.raw,
          synthesized: false,
        }
      }
    } catch {
      /* skip bad file */
    }
  }
}

export function saveProductDetail(slug, product) {
  ensureDetailsDir()
  const payload = {
    info: product.info,
    raw: product.raw,
    fetchedAt: product.fetchedAt || new Date().toISOString(),
  }
  const tmp = `${detailFilePath(slug)}.tmp`
  const dest = detailFilePath(slug)
  fs.writeFileSync(tmp, JSON.stringify(payload))
  fs.renameSync(tmp, dest)
  if (catalog) {
    if (!catalog.products) catalog.products = {}
    catalog.products[slug] = {
      info: product.info,
      raw: product.raw,
      synthesized: false,
    }
  }
}

function buildListingIndex(data) {
  const index = new Map()
  for (const list of Object.values(data.listingProducts || {})) {
    for (const item of list || []) {
      const slug = String(item.slug || '').replace(/^\//, '')
      if (!slug || index.has(slug)) continue
      index.set(slug, item)
    }
  }
  for (const page of Object.values(data.pages || {})) {
    for (const item of page.products || []) {
      const slug = String(item.slug || item.to || '').replace(/^\//, '')
      if (!slug.startsWith('buy/') || index.has(slug)) continue
      index.set(slug, item)
    }
  }
  return index
}

/** Build a usable product detail from listing-row data when full detail was never fetched. */
export function synthesizeFromListing(listing) {
  const slug = String(listing.slug || '').replace(/^\//, '')
  const name = listing.name || 'Product'
  const img = listing.img || listing.image || ''
  const price = listing.price
  const priceRaw = listing.priceLabel || price
  return {
    info: {
      level: 4,
      mainprodtype: Number(listing.mainprodtype) || 5,
      slug_value: slug,
      product_list: false,
    },
    raw: {
      id: listing.id,
      product_id: listing.id,
      product_name: name,
      mainheadingtext: name,
      product_code: listing.sku || '',
      display_price: priceRaw,
      selling_price: price,
      ordering_price: price,
      image_url: img ? [{ path: img, img_alt_text: name }] : [],
      out_of_stock: listing.inStock === false,
      bead_size: listing.beadSize || '',
      size_grade: listing.grade || '',
      mainprodtype: Number(listing.mainprodtype) || 5,
      short_description: '',
      long_description: '',
      product_variant_data: [],
      puja_energization_list: [],
      certification_list: [],
      bundleproduct: [],
      pendentgroup: [],
      braceletgroup: [],
      designgrp: [],
      overall_rating: 0,
      review_count: 0,
    },
    synthesized: true,
  }
}

function applyFromDisk(force = false) {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Catalogue missing at ${CATALOG_PATH}`)
  }
  const stat = fs.statSync(CATALOG_PATH)
  if (!force && catalog && stat.mtimeMs === mtimeMs) {
    return catalog
  }
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8')
  const data = JSON.parse(raw)
  mergeDetailFiles(data)
  catalog = data
  listingIndex = buildListingIndex(data)
  mtimeMs = stat.mtimeMs
  return catalog
}

/** Non-blocking: serve in-memory snapshot; refresh in background when file changes. */
export function loadCatalog() {
  if (!catalog) {
    return applyFromDisk(true)
  }

  try {
    const stat = fs.statSync(CATALOG_PATH)
    if (stat.mtimeMs !== mtimeMs && !reloading) {
      if (reloadTimer) clearTimeout(reloadTimer)
      // Debounce — export rewrites often; don't thrash parse on every save.
      reloadTimer = setTimeout(() => {
        if (reloading) return
        reloading = true
        try {
          applyFromDisk(true)
          console.log(
            `[catalog] reloaded → ${Object.keys(catalog.products || {}).length} product details`
          )
        } catch (err) {
          // Mid-write / partial JSON — keep previous good snapshot
          console.warn('[catalog] reload skipped:', err.message)
        } finally {
          reloading = false
        }
      }, 1500)
    }
  } catch {
    /* keep cached */
  }

  return catalog
}

export function warmCatalog() {
  return applyFromDisk(true)
}

export function getListingIndex() {
  loadCatalog()
  return listingIndex
}

export function getMeta() {
  const data = loadCatalog()
  return {
    exportedAt: data.exportedAt || null,
    source: data.source || 'local-catalog',
    categories: Object.keys(data.categories || {}).length,
    pages: Object.keys(data.pages || {}).length,
    products: Object.keys(data.products || {}).length,
    listingRows: Object.values(data.listingProducts || {}).reduce(
      (n, a) => n + (a?.length || 0),
      0
    ),
    listingIndexSize: getListingIndex().size,
  }
}

export function findCategory(slugValue = '') {
  const data = loadCatalog()
  const slug = String(slugValue || '').replace(/^\//, '')
  return data.categories?.[slug] || null
}

export function findPage(slugValue = '') {
  const data = loadCatalog()
  const slug = String(slugValue || '').replace(/^\//, '')
  return data.pages?.[slug] || null
}

export function findListingProducts(slugValue = '') {
  const data = loadCatalog()
  const slug = String(slugValue || '').replace(/^\//, '')
  return data.listingProducts?.[slug] || data.pages?.[slug]?.products || []
}

export function findProduct(slugValue = '') {
  const data = loadCatalog()
  const slug = String(slugValue || '').replace(/^\//, '')

  // Disk product-details win (local /image/idol overlays are stored here)
  try {
    const file = detailFilePath(slug)
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      if (isCompleteProduct(parsed)) {
        if (!data.products) data.products = {}
        data.products[slug] = {
          info: parsed.info,
          raw: parsed.raw,
          synthesized: false,
        }
        return data.products[slug]
      }
    }
  } catch {
    /* fall through */
  }

  if (data.products?.[slug] && isCompleteProduct(data.products[slug])) {
    return data.products[slug]
  }

  if (data.products?.[slug]) return data.products[slug]

  const listing = getListingIndex().get(slug)
  if (listing) return synthesizeFromListing(listing)

  return null
}

/**
 * Return a complete product detail. If we only have a listing stub, copy the
 * full payload from the legacy admin API into our local product-details store.
 */
export async function ensureFullProduct(slugValue = '', hintMainprodtype = 0) {
  const slug = String(slugValue || '').replace(/^\//, '')
  const existing = findProduct(slug)
  if (isCompleteProduct(existing)) return existing

  if (inflight.has(slug)) return inflight.get(slug)

  const job = (async () => {
    const listing = getListingIndex().get(slug)
    const mainHint = Number(hintMainprodtype)
      || Number(existing?.info?.mainprodtype)
      || Number(listing?.mainprodtype)
      || 0
    const full = await fetchRemoteProduct(slug, mainHint)
    saveProductDetail(slug, full)
    console.log(`[product] copied full detail → ${slug}`)
    return {
      info: full.info,
      raw: full.raw,
      synthesized: false,
    }
  })()

  inflight.set(slug, job)
  try {
    return await job
  } finally {
    inflight.delete(slug)
  }
}

export function slugSearch(slugValue = '') {
  const slug = String(slugValue || '').replace(/^\//, '')
  const product = findProduct(slug)
  if (product?.info) return product.info

  const cat = findCategory(slug)
  if (cat) {
    return {
      mainprodtype: cat.mainprodtype,
      level: cat.level,
      product_list: Boolean(cat.product_list) || !(cat.children?.length),
      slug_value: slug,
    }
  }

  const page = findPage(slug)
  if (page) {
    return {
      mainprodtype: page.mainprodtype,
      level: page.level,
      product_list: page.mode === 'products',
      slug_value: slug,
    }
  }

  return null
}

function applyFilters(products = [], filters = {}) {
  let list = products
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
    list = [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
  } else if (filters.sortBy === 'price-desc') {
    list = [...list].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
  } else if (filters.sortBy === 'name-asc') {
    list = [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }
  return list
}

/** Lean paginated catalogue page — avoids shipping entire category payloads. */
export function getPageBundle(slugValue = '', pageNo = 1, pageSize = 12, filters = {}) {
  const slug = String(slugValue || '').replace(/^\//, '')
  const page = findPage(slug)
  const category = findCategory(slug)
  if (!page && !category) return null

  let mode = page?.mode || (category?.children?.length ? 'categories' : 'products')
  const mainprodtype = Number(page?.mainprodtype || category?.mainprodtype || 5)

  const flattened = collectFlattenedIdolProducts(slug, loadCatalog().pages || {})
  if (FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug) || (flattened && flattened.length)) {
    mode = 'products'
  }

  let sourceProducts = filterCatalogProducts(
    (flattened?.length
      ? flattened
      : (page?.products?.length ? page.products : findListingProducts(slug))) || [],
    slug,
    mainprodtype
  )
  let sourceChildren = filterCatalogChildren(
    page?.children || category?.children || [],
    slug,
    mainprodtype
  )
  sourceChildren = mapRudrakshaSectionImages(sourceChildren, slug)
  sourceChildren = mapYantraSectionImages(sourceChildren, slug)
  sourceChildren = mapRudrakshaChildrenToRegular(sourceChildren, slug)

  const allProducts = mode === 'products' ? applyFilters(sourceProducts, filters) : []

  const size = Math.max(1, Number(pageSize) || 12)
  const pageNum = Math.max(1, Number(pageNo) || 1)
  const start = (pageNum - 1) * size
  const slice = allProducts.slice(start, start + size)

  const intro = page?.intro
    ? {
        title: page.intro.title || category?.name || slug,
        description: page.intro.description || '',
        descriptionHtml: page.intro.descriptionHtml || '',
        tabs: page.intro.tabs || null,
        faqs: page.intro.faqs || [],
        breadcrumbs: page.intro.breadcrumbs || [],
        bannerImage: page.intro.bannerImage || category?.image || '',
        rawIntro: page.intro.rawIntro || null,
      }
    : null

  return {
    page: {
      mode,
      mainprodtype,
      level: Number(page?.level || category?.level || 2),
      intro,
      children: mode === 'categories' ? sourceChildren : [],
      products: slice,
      total: allProducts.length,
      pageNo: pageNum,
      pageSize: size,
      hasMore: start + size < allProducts.length,
      constant: page?.constant || null,
    },
    category: category
      ? {
          name: category.name,
          slug: category.slug,
          image: category.image || '',
          mainprodtype: category.mainprodtype,
          level: category.level,
          children: mode === 'categories' ? sourceChildren : undefined,
        }
      : null,
  }
}
