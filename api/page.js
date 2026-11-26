/**
 * Vercel serverless page endpoint — reads static shard from /data/pages.
 * Also supports page/pageSize/filter query params for a response shape
 * matching the local Node API.
 */

import { filterCatalogChildren, filterCatalogProducts } from './_pujaFilters.js'

function safeSlug(slug = '') {
  return String(slug).replace(/^\//, '').replace(/[\\/]+/g, '__')
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

    const proto = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers.host
    const url = `${proto}://${host}/data/pages/${safeSlug(slug)}.json`
    const staticRes = await fetch(url)
    if (!staticRes.ok) {
      res.status(404).json({ status: 'error', msg: 'Page not found' })
      return
    }

    const bundle = await staticRes.json()
    const pageNo = Math.max(1, Number(req.query.page || req.query.page_no || 1))
    const pageSize = Math.max(1, Number(req.query.pageSize || 12))
    const filters = {
      minPrice: req.query.minPrice || '',
      maxPrice: req.query.maxPrice || '',
      beadMin: req.query.beadMin || '',
      beadMax: req.query.beadMax || '',
      sizeGrade: req.query.sizeGrade || '',
      sortBy: req.query.sortBy || '',
    }

    const mainprodtype = Number(bundle.page?.mainprodtype || bundle.category?.mainprodtype || 5)
    let children = filterCatalogChildren(bundle.page?.children || [], slug, mainprodtype)
    let products = filterCatalogProducts(bundle.page?.products || [], slug, mainprodtype)

    const all = applyFilters(products, filters)
    const start = (pageNo - 1) * pageSize
    const slice = all.slice(start, start + pageSize)

    res.status(200).json({
      status: 'success',
      data: {
        page: {
          ...bundle.page,
          children,
          products: slice,
          total: all.length,
          pageNo,
          pageSize,
          hasMore: start + pageSize < all.length,
        },
        category: bundle.category
          ? {
              ...bundle.category,
              children: filterCatalogChildren(bundle.category.children || [], slug, mainprodtype),
            }
          : null,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', msg: err.message || 'Server error' })
  }
}
