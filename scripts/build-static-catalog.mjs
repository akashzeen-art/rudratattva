/**
 * Build deployable static catalogue shards for Vercel (no Node API required for listings).
 * Reads public/data/local-catalog.json → writes public/data/pages/*.json + categories.json
 *
 *   node scripts/build-static-catalog.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const catalogFile = path.join(root, 'public', 'data', 'local-catalog.json')
const pagesDir = path.join(root, 'public', 'data', 'pages')
const categoriesFile = path.join(root, 'public', 'data', 'categories.json')
const metaFile = path.join(root, 'public', 'data', 'catalog-meta.json')

export function safeSlug(slug = '') {
  return String(slug).replace(/^\//, '').replace(/[\\/]+/g, '__')
}

function main() {
  if (!fs.existsSync(catalogFile)) {
    console.error('Missing', catalogFile)
    process.exit(1)
  }

  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'))
  fs.mkdirSync(pagesDir, { recursive: true })

  // clear old shards
  for (const f of fs.readdirSync(pagesDir)) {
    if (f.endsWith('.json')) fs.unlinkSync(path.join(pagesDir, f))
  }

  let written = 0
  for (const [slug, page] of Object.entries(catalog.pages || {})) {
    const category = catalog.categories?.[slug] || null
    const products = page.products?.length
      ? page.products
      : (catalog.listingProducts?.[slug] || [])

    const payload = {
      page: {
        mode: page.mode || (category?.children?.length ? 'categories' : 'products'),
        mainprodtype: Number(page.mainprodtype || category?.mainprodtype || 5),
        level: Number(page.level || category?.level || 2),
        intro: page.intro
          ? {
              title: page.intro.title || category?.name || slug,
              description: page.intro.description || '',
              descriptionHtml: page.intro.descriptionHtml || '',
              tabs: page.intro.tabs || null,
              faqs: page.intro.faqs || [],
              breadcrumbs: page.intro.breadcrumbs || [],
              bannerImage: page.intro.bannerImage || category?.image || '',
              rawIntro: page.intro.rawIntro || null,
            }
          : null,
        children: page.children || category?.children || [],
        products,
        total: products.length || page.total || 0,
        constant: page.constant || null,
      },
      category: category
        ? {
            name: category.name,
            slug: category.slug,
            image: category.image || '',
            mainprodtype: category.mainprodtype,
            level: category.level,
            children: category.children || [],
          }
        : null,
    }

    fs.writeFileSync(path.join(pagesDir, `${safeSlug(slug)}.json`), JSON.stringify(payload))
    written += 1
  }

  fs.writeFileSync(categoriesFile, JSON.stringify(catalog.categories || {}))
  fs.writeFileSync(
    metaFile,
    JSON.stringify({
      exportedAt: catalog.exportedAt || new Date().toISOString(),
      pages: written,
      categories: Object.keys(catalog.categories || {}).length,
      listingRows: Object.values(catalog.listingProducts || {}).reduce(
        (n, a) => n + (a?.length || 0),
        0
      ),
    })
  )

  console.log(`Wrote ${written} page shards → ${pagesDir}`)
  console.log('Wrote', categoriesFile)
}

main()
