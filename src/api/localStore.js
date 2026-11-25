/**
 * Catalogue client — talks to our local Rudra Tattva API (/api → server on :4000).
 */

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

export async function fetchPageBundle(slugValue = '', pageNo = 1, filters = {}) {
  const json = await apiGet(`/api/page?${buildPageQuery(slugValue, pageNo, filters)}`)
  return json.data
}

export async function fetchProductBundle(slugValue = '') {
  const slug = String(slugValue || '').replace(/^\//, '')
  const json = await apiGet(`/api/product?slug=${encodeURIComponent(slug)}`)
  return json.data
}

export async function fetchSlugInfo(slugValue = '') {
  const slug = String(slugValue || '').replace(/^\//, '')
  const json = await apiGet(`/api/slug-search?slug=${encodeURIComponent(slug)}`)
  const data = Array.isArray(json.data) ? json.data[0] : json.data
  return data || null
}
