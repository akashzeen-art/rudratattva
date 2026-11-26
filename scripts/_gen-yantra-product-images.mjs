import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const pages = ['p__yantras.json', 'p__siddh-meru-yantras.json']
const map = {}

for (const f of pages) {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'data', 'pages', f), 'utf8'))
  for (const p of j.page?.products || []) {
    const slug = String(p.slug || '').replace(/^\//, '')
    const img = p.img || p.image || ''
    if (slug.startsWith('buy/') && String(img).startsWith('/image/yantra/')) {
      map[slug] = img
    }
  }
}

const out = path.join(ROOT, 'src', 'data', 'yantraProductImages.js')
const body =
  '/** Local yantra product thumbs (sheets + siddh meru). Auto-generated. */\n'
  + `export const YANTRA_PRODUCT_IMAGES = ${JSON.stringify(map, null, 2)}\n\n`
  + 'export function getYantraProductImage(slug = \'\') {\n'
  + '  return YANTRA_PRODUCT_IMAGES[String(slug || \'\').replace(/^\\//, \'\')] || \'\'\n'
  + '}\n'

fs.writeFileSync(out, body)
console.log('wrote', Object.keys(map).length, 'entries →', out)
