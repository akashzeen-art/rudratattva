/**
 * Map public/image/yantra/sidhumeruyantra/* onto Siddh Meru Yantras products.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const IMG_DIR = path.join(ROOT, 'public', 'image', 'yantra', 'sidhumeruyantra')
const WEB_BASE = '/image/yantra/sidhumeruyantra'
const PAGE_SLUG = 'p/siddh-meru-yantras'
const PAGE_FILE = path.join(ROOT, 'public', 'data', 'pages', 'p__siddh-meru-yantras.json')
const CATALOG = path.join(ROOT, 'public', 'data', 'local-catalog.json')
const DETAILS_DIR = path.join(ROOT, 'public', 'data', 'product-details')

function norm(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/3d/g, '3d')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripExt(name) {
  return name.replace(/\.(jpe?g|png|webp|gif)$/i, '')
}

function stripIndex(stem) {
  return stem.replace(/^\d{1,3}-/, '')
}

function scoreMatch(a, b) {
  const x = norm(a)
  const y = norm(b)
  if (!x || !y) return 0
  if (x === y) return 100
  if (x.includes(y) || y.includes(x)) return 85
  const xs = new Set(x.split('-').filter(Boolean))
  const ys = y.split('-').filter(Boolean)
  let hit = 0
  for (const t of ys) if (xs.has(t)) hit += 1
  return Math.round((hit / Math.max(ys.length, 1)) * 70)
}

const files = fs.readdirSync(IMG_DIR).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
const images = files.map((file) => {
  const stem = stripExt(file)
  const bare = stripIndex(stem)
  return { file, stem: norm(stem), bare: norm(bare), url: `${WEB_BASE}/${file}` }
})

const bundle = JSON.parse(fs.readFileSync(PAGE_FILE, 'utf8'))
const products = bundle.page?.products || []

const assignments = new Map()
const used = new Set()

for (const img of images) {
  let best = null
  for (const p of products) {
    const slug = String(p.slug || '').replace(/^\//, '')
    const name = p.name || ''
    const keys = [name, slug.replace(/^buy\//, ''), slug]
    let s = 0
    for (const k of keys) {
      s = Math.max(s, scoreMatch(img.bare, k), scoreMatch(img.stem, k))
    }
    // Prefer exact lotus / non-lotus alignment
    const imgLotus = /on-lotus|double-lotus/.test(img.bare)
    const nameLotus = /on lotus|double lotus/i.test(name)
    if (imgLotus === nameLotus && s >= 50) s = Math.min(100, s + 10)
    if (imgLotus !== nameLotus && s < 90) s = Math.max(0, s - 15)
    if (!best || s > best.score) best = { product: p, score: s, slug }
  }
  if (!best || best.score < 60) continue
  if (assignments.has(best.slug)) {
    // keep higher score
    continue
  }
  // avoid double-assign same image
  if (used.has(img.file)) continue
  // if product already assigned, skip unless this score is better — handled by first-pass order
  assignments.set(best.slug, { url: img.url, score: best.score, file: img.file, name: best.product.name })
  used.add(img.file)
}

// Second pass: fill remaining products with unused images (higher threshold)
for (const img of images) {
  if (used.has(img.file)) continue
  let best = null
  for (const p of products) {
    const slug = String(p.slug || '').replace(/^\//, '')
    if (assignments.has(slug)) continue
    const name = p.name || ''
    let s = Math.max(scoreMatch(img.bare, name), scoreMatch(img.bare, slug.replace(/^buy\//, '')))
    const imgLotus = /on-lotus|double-lotus/.test(img.bare)
    const nameLotus = /on lotus|double lotus/i.test(name)
    if (imgLotus !== nameLotus) continue
    if (!best || s > best.score) best = { slug, score: s, name }
  }
  if (best && best.score >= 55) {
    assignments.set(best.slug, { url: img.url, score: best.score, file: img.file, name: best.name })
    used.add(img.file)
  }
}

let listingUpdated = 0
for (const p of products) {
  const slug = String(p.slug || '').replace(/^\//, '')
  const hit = assignments.get(slug)
  if (!hit) continue
  p.img = hit.url
  p.image = hit.url
  listingUpdated += 1
}
bundle.page.products = products
fs.writeFileSync(PAGE_FILE, JSON.stringify(bundle))

// local-catalog page + listingProducts
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'))
let catalogUpdated = 0
const page = catalog.pages?.[PAGE_SLUG]
if (page?.products) {
  for (const p of page.products) {
    const slug = String(p.slug || '').replace(/^\//, '')
    const hit = assignments.get(slug)
    if (!hit) continue
    p.img = hit.url
    p.image = hit.url
    catalogUpdated += 1
  }
}
if (catalog.listingProducts?.[PAGE_SLUG]) {
  for (const p of catalog.listingProducts[PAGE_SLUG]) {
    const slug = String(p.slug || '').replace(/^\//, '')
    const hit = assignments.get(slug)
    if (!hit) continue
    p.img = hit.url
    p.image = hit.url
  }
}
fs.writeFileSync(CATALOG, JSON.stringify(catalog))

// product-details: prefer local as primary, drop CDN when local exists
let detailsUpdated = 0
for (const [slug, hit] of assignments) {
  const file = path.join(DETAILS_DIR, `${slug.replace(/\//g, '__')}.json`)
  if (!fs.existsSync(file)) continue
  const detail = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!detail.raw) continue
  const name = detail.raw.product_name || hit.name || slug
  const entry = { path: hit.url, img_alt_text: name, alt_text: name }
  const imgs = Array.isArray(detail.raw.image_url) ? detail.raw.image_url : []
  const normalized = imgs
    .map((img) => {
      if (typeof img === 'string') return { path: img, img_alt_text: name, alt_text: name }
      return {
        path: img?.path || img?.image || img?.url || '',
        img_alt_text: img?.img_alt_text || img?.alt_text || name,
        alt_text: img?.alt_text || img?.img_alt_text || name,
      }
    })
    .filter((img) => img.path)
  const isRemote = (u) => /cloudfront\.net|rudraksha-ratna\.com/i.test(u)
  const isLocal = (u) => String(u).startsWith('/image/yantra/')
  const locals = [entry, ...normalized.filter((i) => isLocal(i.path) && i.path !== hit.url)]
  const others = normalized.filter((i) => !isLocal(i.path) && !isRemote(i.path))
  detail.raw.image_url = [...locals, ...others]
  if (detail.raw.image) detail.raw.image = hit.url
  fs.writeFileSync(file, JSON.stringify(detail))
  detailsUpdated += 1
}

const unmatchedProducts = products
  .map((p) => String(p.slug || '').replace(/^\//, ''))
  .filter((s) => s && !assignments.has(s))
const unmatchedImages = images.filter((i) => !used.has(i.file)).map((i) => i.file)

console.log(JSON.stringify({
  images: images.length,
  products: products.length,
  assigned: assignments.size,
  listingUpdated,
  catalogUpdated,
  detailsUpdated,
  unmatchedProducts: unmatchedProducts.slice(0, 10),
  unmatchedImages,
  sample: [...assignments.entries()].slice(0, 8).map(([slug, v]) => ({ slug, file: v.file, score: v.score })),
}, null, 2))
