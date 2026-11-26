/**
 * Force local /image/idol thumbs onto idol product-detail galleries
 * (listing pages already use local paths; details often still start with CloudFront).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PAGES_DIR = path.join(ROOT, 'public', 'data', 'pages')
const DETAILS_DIR = path.join(ROOT, 'public', 'data', 'product-details')
const CATALOG = path.join(ROOT, 'public', 'data', 'local-catalog.json')

const IDOL_PAGE_SLUGS = [
  'p/god-statues-and-idols',
  'p/bronze-idols-of-gods-and-goddesses',
  'p/silver-idols-gods-goddesses',
]

function isLocalIdol(url = '') {
  return String(url).startsWith('/image/idol/')
}

function isRemoteCdn(url = '') {
  return /cloudfront\.net|rudraksha-ratna\.com|admin\.rudraksha/i.test(String(url))
}

const slugToLocal = new Map()

function collectFromProducts(list = []) {
  for (const p of list) {
    const slug = String(p.slug || p.slug_value || p.to || '').replace(/^\//, '')
    const img = p.image || p.img || ''
    if (!slug || !isLocalIdol(img)) continue
    slugToLocal.set(slug, img)
  }
}

for (const slug of IDOL_PAGE_SLUGS) {
  const file = path.join(PAGES_DIR, `${slug.replace(/\//g, '__')}.json`)
  if (!fs.existsSync(file)) continue
  const bundle = JSON.parse(fs.readFileSync(file, 'utf8'))
  collectFromProducts(bundle.page?.products || [])
}

if (fs.existsSync(CATALOG)) {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'))
  for (const slug of IDOL_PAGE_SLUGS) {
    collectFromProducts(catalog.pages?.[slug]?.products || [])
  }
  if (catalog.listingProducts) {
    for (const list of Object.values(catalog.listingProducts)) {
      collectFromProducts(list)
    }
  }
}

let updated = 0
let missingDetail = 0
let alreadyOk = 0

for (const [slug, localUrl] of slugToLocal) {
  const file = path.join(DETAILS_DIR, `${slug.replace(/\//g, '__')}.json`)
  if (!fs.existsSync(file)) {
    missingDetail += 1
    continue
  }
  const detail = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!detail.raw) continue

  const name = detail.raw.product_name || slug
  const entry = { path: localUrl, img_alt_text: name, alt_text: name }
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

  const withoutRemote = normalized.filter((img) => !isRemoteCdn(img.path) || isLocalIdol(img.path))
  const locals = withoutRemote.filter((img) => isLocalIdol(img.path))
  const others = withoutRemote.filter((img) => !isLocalIdol(img.path))

  const hasPrimaryLocal = isLocalIdol(normalized[0]?.path) && normalized[0].path === localUrl
  if (hasPrimaryLocal && locals.length && !normalized.some((img) => isRemoteCdn(img.path))) {
    alreadyOk += 1
    continue
  }

  const next = [
    entry,
    ...locals.filter((img) => img.path !== localUrl),
    ...others,
  ]
  detail.raw.image_url = next
  // Keep a flat thumbnail field in sync when present
  if (detail.raw.image) detail.raw.image = localUrl
  if (detail.raw.thumbnail) detail.raw.thumbnail = localUrl

  fs.writeFileSync(file, JSON.stringify(detail))
  updated += 1
}

console.log(JSON.stringify({
  mappedProducts: slugToLocal.size,
  updated,
  alreadyOk,
  missingDetail,
  sample: [...slugToLocal.entries()].slice(0, 5),
}, null, 2))
