/**
 * Rudra Tattva local catalogue API.
 * Serves data copied into public/data/local-catalog.json — no remote admin calls.
 *
 *   npm run api
 *   → http://localhost:4000
 */

import http from 'node:http'
import { URL } from 'node:url'
import {
  ensureFullProduct,
  findCategory,
  findProduct,
  getMeta,
  getPageBundle,
  loadCatalog,
  slugSearch,
  warmCatalog,
} from './catalogDb.js'

const PORT = Number(process.env.PORT) || 4000

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Cache-Control': 'public, max-age=15',
  })
  res.end(json)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function normalizeSlug(value) {
  return String(value || '').replace(/^\//, '').trim()
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    })
    return res.end()
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    let pathname = url.pathname.replace(/\/+$/, '') || '/'
    if (pathname.startsWith('/api')) pathname = pathname.slice(4) || '/'

    // Touch cache (non-blocking reload if export updated the file)
    loadCatalog()

    if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
      return send(res, 200, { status: 'ok', service: 'rudra-tattva-api', ...getMeta() })
    }

    if (req.method === 'GET' && pathname === '/meta') {
      return send(res, 200, { status: 'success', data: getMeta() })
    }

    if (req.method === 'GET' && pathname === '/page') {
      const slug = normalizeSlug(url.searchParams.get('slug'))
      const pageNo = Number(url.searchParams.get('page') || url.searchParams.get('page_no') || 1)
      const pageSize = Number(url.searchParams.get('pageSize') || 12)
      const filters = {
        minPrice: url.searchParams.get('minPrice') || '',
        maxPrice: url.searchParams.get('maxPrice') || '',
        beadMin: url.searchParams.get('beadMin') || '',
        beadMax: url.searchParams.get('beadMax') || '',
        sizeGrade: url.searchParams.get('sizeGrade') || '',
        sortBy: url.searchParams.get('sortBy') || '',
      }
      const bundle = getPageBundle(slug, pageNo, pageSize, filters)
      if (!bundle) return send(res, 404, { status: 'error', msg: 'Page not found' })
      return send(res, 200, { status: 'success', data: bundle })
    }

    if (req.method === 'GET' && pathname === '/product') {
      const slug = normalizeSlug(url.searchParams.get('slug'))
      let product = findProduct(slug)
      if (!product) return send(res, 404, { status: 'error', msg: 'Product not found' })
      try {
        // Copy full remote detail (images, variants/sizes, descriptions) into our API once
        product = await ensureFullProduct(slug, product.info?.mainprodtype)
      } catch (err) {
        console.warn('[product] full-detail fetch failed', slug, err.message)
        // Fall back to whatever we already have (listing stub)
      }
      return send(res, 200, { status: 'success', data: product })
    }

    if (
      (req.method === 'GET' && pathname === '/slug-search')
      || (req.method === 'POST' && pathname === '/pujaenergization/slug-search')
    ) {
      let slug = normalizeSlug(url.searchParams.get('slug'))
      if (req.method === 'POST') {
        const body = await readBody(req)
        slug = normalizeSlug(body.slug_value || body.slug || slug)
      }
      const info = slugSearch(slug)
      if (!info) return send(res, 404, { status: 'error', msg: 'Slug not found', data: [] })
      return send(res, 200, { status: 'success', data: [info] })
    }

    if (req.method === 'GET' && pathname === '/category') {
      const slug = normalizeSlug(url.searchParams.get('slug'))
      const category = findCategory(slug)
      if (!category) return send(res, 404, { status: 'error', msg: 'Category not found' })
      return send(res, 200, { status: 'success', data: category })
    }

    send(res, 404, { status: 'error', msg: `No route ${pathname}` })
  } catch (err) {
    console.error(err)
    send(res, 500, { status: 'error', msg: err.message || 'Server error' })
  }
})

server.listen(PORT, () => {
  try {
    warmCatalog()
    const meta = getMeta()
    console.log(`Rudra Tattva API on http://localhost:${PORT}`)
    console.log(
      `Catalogue: ${meta.pages} pages, ${meta.products} product details, ${meta.listingRows} listing rows`
    )
  } catch (err) {
    console.warn('API started but catalogue not loaded yet:', err.message)
    console.log(`Rudra Tattva API on http://localhost:${PORT}`)
  }
})
