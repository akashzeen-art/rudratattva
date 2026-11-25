/**
 * Vercel serverless slug-search — uses static page/product shards when possible,
 * otherwise asks the legacy admin API.
 */

const ADMIN = 'https://admin.rudraksha-ratna.com/api/'

function safeSlug(slug = '') {
  return String(slug).replace(/^\//, '').replace(/[\\/]+/g, '__')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  try {
    const slug = String(req.query.slug || req.body?.slug_value || req.body?.slug || '')
      .replace(/^\//, '')
    if (!slug) {
      res.status(400).json({ status: 'error', msg: 'slug required', data: [] })
      return
    }

    const proto = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers.host

    if (slug.startsWith('buy/')) {
      const productUrl = `${proto}://${host}/api/product?slug=${encodeURIComponent(slug)}`
      const productRes = await fetch(productUrl)
      if (productRes.ok) {
        const json = await productRes.json()
        if (json?.data?.info) {
          res.status(200).json({ status: 'success', data: [json.data.info] })
          return
        }
      }
    } else {
      const pageUrl = `${proto}://${host}/data/pages/${safeSlug(slug)}.json`
      const pageRes = await fetch(pageUrl)
      if (pageRes.ok) {
        const bundle = await pageRes.json()
        const page = bundle.page
        const cat = bundle.category
        res.status(200).json({
          status: 'success',
          data: [{
            mainprodtype: page?.mainprodtype || cat?.mainprodtype || 5,
            level: page?.level || cat?.level || 2,
            product_list: page?.mode === 'products',
            slug_value: slug,
          }],
        })
        return
      }
    }

    const adminRes = await fetch(`${ADMIN}pujaenergization/slug-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ slug_value: slug }),
    })
    const json = await adminRes.json().catch(() => ({}))
    if (!adminRes.ok || json.status !== 'success') {
      res.status(404).json({ status: 'error', msg: 'Slug not found', data: [] })
      return
    }
    res.status(200).json(json)
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', msg: err.message || 'Server error', data: [] })
  }
}
