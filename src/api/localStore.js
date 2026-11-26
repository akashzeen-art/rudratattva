/**
 * Catalogue client.
 * Production (Vercel): /api/* serverless + /data/pages static shards.
 * Local dev: Vite proxies /api → Node server on :4000.
 */

import {
  filterCatalogChildren,
  filterCatalogProducts,
  FLATTEN_IDOL_TO_PRODUCTS_SLUGS,
} from '../data/catalogFilters'
import { mapRudrakshaSectionImages } from '../data/rudrakshaRegular'
import { mapYantraSectionImages } from '../data/yantraImages'

function safeSlug(slug = '') {
  return String(slug || '').replace(/^\//, '').replace(/[\\/]+/g, '__')
}

async function apiGet(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.msg || `API ${res.status}`)
    err.status = res.status
    err.payload = json
    throw err
  }
  return json
}

function buildPageQuery(slugValue, pageNo = 1, filters = {}) {
  const slug = String(slugValue || '').replace(/^\//, '')
  const params = new URLSearchParams()
  params.set('slug', slug)
  params.set('page', String(pageNo || 1))
  params.set('pageSize', '12')
  for (const key of ['minPrice', 'maxPrice', 'beadMin', 'beadMax', 'sizeGrade', 'sortBy']) {
    if (filters[key] != null && filters[key] !== '') params.set(key, String(filters[key]))
  }
  return params.toString()
}

function applyFilters(products = [], filters = {}) {
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

async function fetchStaticPageBundle(slugValue = '', pageNo = 1, filters = {}) {
  const slug = String(slugValue || '').replace(/^\//, '')
  const res = await fetch(`/data/pages/${safeSlug(slug)}.json`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Page not found')
  const bundle = await res.json()
  const mainprodtype = Number(bundle.page?.mainprodtype || bundle.category?.mainprodtype || 5)
  let children = mapYantraSectionImages(
    mapRudrakshaSectionImages(
      filterCatalogChildren(
        bundle.page?.children || bundle.category?.children || [],
        slug,
        mainprodtype
      ),
      slug,
    ),
    slug,
  )
  let products = filterCatalogProducts(bundle.page?.products || [], slug, mainprodtype)
  // Brass Idols etc.: prefer pre-flattened products on the shard; hide sub-category cards.
  if (FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug)) {
    children = []
    if (bundle.page) bundle.page.mode = 'products'
  }
  const all = applyFilters(products, filters)
  const size = 12
  const page = Math.max(1, Number(pageNo) || 1)
  const start = (page - 1) * size
  return {
    page: {
      ...bundle.page,
      mode: FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug) ? 'products' : bundle.page?.mode,
      children,
      products: all.slice(start, start + size),
      total: all.length,
      pageNo: page,
      pageSize: size,
      hasMore: start + size < all.length,
    },
    category: bundle.category
      ? {
          ...bundle.category,
          children: FLATTEN_IDOL_TO_PRODUCTS_SLUGS.has(slug)
            ? []
            : filterCatalogChildren(bundle.category.children || [], slug, mainprodtype),
        }
      : null,
  }
}

export async function fetchPageBundle(slugValue = '', pageNo = 1, filters = {}) {
  try {
    const json = await apiGet(`/api/page?${buildPageQuery(slugValue, pageNo, filters)}`)
    return json.data
  } catch {
    // Vercel / offline API → static shards
    return fetchStaticPageBundle(slugValue, pageNo, filters)
  }
}

export async function fetchProductBundle(slugValue = '') {
  const slug = String(slugValue || '').replace(/^\//, '')
  try {
    const json = await apiGet(`/api/product?slug=${encodeURIComponent(slug)}`)
    return json.data
  } catch {
    const res = await fetch(`/data/product-details/${safeSlug(slug)}.json`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('Product not found')
    const data = await res.json()
    return {
      info: data.info,
      raw: data.raw,
      synthesized: false,
    }
  }
}

export async function fetchSlugInfo(slugValue = '') {
  const slug = String(slugValue || '').replace(/^\//, '')
  try {
    const json = await apiGet(`/api/slug-search?slug=${encodeURIComponent(slug)}`)
    const data = Array.isArray(json.data) ? json.data[0] : json.data
    return data || null
  } catch {
    if (slug.startsWith('buy/')) {
      const product = await fetchProductBundle(slug)
      return product?.info || null
    }
    const bundle = await fetchStaticPageBundle(slug, 1, {})
    return {
      mainprodtype: bundle.page?.mainprodtype || 5,
      level: bundle.page?.level || 2,
      product_list: bundle.page?.mode === 'products',
      slug_value: slug,
    }
  }
}
