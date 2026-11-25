/**
 * Backfill full product details into public/data/product-details/
 * (images, variants/sizes, descriptions) without rewriting the huge catalog.
 *
 *   node scripts/backfill-product-details.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchRemoteProduct, isCompleteProduct } from '../server/productFetch.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const catalogFile = path.join(root, 'public', 'data', 'local-catalog.json')
const detailsDir = path.join(root, 'public', 'data', 'product-details')
const progressFile = path.join(root, 'public', 'data', '.backfill-progress.json')

const CONCURRENCY = 3
const DELAY_MS = 80

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function detailPath(slug) {
  return path.join(detailsDir, `${String(slug).replace(/[\\/]+/g, '__')}.json`)
}

function hasDetail(slug) {
  const file = detailPath(slug)
  if (!fs.existsSync(file)) return false
  try {
    return isCompleteProduct(JSON.parse(fs.readFileSync(file, 'utf8')))
  } catch {
    return false
  }
}

function saveDetail(slug, product) {
  if (!fs.existsSync(detailsDir)) fs.mkdirSync(detailsDir, { recursive: true })
  const dest = detailPath(slug)
  const tmp = `${dest}.tmp`
  fs.writeFileSync(tmp, JSON.stringify({
    info: product.info,
    raw: product.raw,
    fetchedAt: product.fetchedAt || new Date().toISOString(),
  }))
  fs.renameSync(tmp, dest)
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'))
  const seen = new Set()
  const queue = []

  for (const list of Object.values(catalog.listingProducts || {})) {
    for (const item of list || []) {
      const slug = item.slug
      if (!slug?.startsWith('buy/') || seen.has(slug)) continue
      seen.add(slug)
      if (isCompleteProduct(catalog.products?.[slug]) || hasDetail(slug)) continue
      queue.push({ slug, mainprodtype: item.mainprodtype || 0 })
    }
  }

  console.log(`Backfill queue: ${queue.length}`)
  let done = 0
  let failed = 0
  const progress = fs.existsSync(progressFile)
    ? JSON.parse(fs.readFileSync(progressFile, 'utf8'))
    : { failed: {} }

  while (queue.length) {
    const batch = queue.splice(0, CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async item => {
        const full = await fetchRemoteProduct(item.slug, item.mainprodtype)
        saveDetail(item.slug, full)
        return item.slug
      })
    )
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        done += 1
        delete progress.failed[batch[i].slug]
      } else {
        failed += 1
        progress.failed[batch[i].slug] = results[i].reason?.message || 'fail'
        console.warn('fail', batch[i].slug, results[i].reason?.message)
      }
    }
    if ((done + failed) % 30 < CONCURRENCY) {
      console.log(`copied ${done} failed ${failed} left ${queue.length}`)
      fs.writeFileSync(progressFile, JSON.stringify(progress))
    }
    await sleep(DELAY_MS)
  }

  fs.writeFileSync(progressFile, JSON.stringify(progress))
  console.log('DONE backfill', { done, failed })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
