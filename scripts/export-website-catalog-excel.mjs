/**
 * Export a sir-ready Excel of products currently shown on the Gems & Jewels website
 * (after catalogue filters + Rudraksha Regular redirects).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import {
  filterCatalogChildren,
  filterCatalogProducts,
  HIDDEN_IDOL_PRODUCT_SLUGS,
} from '../src/data/catalogFilters.js'
import {
  RUDRAKSHA_REGULAR_BY_CATEGORY,
  RUDRAKSHA_REGULAR_PARENT_SLUGS,
  mapRudrakshaChildrenToRegular,
} from '../src/data/rudrakshaRegular.js'
import {
  getGemstoneDisplayForProduct,
  mapGemstoneChildrenToBuy,
} from '../src/data/gemstoneBuy.js'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const catalogPath = path.join(root, 'public', 'data', 'local-catalog.json')
const pagesDir = path.join(root, 'public', 'data', 'pages')
const detailsDir = path.join(root, 'public', 'data', 'product-details')
const outDir = path.join(root, 'exports')
const outFile = path.join(
  outDir,
  `Gems-and-Jewels-Website-Catalog-${new Date().toISOString().slice(0, 10)}.xlsx`
)

const MAIN_SECTIONS = [
  {
    sheet: 'Rudraksha',
    section: 'Rudraksha',
    rootSlug: 'c/rudraksha',
    mainprodtype: 3,
  },
  {
    sheet: 'Gemstones',
    section: 'Gemstones',
    rootSlug: 'c/ratna-vedic-gemstones',
    mainprodtype: 2,
  },
  {
    sheet: 'Yantras',
    section: 'Yantras',
    rootSlug: 'c/yantras-and-mahayantras',
    mainprodtype: 4,
  },
  {
    sheet: 'Idols',
    section: 'Idols',
    rootSlug: 'c/god-and-goddess-idols',
    mainprodtype: 5,
  },
  {
    sheet: 'Pujas',
    section: 'Pujas',
    rootSlug: 'c/online-puja-services',
    mainprodtype: 1,
  },
]

function slugOf(item = {}) {
  return String(item.slug || item.to || '')
    .replace(/^\//, '')
    .trim()
}

function labelOf(item = {}) {
  return String(item.label || item.name || item.title || item.product_name || '').trim()
}

function loadJson(file) {
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function loadPage(slug) {
  const pageFile = path.join(pagesDir, `${slug.replace(/\//g, '__')}.json`)
  const fromFile = loadJson(pageFile)
  if (fromFile?.page) return fromFile
  return null
}

function detailPath(slug) {
  return path.join(detailsDir, `${String(slug).replace(/^\//, '').replace(/[\\/]+/g, '__')}.json`)
}

function parsePrice(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const first = Number(String(raw).split(/[-–]/)[0].replace(/[^\d.]/g, ''))
    return Number.isFinite(first) ? first : null
  }
  return null
}

function getProductMeta(slug, listingItem, catalogProducts) {
  const clean = String(slug || '').replace(/^\//, '')
  const listing = listingItem || {}
  const catalogHit = catalogProducts?.[clean] || null
  const detail = loadJson(detailPath(clean))
  const raw = detail?.raw || catalogHit?.raw || null

  const gemDisplay = getGemstoneDisplayForProduct(clean)
  const name =
    gemDisplay?.displayName ||
    labelOf(listing) ||
    raw?.product_name ||
    raw?.mainheadingtext ||
    catalogHit?.info?.name ||
    clean

  const code = listing.sku || listing.productCode || raw?.product_code || ''
  const basePrice =
    parsePrice(listing.price) ??
    parsePrice(listing.priceLabel) ??
    parsePrice(raw?.display_price) ??
    parsePrice(raw?.selling_price)

  const variants = Array.isArray(raw?.product_variant_data) ? raw.product_variant_data : []
  const variantRows = variants.map(v => {
    const vPrice = parsePrice(v.display_price ?? v.selling_price ?? v.price)
    const vName = String(v.variant_name || v.name || '').trim()
    const dash = vName.lastIndexOf('-')
    const option = dash > -1 ? vName.slice(dash + 1).trim() : vName
    return {
      option: option || 'Option',
      price: vPrice,
      inStock: !v.out_of_stock,
      beadSize: v.bead_size || '',
    }
  })

  let minPrice = basePrice
  let maxPrice = basePrice
  if (variantRows.length) {
    const prices = variantRows.map(v => v.price).filter(p => p != null)
    if (prices.length) {
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
    }
  }

  return {
    slug: clean,
    name,
    code,
    basePrice,
    minPrice,
    maxPrice,
    inStock: listing.inStock ?? (raw ? !raw.out_of_stock : ''),
    grade: listing.grade || raw?.size_grade || '',
    beadSize: listing.beadSize || raw?.bead_size || '',
    origin: raw?.origin || '',
    carat: listing.caratWeight || raw?.carat_weight || '',
    variants: variantRows,
  }
}

function childrenOf(pageBundle, pageSlug, mainprodtype) {
  const page = pageBundle?.page || {}
  const cat = pageBundle?.category || {}
  let kids = filterCatalogChildren(
    page.children || cat.children || [],
    pageSlug,
    mainprodtype
  )
  kids = mapRudrakshaChildrenToRegular(kids, pageSlug)
  kids = mapGemstoneChildrenToBuy(kids, pageSlug)
  return kids
}

function formatListingPrice(meta) {
  const min = meta.minPrice
  const max = meta.maxPrice
  const base = meta.basePrice
  if (min != null && max != null && min !== max) return `${min} - ${max}`
  if (base != null) return base
  if (min != null) return min
  return ''
}

function productsOf(pageBundle, pageSlug, mainprodtype) {
  const page = pageBundle?.page || {}
  return filterCatalogProducts(page.products || [], pageSlug, mainprodtype)
}

function walkSection({ section, rootSlug, mainprodtype }, catalogProducts, rows, seen) {
  const queue = [{ slug: rootSlug, pathLabels: [section] }]
  const visited = new Set()

  while (queue.length) {
    const { slug, pathLabels } = queue.shift()
    if (!slug || visited.has(slug)) continue
    visited.add(slug)

    // Rudraksha Regular parents: children are already product links
    if (RUDRAKSHA_REGULAR_PARENT_SLUGS.has(slug)) {
      const page = loadPage(slug)
      const kids = childrenOf(page, slug, mainprodtype)
      for (const child of kids) {
        const productSlug = slugOf(child)
        if (!productSlug.startsWith('buy/')) continue
        if (seen.has(productSlug)) continue
        seen.add(productSlug)
        const meta = getProductMeta(productSlug, child, catalogProducts)
        pushProductRows(rows, {
          section,
          categoryPath: [...pathLabels, labelOf(child) || meta.name].join(' › '),
          meta,
        })
      }
      continue
    }

    // Direct Regular product from map (if someone queues a k/ mukhi)
    if (RUDRAKSHA_REGULAR_BY_CATEGORY[slug]) {
      const hit = RUDRAKSHA_REGULAR_BY_CATEGORY[slug]
      if (!seen.has(hit.productSlug)) {
        seen.add(hit.productSlug)
        const meta = getProductMeta(hit.productSlug, { label: hit.productLabel }, catalogProducts)
        pushProductRows(rows, {
          section,
          categoryPath: [...pathLabels, hit.productLabel].join(' › '),
          meta,
        })
      }
      continue
    }

    const page = loadPage(slug)
    if (!page) continue

    const kids = childrenOf(page, slug, mainprodtype)
    const products = productsOf(page, slug, mainprodtype)

    for (const child of kids) {
      const childSlug = slugOf(child)
      if (!childSlug) continue
      if (childSlug.startsWith('buy/')) {
        if (HIDDEN_IDOL_PRODUCT_SLUGS.has(childSlug)) continue
        if (seen.has(childSlug)) continue
        seen.add(childSlug)
        const meta = getProductMeta(childSlug, child, catalogProducts)
        pushProductRows(rows, {
          section,
          categoryPath: [...pathLabels, labelOf(child) || meta.name].join(' › '),
          meta,
        })
      } else {
        queue.push({
          slug: childSlug,
          pathLabels: [...pathLabels, labelOf(child) || childSlug],
        })
      }
    }

    for (const prod of products) {
      const productSlug = slugOf(prod)
      if (!productSlug.startsWith('buy/')) continue
      if (HIDDEN_IDOL_PRODUCT_SLUGS.has(productSlug)) continue
      if (seen.has(productSlug)) continue
      seen.add(productSlug)
      const meta = getProductMeta(productSlug, prod, catalogProducts)
      pushProductRows(rows, {
        section,
        categoryPath: pathLabels.join(' › '),
        meta,
      })
    }
  }
}

function pushProductRows(rows, { section, categoryPath, meta }) {
  rows.push({
    Section: section,
    'Category Path': categoryPath,
    'Product Name': meta.name,
    'Base / Listing Price (INR)': formatListingPrice(meta),
  })
}

function sheetFromRows(rows) {
  return XLSX.utils.json_to_sheet(rows)
}

function parseListedPriceNums(value) {
  const parts = String(value ?? '').split(/\s*-\s*/)
  return parts
    .map(p => Number(String(p).replace(/[^\d.]/g, '')))
    .filter(n => Number.isFinite(n) && n > 0)
}

function summaryRows(allRows) {
  const bySection = new Map()
  for (const row of allRows) {
    const key = row.Section
    if (!bySection.has(key)) {
      bySection.set(key, { count: 0, prices: [] })
    }
    const bucket = bySection.get(key)
    bucket.count += 1
    bucket.prices.push(...parseListedPriceNums(row['Base / Listing Price (INR)']))
  }

  const allPrices = allRows.flatMap(r => parseListedPriceNums(r['Base / Listing Price (INR)']))

  const out = [
    {
      Section: 'ALL',
      Products: allRows.length,
      'Lowest Price (INR)': allPrices.length ? Math.min(...allPrices) : '',
      'Highest Price (INR)': allPrices.length ? Math.max(...allPrices) : '',
      Notes: 'Live website products only (after filters). Columns: Section, Category Path, Product Name, Base / Listing Price.',
    },
  ]

  for (const [section, bucket] of bySection) {
    out.push({
      Section: section,
      Products: bucket.count,
      'Lowest Price (INR)': bucket.prices.length ? Math.min(...bucket.prices) : '',
      'Highest Price (INR)': bucket.prices.length ? Math.max(...bucket.prices) : '',
      Notes: '',
    })
  }
  return out
}

console.log('Loading catalogue…')
const catalog = loadJson(catalogPath)
if (!catalog) throw new Error('Missing public/data/local-catalog.json')

const catalogProducts = catalog.products || {}
const allRows = []
const seen = new Set()

for (const section of MAIN_SECTIONS) {
  console.log('Scanning', section.section, '…')
  const before = allRows.length
  walkSection(section, catalogProducts, allRows, seen)
  console.log(`  +${allRows.length - before} price-point rows (${seen.size} unique products so far)`)
}

fs.mkdirSync(outDir, { recursive: true })
const wb = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(wb, sheetFromRows(summaryRows(allRows)), 'Summary')
XLSX.utils.book_append_sheet(wb, sheetFromRows(allRows), 'All Products')

for (const section of MAIN_SECTIONS) {
  const rows = allRows.filter(r => r.Section === section.section)
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), section.sheet)
}

XLSX.writeFile(wb, outFile)
console.log('\nExcel ready:')
console.log(outFile)
console.log(`Unique products: ${seen.size}`)
console.log(`Price-point rows: ${allRows.length}`)
