/**
 * Full catalogue export → public/data/local-catalog.json
 * Copies category listings + product details from admin.rudraksha-ratna.com
 * into our own snapshot (served by server/index.js). Supports resume.
 *
 *   node scripts/export-local-catalog.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outFile = path.join(root, 'public', 'data', 'local-catalog.json')
const progressFile = path.join(root, 'public', 'data', '.export-progress.json')
const hierarchyFile = path.join(root, 'public', 'data', 'product-hierarchy.json')

const API = 'https://admin.rudraksha-ratna.com/api/'

const DELAY_MS = 120
const DETAIL_CONCURRENCY = 2
const PAGE_SIZE_HINT = 12
const SAVE_EVERY = 100
const MAX_RETRIES = 4

const MAIN_HOMES = {
  'c/rudraksha': { name: 'Rudraksha', mainprodtype: 3, level: 1, rootKey: 'Rudraksha' },
  'c/ratna-vedic-gemstones': { name: 'Gemstones', mainprodtype: 2, level: 1, rootKey: 'Gemstone' },
  'c/yantras-and-mahayantras': { name: 'Yantras', mainprodtype: 4, level: 1, rootKey: 'Yantras' },
  'c/god-and-goddess-idols': { name: 'Idols', mainprodtype: 5, level: 1, rootKey: 'idols' },
  'c/online-puja-services': { name: 'Pujas', mainprodtype: 1, level: 1, rootKey: 'Puja' },
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function withRetry(fn, label = 'request') {
  let lastErr
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const wait = DELAY_MS * attempt * attempt
      console.warn(`${label} retry ${attempt}/${MAX_RETRIES}: ${err.message}`)
      await sleep(wait)
    }
  }
  throw lastErr
}

async function post(endpoint, body) {
  return withRetry(async () => {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(`${endpoint} → ${res.status}`)
      err.status = res.status
      err.payload = json
      throw err
    }
    return json
  }, `POST ${endpoint}`)
}

async function get(endpoint) {
  return withRetry(async () => {
    const res = await fetch(`${API}${endpoint}`, { headers: { Accept: 'application/json' } })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(`${endpoint} → ${res.status}`)
      err.status = res.status
      throw err
    }
    return json
  }, `GET ${endpoint}`)
}

function walkHierarchy(data) {
  const categories = {}
  const walk = (nodes, parentSlug = null, rootKey = '') => {
    for (const node of nodes || []) {
      const slug = String(node.slug_value || '').replace(/^\//, '')
      if (!slug) continue
      const children = (node.sub || []).map(s => ({
        label: s.name,
        to: `/${String(s.slug_value || '').replace(/^\//, '')}`,
        img: s.image || '',
        slug: String(s.slug_value || '').replace(/^\//, ''),
        level: Number(s.level) || 3,
        mainprodtype: Number(s.mainprodtype || node.mainprodtype) || 5,
      }))
      categories[slug] = {
        id: node.id,
        name: node.name,
        slug,
        level: Number(node.level) || 2,
        mainprodtype: Number(node.mainprodtype) || 5,
        image: node.image || '',
        parentSlug,
        rootKey,
        children,
        product_list: !children.length,
      }
      if (node.sub?.length) walk(node.sub, slug, rootKey)
    }
  }
  for (const [key, list] of Object.entries(data || {})) walk(list, null, key)
  return categories
}

function listEndpoint(info) {
  const level = Number(info.level)
  const main = Number(info.mainprodtype)
  const hasProducts = Boolean(info.product_list) || level === 3
  if (level === 1) {
    return hasProducts
      ? { mode: 'products', path: 'mobileapp/other-product-basedon-first-level' }
      : { mode: 'categories', path: 'mobileapp/other-dependent-maincategory' }
  }
  if (level === 2) {
    const map = {
      1: hasProducts ? 'mobileapp/puja-product-basedon-maincategory' : 'mobileapp/puja-dependent-sub-category',
      2: hasProducts ? 'mobileapp/gemstone-product-basedon-maincategory' : 'mobileapp/gemstone-dependent-sub-category',
      3: hasProducts ? 'mobileapp/rudraksha-product-basedon-maincategory' : 'mobileapp/rudraksha-dependent-sub-category',
      4: hasProducts ? 'mobileapp/yantra-product-basedon-maincategory' : 'mobileapp/yantra-dependent-sub-category',
      5: hasProducts ? 'mobileapp/other-product-basedon-maincategory' : 'mobileapp/other-dependent-sub-category',
    }
    const path = map[main]
    if (!path) return null
    return { mode: path.includes('product') ? 'products' : 'categories', path }
  }
  if (level === 3) {
    const map = {
      1: 'mobileapp/puja-product-basedon-subcategory',
      2: 'mobileapp/gemstone-product-basedon-subcategory',
      3: 'mobileapp/rudraksha-product-basedon-subcategory',
      4: 'mobileapp/yantra-product-basedon-maincategory',
      5: 'mobileapp/other-product-basedon-subcategory',
    }
    return map[main] ? { mode: 'products', path: map[main] } : null
  }
  return null
}

function productListBody(slug, mainType, pageNo) {
  const base = {
    slug_value: slug,
    max_price: '',
    min_price: '',
    sort_by: '',
    page_no: String(pageNo),
  }
  if (mainType === 'rudraksha') {
    return { ...base, size_grade: '', bead_max_size: '', bead_min_size: '' }
  }
  if (mainType === 'gemstone') {
    return {
      ...base,
      max_carat_weight: '',
      min_carat_weight: '',
      max_ratti_weight: '',
      min_ratti_weight: '',
      max_price_per_carat: '',
      min_price_per_carat: '',
      origin: '',
      shape_cut_style: '',
    }
  }
  if (mainType === 'yantra') return { ...base, diety: '' }
  if (mainType === 'other') return { ...base, filters: '' }
  return base
}

function detailPath(mainprodtype, slugValue) {
  switch (Number(mainprodtype)) {
    case 1: return `mobileapp/puja-product-detail?slug_value=${encodeURIComponent(slugValue)}`
    case 2: return `gemstonemaster/ssr-web-gemstone-product-detail?gemstoneproduct=${encodeURIComponent(slugValue)}`
    case 3: return `rudrakshamaster/ssr-web-rudraksha-product-detail?rudrakshproduct=${encodeURIComponent(slugValue)}`
    case 4: return `yantras/ssr-web-yantraproduct-detail?yantraproduct=${encodeURIComponent(slugValue)}`
    case 5: return `mobileapp/other-product-detail?slug_value=${encodeURIComponent(slugValue)}`
    default: return null
  }
}

function mapListProduct(item, mainprodtype, categorySlug) {
  const priceRaw = item.display_price ?? item.selling_price ?? item.ordering_price
  let price = null
  if (typeof priceRaw === 'number') price = priceRaw
  else if (typeof priceRaw === 'string' && priceRaw.trim()) {
    const n = Number(String(priceRaw).split(/[-–]/)[0].replace(/[^\d.]/g, ''))
    price = Number.isFinite(n) ? n : null
  }
  const slug = item.slug_value || ''
  return {
    id: item.product_id || item.id,
    name: item.product_name || item.name || 'Product',
    sku: item.product_code || '',
    img: item.image || '',
    price,
    priceLabel: priceRaw != null ? String(priceRaw) : '',
    beadSize: item.bead_size || '',
    grade: item.size_grade || '',
    inStock: !(item.out_of_stock === true),
    to: slug ? `/${slug}` : '#',
    slug,
    mainprodtype: Number(mainprodtype),
    categorySlug,
  }
}

function loadProgress() {
  if (!fs.existsSync(progressFile)) {
    return {
      doneListings: {},
      doneProducts: {},
      failedListings: {},
      failedProducts: {},
      buyQueue: [],
    }
  }
  return JSON.parse(fs.readFileSync(progressFile, 'utf8'))
}

function atomicWrite(filePath, contents) {
  const tmp = `${filePath}.tmp`
  fs.writeFileSync(tmp, contents)
  fs.renameSync(tmp, filePath)
}

function saveProgress(progress) {
  atomicWrite(progressFile, JSON.stringify(progress))
}

function saveCatalog(payload) {
  atomicWrite(outFile, JSON.stringify(payload))
}

async function fetchAllListingPages(slug, info) {
  const endpoint = listEndpoint(info)
  if (!endpoint) return { mode: 'categories', products: [], children: [], intro: null, total: 0, constant: null }

  if (endpoint.mode === 'categories') {
    const res = await post(endpoint.path, { slug_value: slug })
    const children = (res.data || []).map(item => ({
      label: item.name || 'Category',
      to: item.slug_value ? `/${String(item.slug_value).replace(/^\//, '')}` : '#',
      img: item.image || '',
      slug: String(item.slug_value || '').replace(/^\//, ''),
      level: Number(item.level) || 3,
      mainprodtype: Number(item.mainprodtype || info.mainprodtype),
    }))
    return {
      mode: 'categories',
      products: [],
      children,
      intro: res.intro_data || null,
      total: children.length,
      constant: null,
    }
  }

  const mainType = { 1: 'puja', 2: 'gemstone', 3: 'rudraksha', 4: 'yantra', 5: 'other' }[Number(info.mainprodtype)] || 'other'
  const products = []
  let intro = null
  let constant = null
  let total = 0
  let pageNo = 1
  let guard = 0

  while (guard < 200) {
    guard += 1
    const res = await post(endpoint.path, productListBody(slug, mainType, pageNo))
    if (res.status !== 'success') break
    if (!intro) intro = res.intro_data || null
    if (!constant) constant = res.constant || null
    total = Number(res.count) || total
    const batch = (res.data || []).map(item => mapListProduct(item, info.mainprodtype, slug))
    products.push(...batch)
    if (!batch.length) break
    if (products.length >= total && total > 0) break
    if (batch.length < PAGE_SIZE_HINT && (!total || products.length >= total)) break
    pageNo += 1
    await sleep(DELAY_MS)
  }

  return {
    mode: 'products',
    products,
    children: [],
    intro,
    total: total || products.length,
    constant,
  }
}

async function main() {
  console.log('Export source:', API)

  const hierarchy = JSON.parse(fs.readFileSync(hierarchyFile, 'utf8'))
  const categories = walkHierarchy(hierarchy.data || hierarchy)

  for (const [slug, meta] of Object.entries(MAIN_HOMES)) {
    const list = hierarchy.data?.[meta.rootKey] || []
    categories[slug] = {
      id: slug,
      name: meta.name,
      slug,
      level: meta.level,
      mainprodtype: meta.mainprodtype,
      image: '',
      parentSlug: null,
      rootKey: meta.rootKey,
      children: list.map(s => ({
        label: s.name,
        to: `/${String(s.slug_value || '').replace(/^\//, '')}`,
        img: s.image || '',
        slug: String(s.slug_value || '').replace(/^\//, ''),
        level: Number(s.level) || 2,
        mainprodtype: Number(s.mainprodtype) || meta.mainprodtype,
      })),
      product_list: false,
    }
  }

  const progress = loadProgress()
  const pages = {}
  const listingProducts = {}
  const productsBySlug = {}

  // Restore already-exported product details if catalog exists
  if (fs.existsSync(outFile)) {
    try {
      const prev = JSON.parse(fs.readFileSync(outFile, 'utf8'))
      Object.assign(productsBySlug, prev.products || {})
      Object.assign(pages, prev.pages || {})
      Object.assign(listingProducts, prev.listingProducts || {})
      console.log('Resumed previous export:', Object.keys(productsBySlug).length, 'products,', Object.keys(pages).length, 'pages')
    } catch {
      /* fresh */
    }
  }

  const allSlugs = [...new Set([...Object.keys(MAIN_HOMES), ...Object.keys(categories)])]
  console.log(`Categories to crawl: ${allSlugs.length}`)

  let listingDone = 0
  for (const slug of allSlugs) {
    if (progress.doneListings[slug]) {
      listingDone += 1
      continue
    }

    const cat = categories[slug]
    try {
      let info = null
      try {
        const infoRes = await post('pujaenergization/slug-search', { slug_value: slug })
        info = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data
      } catch {
        info = cat
          ? {
              mainprodtype: cat.mainprodtype,
              level: cat.level,
              product_list: Boolean(cat.product_list) || !(cat.children?.length),
            }
          : null
      }

      if (!info) {
        progress.failedListings[slug] = 'no-slug-info'
        progress.doneListings[slug] = true
        continue
      }

      // Hub categories with children: keep hierarchy children, still try API for richer data
      if (cat?.children?.length && Number(info.level) <= 2 && !info.product_list) {
        pages[slug] = {
          mode: 'categories',
          mainprodtype: Number(info.mainprodtype || cat.mainprodtype),
          level: Number(info.level || cat.level),
          intro: {
            title: cat.name,
            description: `Explore authentic ${cat.name} from Rudra Tattva.`,
            descriptionHtml: '',
            tabs: null,
            faqs: [],
            breadcrumbs: [{ label: cat.name }],
            bannerImage: cat.image || '',
            rawIntro: null,
          },
          children: cat.children,
          products: [],
          filterMeta: null,
          total: cat.children.length,
        }
        progress.doneListings[slug] = true
        listingDone += 1
        if (listingDone % SAVE_EVERY === 0) {
          saveProgress(progress)
          saveCatalog({
            exportedAt: new Date().toISOString(),
            source: 'frontend-local-catalog-full',
            categories,
            pages,
            products: productsBySlug,
            listingProducts,
          })
          console.log(`progress listings ${listingDone}/${allSlugs.length}`)
        }
        await sleep(DELAY_MS / 2)
        continue
      }

      const listed = await fetchAllListingPages(slug, info)
      listingProducts[slug] = listed.products
      pages[slug] = {
        mode: listed.mode,
        mainprodtype: Number(info.mainprodtype),
        level: Number(info.level),
        intro: {
          title: listed.intro?.mainheadingtext || listed.intro?.name || cat?.name || slug,
          description: '',
          descriptionHtml: listed.intro?.intro_content || '',
          tabs: null,
          faqs: [],
          breadcrumbs: [],
          bannerImage: listed.intro?.image || cat?.image || '',
          rawIntro: listed.intro,
        },
        children: listed.children.length ? listed.children : (cat?.children || []),
        products: listed.products,
        filterMeta: null,
        total: listed.total,
        constant: listed.constant,
      }

      for (const p of listed.products) {
        if (p.slug?.startsWith('buy/') && !progress.doneProducts[p.slug]) {
          progress.buyQueue.push({
            slug: p.slug,
            mainprodtype: p.mainprodtype || info.mainprodtype,
          })
        }
      }

      progress.doneListings[slug] = true
      listingDone += 1
      console.log(`listed ${slug} → ${listed.mode} ${listed.products.length || listed.children.length}`)

      if (listingDone % SAVE_EVERY === 0) {
        // dedupe queue
        const seen = new Set()
        progress.buyQueue = progress.buyQueue.filter(item => {
          if (seen.has(item.slug) || progress.doneProducts[item.slug] || productsBySlug[item.slug]) return false
          seen.add(item.slug)
          return true
        })
        saveProgress(progress)
        saveCatalog({
          exportedAt: new Date().toISOString(),
          source: 'frontend-local-catalog-full',
          categories,
          pages,
          products: productsBySlug,
          listingProducts,
        })
      }
      await sleep(DELAY_MS)
    } catch (err) {
      progress.failedListings[slug] = err.message
      progress.doneListings[slug] = true
      console.warn('list fail', slug, err.message)
      // fallback page from hierarchy
      if (cat) {
        pages[slug] = {
          mode: cat.children?.length ? 'categories' : 'products',
          mainprodtype: cat.mainprodtype,
          level: cat.level,
          intro: {
            title: cat.name,
            description: `Explore authentic ${cat.name} from Rudra Tattva.`,
            descriptionHtml: '',
            tabs: null,
            faqs: [],
            breadcrumbs: [{ label: cat.name }],
            bannerImage: cat.image || '',
            rawIntro: null,
          },
          children: cat.children || [],
          products: [],
          filterMeta: null,
          total: cat.children?.length || 0,
        }
      }
    }
  }

  // Ensure every category has a page entry
  for (const [slug, cat] of Object.entries(categories)) {
    if (pages[slug]) continue
    pages[slug] = {
      mode: cat.children?.length ? 'categories' : 'products',
      mainprodtype: cat.mainprodtype,
      level: cat.level,
      intro: {
        title: cat.name,
        description: `Explore authentic ${cat.name} from Rudra Tattva.`,
        descriptionHtml: '',
        tabs: null,
        faqs: [],
        breadcrumbs: [{ label: cat.name }],
        bannerImage: cat.image || '',
        rawIntro: null,
      },
      children: cat.children || [],
      products: listingProducts[slug] || [],
      filterMeta: null,
      total: (cat.children?.length || listingProducts[slug]?.length || 0),
    }
  }

  // Dedupe buy queue
  {
    const seen = new Set(Object.keys(productsBySlug))
    const queue = []
    for (const item of progress.buyQueue) {
      if (!item?.slug || seen.has(item.slug) || progress.doneProducts[item.slug]) continue
      seen.add(item.slug)
      queue.push(item)
    }
    // Also collect from all listingProducts
    for (const list of Object.values(listingProducts)) {
      for (const p of list || []) {
        if (!p.slug?.startsWith('buy/') || seen.has(p.slug) || progress.doneProducts[p.slug]) continue
        seen.add(p.slug)
        queue.push({ slug: p.slug, mainprodtype: p.mainprodtype })
      }
    }
    progress.buyQueue = queue
  }

  console.log(`Product details to fetch: ${progress.buyQueue.length}`)
  saveProgress(progress)

  // Re-queue products that previously failed with network errors so we can retry
  {
    const hardFails = new Set(['not-level-4', 'no-detail-path', 'no-data'])
    for (const [slug, reason] of Object.entries(progress.failedProducts || {})) {
      if (productsBySlug[slug]) continue
      if (hardFails.has(reason) || String(reason).startsWith('not-level')) continue
      delete progress.doneProducts[slug]
      delete progress.failedProducts[slug]
      progress.buyQueue.push({ slug, mainprodtype: 0 })
    }
  }

  async function fetchOneProduct(item) {
    const slug = item.slug
    if (!slug || productsBySlug[slug]) return
    if (progress.doneProducts[slug] && !progress.failedProducts[slug]) return

    let mainprodtype = Number(item.mainprodtype)
    if (!mainprodtype) {
      const infoRes = await post('pujaenergization/slug-search', { slug_value: slug })
      const found = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data
      if (!found || Number(found.level) !== 4) {
        progress.failedProducts[slug] = 'not-level-4'
        progress.doneProducts[slug] = true
        return
      }
      mainprodtype = Number(found.mainprodtype)
    }

    const info = { level: 4, mainprodtype, slug_value: slug }
    const dp = detailPath(mainprodtype, slug)
    if (!dp) {
      progress.failedProducts[slug] = 'no-detail-path'
      progress.doneProducts[slug] = true
      return
    }

    const json = await get(dp)
    if (json.status !== 'success' || !json.data) {
      progress.failedProducts[slug] = json.msg || 'no-data'
      progress.doneProducts[slug] = true
      return
    }

    productsBySlug[slug] = { info, raw: json.data }
    progress.doneProducts[slug] = true
    delete progress.failedProducts[slug]
  }

  let productDone = Object.keys(productsBySlug).length
  while (progress.buyQueue.length) {
    const batch = []
    while (batch.length < DETAIL_CONCURRENCY && progress.buyQueue.length) {
      const item = progress.buyQueue.shift()
      if (!item?.slug || productsBySlug[item.slug]) continue
      if (progress.doneProducts[item.slug] && !progress.failedProducts[item.slug]) continue
      batch.push(item)
    }
    if (!batch.length) continue

    const results = await Promise.allSettled(batch.map(fetchOneProduct))
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const slug = batch[i].slug
        const attempts = Number(batch[i].attempts || 0) + 1
        const reason = results[i].reason?.message || 'fetch-failed'
        if (attempts < MAX_RETRIES) {
          progress.buyQueue.push({ ...batch[i], attempts })
          console.warn('product soft-fail', slug, reason, `requeue ${attempts}`)
        } else {
          progress.failedProducts[slug] = reason
          progress.doneProducts[slug] = true
          console.warn('product fail', slug, reason)
        }
      }
    }

    productDone = Object.keys(productsBySlug).length
    if (productDone % 20 < DETAIL_CONCURRENCY) {
      console.log(`products ${productDone} (queue ${progress.buyQueue.length})`)
    }
    if (productDone % SAVE_EVERY < DETAIL_CONCURRENCY) {
      saveProgress(progress)
      saveCatalog({
        exportedAt: new Date().toISOString(),
        source: 'rudra-tattva-local-catalog',
        categories,
        pages,
        products: productsBySlug,
        listingProducts,
      })
    }
    await sleep(DELAY_MS)
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'rudra-tattva-local-catalog',
    categories,
    pages,
    products: productsBySlug,
    listingProducts,
    exportMeta: {
      failedListings: progress.failedListings,
      failedProducts: progress.failedProducts,
      listingCount: Object.keys(pages).length,
      productCount: Object.keys(productsBySlug).length,
    },
  }
  saveCatalog(payload)
  saveProgress(progress)
  console.log('DONE')
  console.log('categories', Object.keys(categories).length)
  console.log('pages', Object.keys(pages).length)
  console.log('listing product rows', Object.values(listingProducts).reduce((n, a) => n + (a?.length || 0), 0))
  console.log('product details', Object.keys(productsBySlug).length)
  console.log('failed listings', Object.keys(progress.failedListings).length)
  console.log('failed products', Object.keys(progress.failedProducts).length)
  console.log('Wrote', outFile)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
