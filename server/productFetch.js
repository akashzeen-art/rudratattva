/**
 * Fetch a single product detail from the legacy admin API and normalize it
 * into our local { info, raw } shape.
 */

const ADMIN = 'https://admin.rudraksha-ratna.com/api/'

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function detailPath(mainprodtype, slugValue) {
  switch (Number(mainprodtype)) {
    case 1:
      return `mobileapp/puja-product-detail?slug_value=${encodeURIComponent(slugValue)}`
    case 2:
      return `gemstonemaster/ssr-web-gemstone-product-detail?gemstoneproduct=${encodeURIComponent(slugValue)}`
    case 3:
      return `rudrakshamaster/ssr-web-rudraksha-product-detail?rudrakshproduct=${encodeURIComponent(slugValue)}`
    case 4:
      return `yantras/ssr-web-yantraproduct-detail?yantraproduct=${encodeURIComponent(slugValue)}`
    case 5:
      return `mobileapp/other-product-detail?slug_value=${encodeURIComponent(slugValue)}`
    default:
      return null
  }
}

async function adminGet(endpoint) {
  const res = await fetch(`${ADMIN}${endpoint}`, {
    headers: { Accept: 'application/json' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`${endpoint} → ${res.status}`)
    err.status = res.status
    throw err
  }
  return json
}

async function adminPost(endpoint, body) {
  const res = await fetch(`${ADMIN}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`${endpoint} → ${res.status}`)
    err.status = res.status
    throw err
  }
  return json
}

export function isCompleteProduct(product) {
  if (!product?.raw || product.synthesized) return false
  const d = product.raw
  const images = Array.isArray(d.image_url) ? d.image_url.length : 0
  const variants = Array.isArray(d.product_variant_data) ? d.product_variant_data.length : 0
  // Real detail payloads always include product id + at least an image or description/variants
  return Boolean(d.id || d.product_id)
    && (images > 0 || variants > 0 || d.long_description || d.short_description)
}

export async function fetchRemoteProduct(slugValue, hintMainprodtype = 0) {
  const slug = String(slugValue || '').replace(/^\//, '')
  if (!slug.startsWith('buy/')) {
    throw new Error('Not a product slug')
  }

  let mainprodtype = Number(hintMainprodtype) || 0
  if (!mainprodtype) {
    const infoRes = await adminPost('pujaenergization/slug-search', { slug_value: slug })
    const found = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data
    if (!found || Number(found.level) !== 4) {
      throw new Error('Slug is not a product')
    }
    mainprodtype = Number(found.mainprodtype)
  }

  const path = detailPath(mainprodtype, slug)
  if (!path) throw new Error('Unsupported product type')

  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const json = await adminGet(path)
      if (json.status !== 'success' || !json.data) {
        throw new Error(json.msg || 'no-data')
      }
      return {
        info: {
          level: 4,
          mainprodtype,
          slug_value: slug,
          product_list: false,
        },
        raw: json.data,
        synthesized: false,
        fetchedAt: new Date().toISOString(),
      }
    } catch (err) {
      lastErr = err
      await sleep(200 * attempt * attempt)
    }
  }
  throw lastErr
}
