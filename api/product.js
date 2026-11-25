/**
 * Vercel serverless: full product detail.
 * Prefers static /data/product-details when present; otherwise copies from admin API.
 */

const ADMIN = 'https://admin.rudraksha-ratna.com/api/'

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

function safeSlug(slug = '') {
  return String(slug).replace(/^\//, '').replace(/[\\/]+/g, '__')
}

async function fetchJson(url, init) {
  const res = await fetch(url, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return json
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  try {
    const slug = String(req.query.slug || '').replace(/^\//, '')
    if (!slug) {
      res.status(400).json({ status: 'error', msg: 'slug required' })
      return
    }

    // Static file on same deployment (if included)
    const staticUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/data/product-details/${safeSlug(slug)}.json`
    try {
      const staticRes = await fetch(staticUrl)
      if (staticRes.ok) {
        const data = await staticRes.json()
        if (data?.raw) {
          res.status(200).json({
            status: 'success',
            data: { info: data.info, raw: data.raw, synthesized: false },
          })
          return
        }
      }
    } catch {
      /* fall through */
    }

    const infoRes = await fetchJson(`${ADMIN}pujaenergization/slug-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ slug_value: slug }),
    })
    const found = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data
    if (!found || Number(found.level) !== 4) {
      res.status(404).json({ status: 'error', msg: 'Product not found' })
      return
    }

    const mainprodtype = Number(found.mainprodtype)
    const path = detailPath(mainprodtype, slug)
    if (!path) {
      res.status(404).json({ status: 'error', msg: 'Unsupported product type' })
      return
    }

    const detail = await fetchJson(`${ADMIN}${path}`, {
      headers: { Accept: 'application/json' },
    })
    if (detail.status !== 'success' || !detail.data) {
      res.status(404).json({ status: 'error', msg: detail.msg || 'no-data' })
      return
    }

    res.status(200).json({
      status: 'success',
      data: {
        info: {
          level: 4,
          mainprodtype,
          slug_value: slug,
          product_list: false,
        },
        raw: detail.data,
        synthesized: false,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', msg: err.message || 'Server error' })
  }
}
