import { brandify } from './catalog'
import { fetchProductBundle } from './localStore'
import { getRegularParentForProduct } from '../data/rudrakshaRegular'
import {
  getGemstoneDisplayForProduct,
  stripGemstoneCaratCopy,
} from '../data/gemstoneBuy'
import { getYantraProductImage } from '../data/yantraProductImages'

const MAIN_NAV = {
  1: { label: 'Pujas', to: '/pujas' },
  2: { label: 'Gemstones', to: '/p/natural-jyotish-gemstones' },
  3: { label: 'Rudraksha', to: '/rudraksha' },
  4: { label: 'Yantras', to: '/yantra' },
  5: { label: 'Idols', to: '/idols' },
}

/** Prefer API hierarchy (first_level_*) over mainprodtype — many Rudraksha/jewellery items are typed as 5 (other). */
function firstLevelNav(d = {}) {
  const slug = String(d.first_level_slug || '').toLowerCase()
  const name = String(d.first_level_name || '')
  if (slug.includes('rudraksha') || /rudraksha/i.test(name)) return { label: 'Rudraksha', to: '/rudraksha' }
  if (slug.includes('gemstone') || slug.includes('ratna-vedic') || /gemstone/i.test(name)) {
    return { label: 'Gemstones', to: '/p/natural-jyotish-gemstones' }
  }
  if (slug.includes('yantra') || /yantra/i.test(name)) return { label: 'Yantras', to: '/yantra' }
  if (slug.includes('idol') || slug.includes('god-and-goddess') || /idol|goddess|gods/i.test(name)) {
    return { label: 'Idols', to: '/idols' }
  }
  if (slug.includes('puja') || /puja/i.test(name)) return { label: 'Pujas', to: '/pujas' }
  if (name) {
    const fallback = MAIN_NAV[Number(d.mainprodtype)]
    return { label: name, to: fallback?.to || `/${String(d.first_level_slug || '').replace(/^\//, '')}` }
  }
  return MAIN_NAV[Number(d.mainprodtype)] || null
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'object') return [value]
  return []
}

/** Strip bead size / size grade / carat / dimension / weight lines from product HTML. */
function sanitizeProductHtml(html = '') {
  let out = String(html || '')
  const blockLabels = [
    'Dimension',
    'Dimensions',
    'Weight',
    'Bead Size',
    'Nepal Bead Size',
    'Java Bead Size',
    'Size Grade',
    'Size Grade Guide',
    'Carat',
    'Carat Weight',
    'Ratti',
    'Ratti Weight',
    'Price\\s*/?\\s*Carat',
    'Price per Carat',
  ]
  for (const label of blockLabels) {
    out = out.replace(
      new RegExp(
        `(?:<br\\s*/?>|\\n|\\s)*<strong>\\s*${label}\\s*:?\\s*</strong>[\\s\\S]*?(?=(?:<br\\s*/?>|\\n|\\s)*<strong>|<ul>|<ol>|</p>|<h[1-6]|</div>|$)`,
        'gi',
      ),
      '',
    )
  }
  // Description sections use <h3>Size Grade Guide</h3>… (not only <strong> labels)
  const headingLabels = [
    'Size Grade Guide',
    'Size Grade',
    'Bead Size',
    'Nepal Bead Size',
    'Java Bead Size',
    'Carat Weight',
    'Ratti Weight',
    'Dimensions?',
    'Weight',
  ]
  for (const label of headingLabels) {
    out = out.replace(
      new RegExp(
        `<h([1-6])[^>]*>\\s*(?:<[^>]+>\\s*)*${label}\\s*(?:<[^>]+>\\s*)*</h\\1>[\\s\\S]*?(?=<h[1-6]\\b|$)`,
        'gi',
      ),
      '',
    )
  }
  out = out.replace(/\bDimension(?:s)?\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\bWeight\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\bBead\s*Size\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\bSize\s*Grade(?:\s*Guide)?\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\bCarat(?:\s*Weight)?\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\bRatti(?:\s*Weight)?\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\bPrice\s*\/?\s*Carat\s*:\s*[^\n<]*/gi, '')
  out = out.replace(/\b\d+(?:\.\d+)?\s*(?:gm|gms|grams?|kg)\b/gi, '')
  out = out.replace(
    /\b\d+(?:\.\d+)?\s*\(\s*[LWlw]\s*\)\s*[x×]\s*\d+(?:\.\d+)?\s*\(\s*[LWlw]\s*\)\s*(?:Inches?|inch|cm|mm)?/gi,
    '',
  )
  // Dead "Read more" article links from legacy catalogue HTML
  out = out.replace(/<a\b[^>]*>[\s\S]*?read\s*more[\s\S]*?<\/a>/gi, '')
  out = out.replace(/(?:<br\s*\/?>|\s)*read\s*more(?:\s*<br\s*\/?>)?/gi, '')
  // "Click to see video of …" CTAs
  out = out.replace(
    /(?:<br\s*\/?>|\s|&nbsp;)*click\s+to\s+see\s+video\s+of\s*(?:<a\b[^>]*>[\s\S]*?<\/a>)?/gi,
    '',
  )
  out = out.replace(/(?:<br\s*\/?>|\s|&nbsp;)*click\s+to\s+see\s+video(?:\s+of)?(?:\s*<br\s*\/?>)?/gi, '')
  out = stripGemstoneCaratCopy(out)
  return out
}

function formatInr(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' && /[-–]/.test(value) && Number.isNaN(Number(value))) {
    return String(value)
      .split(/\s*[-–]\s*/)
      .map(part => {
        const n = Number(String(part).replace(/[^\d.]/g, ''))
        return Number.isFinite(n) ? n.toLocaleString('en-IN') : part.trim()
      })
      .join(' - ')
  }
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return n.toLocaleString('en-IN')
}

function isLocalCatalogSrc(src = '') {
  return /^\/image\/(idol|yantra)\//i.test(String(src))
}

function isRemoteCdnSrc(src = '') {
  return /cloudfront\.net|rudraksha-ratna\.com|admin\.rudraksha/i.test(String(src))
}

function mapImages(list, fallbackAlt = 'Product') {
  const mapped = asArray(list)
    .map(img => {
      if (typeof img === 'string') return { src: img, alt: fallbackAlt }
      return {
        src: img?.path || img?.image || img?.url || '',
        alt: brandify(img?.img_alt_text || img?.alt_text || fallbackAlt),
      }
    })
    .filter(img => img.src && !/youtube\.com|youtu\.be|ytimg\.com/i.test(img.src))

  const locals = mapped.filter(img => isLocalCatalogSrc(img.src))
  if (!locals.length) return mapped

  // Prefer local idol/yantra assets; drop legacy CDN frames when a local thumb exists
  const rest = mapped.filter(img => !isLocalCatalogSrc(img.src) && !isRemoteCdnSrc(img.src))
  return [...locals, ...rest]
}

const FINISH_LABEL_RE = /\b(?:copper|gold|silver|antique|brass)\s*finish\b/i

function stripFinishFromLabel(text = '') {
  return String(text || '')
    .replace(/[-–—]?\s*(?:copper|gold|silver|antique|brass)\s*finish\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
    .trim()
}

function variantLabel(item) {
  const name = String(item.variant_name || item.name || '')
  const type = String(item.variant_type_name || '')
  // Size-Finish variants: show size only (never "Copper Finish" / "Gold Finish")
  if (/size[-\s]?finish/i.test(type) || FINISH_LABEL_RE.test(name)) {
    const sizeMatch = name.match(/(\d+(?:\.\d+)?\s*(?:inches?|inch|mm|cm)\b)/i)
    if (sizeMatch) return sizeMatch[1].replace(/\binch\b/i, 'inches')
    const withoutFinish = stripFinishFromLabel(name)
    const dash = withoutFinish.lastIndexOf('-')
    if (dash > -1) {
      const tail = withoutFinish.slice(dash + 1).trim()
      if (tail && !FINISH_LABEL_RE.test(tail)) return tail
    }
    return withoutFinish || 'Option'
  }
  const dash = name.lastIndexOf('-')
  if (dash > -1) {
    const tail = name.slice(dash + 1).trim()
    if (tail) return stripFinishFromLabel(tail) || tail
  }
  return stripFinishFromLabel(name) || name || 'Option'
}

/** Collapse Copper/Gold finish pairs that share the same size label. */
function collapseFinishVariants(variants) {
  const byLabel = new Map()
  for (const v of variants) {
    const key = String(v.label || '').toLowerCase()
    const prev = byLabel.get(key)
    if (!prev) {
      byLabel.set(key, v)
      continue
    }
    const preferNew =
      (!prev.inStock && v.inStock)
      || (Boolean(prev.inStock) === Boolean(v.inStock) && (Number(v.price) || 0) < (Number(prev.price) || 0))
    if (preferNew) byLabel.set(key, v)
  }
  return [...byLabel.values()]
}

function parsePrice(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  if (typeof raw === 'string' && raw.trim()) {
    const first = Number(String(raw).split(/[-–]/)[0].replace(/[^\d.]/g, ''))
    return Number.isFinite(first) ? first : 0
  }
  return 0
}

function priceRangeFromVariants(variants, fallbackRaw) {
  if (!variants.length) {
    const n = parsePrice(fallbackRaw)
    return { min: n, max: n, label: formatInr(fallbackRaw ?? n) }
  }
  const prices = variants.map(v => Number(v.price) || 0)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return {
    min,
    max,
    label: min === max ? formatInr(min) : `${formatInr(min)} - ${formatInr(max)}`,
  }
}

export async function loadProductPage(slugValue) {
  const local = await fetchProductBundle(slugValue)
  const info = local?.info
  if (!info || Number(info.level) !== 4) {
    throw new Error('Product not found')
  }

  const d = local?.raw
  if (!d) {
    throw new Error('This product is not in the local catalogue yet')
  }
  const productSlug = String(slugValue || '').replace(/^\//, '')
  const regularParent = getRegularParentForProduct(productSlug)
  const gemDisplay = getGemstoneDisplayForProduct(productSlug)
  const crumbs = []
  const main = firstLevelNav({ ...d, mainprodtype: d.mainprodtype || info.mainprodtype })
  if (regularParent) {
    crumbs.push({ label: 'Rudraksha', to: '/rudraksha' })
    crumbs.push({
      label: regularParent.parentLabel,
      to: `/${regularParent.parentSlug}`,
    })
    crumbs.push({ label: regularParent.productLabel || d.product_name || d.mainheadingtext || 'Product' })
  } else if (gemDisplay) {
    crumbs.push({ label: 'Gemstones', to: '/p/natural-jyotish-gemstones' })
    crumbs.push({ label: 'Natural Loose Gemstones', to: '/p/natural-jyotish-gemstones' })
    crumbs.push({ label: gemDisplay.displayName })
  } else {
    if (main) crumbs.push(main)
    if (d.second_level_name && d.second_level_slug) {
      crumbs.push({ label: d.second_level_name, to: `/${String(d.second_level_slug).replace(/^\//, '')}` })
    }
    if (d.third_level_name && d.third_level_slug) {
      crumbs.push({ label: d.third_level_name, to: `/${String(d.third_level_slug).replace(/^\//, '')}` })
    }
    crumbs.push({ label: d.product_name || d.mainheadingtext || 'Product' })
  }

  const rawProductName =
    gemDisplay?.displayName
    || regularParent?.productLabel
    || d.product_name
    || d.mainheadingtext
    || 'Product'
  const productName = brandify(
    Number(d.mainprodtype || info.mainprodtype) === 4
      ? String(rawProductName)
          .replace(/\s*[-–—]?\s*\d+(?:\.\d+)?\s*(?:gm|gms|grams?|kg|mm|cm|inch(?:es)?)\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim() || rawProductName
      : gemDisplay
        ? stripGemstoneCaratCopy(rawProductName) || rawProductName
        : rawProductName
  )
  const yantraLocalImg = getYantraProductImage(productSlug)
  let images = gemDisplay?.img
    ? [{ src: gemDisplay.img, alt: productName }]
    : regularParent?.img?.startsWith('/image/')
      ? [{ src: regularParent.img, alt: productName }]
      : yantraLocalImg
        ? [{ src: yantraLocalImg, alt: productName }]
        : mapImages(d.image_url, productName)
  // Prefer local rudraksha folder assets over remote CDN on product / cart thumbs
  if (!gemDisplay && regularParent?.img?.startsWith('/image/') && images.length) {
    images = [{ src: regularParent.img, alt: productName }, ...images.filter((img) => img.src !== regularParent.img)]
  }
  // Prefer local yantra sheet / siddh meru assets over legacy CDN galleries
  if (!gemDisplay && !regularParent && yantraLocalImg) {
    images = [
      { src: yantraLocalImg, alt: productName },
      ...mapImages(d.image_url, productName).filter(
        (img) => img.src !== yantraLocalImg && !isRemoteCdnSrc(img.src),
      ),
    ]
  }
  if (!images.length) {
    images = [{ src: '/images/gems-and-jewels-logo.png', alt: 'Gems & Jewels' }]
  }

  const variants = collapseFinishVariants(
    asArray(d.product_variant_data).map(item => {
      let vImages = mapImages(item.image_url, productName)
      if (yantraLocalImg) {
        vImages = [
          { src: yantraLocalImg, alt: productName },
          ...vImages.filter((img) => img.src !== yantraLocalImg && !isRemoteCdnSrc(img.src)),
        ]
      }
      const variantPrice = parsePrice(item.display_price ?? item.selling_price ?? item.price)
      const typeName = String(item.variant_type_name || 'Variation')
        .replace(/size[-\s]?finish/i, 'Size')
        .trim() || 'Variation'
      return {
        id: item.id,
        label: variantLabel(item),
        typeName,
        name: brandify(stripFinishFromLabel(item.variant_name || item.name || productName) || productName),
        price: variantPrice,
        images: vImages.length ? vImages : images,
        descriptionHtml: brandify(sanitizeProductHtml(item.description || '')),
        inStock: !item.out_of_stock,
        // Design picker removed site-wide
        designs: [],
      }
    }),
  )

  const range = priceRangeFromVariants(variants, d.display_price ?? d.selling_price)
  const basePrice = variants.length ? range.min : parsePrice(d.display_price ?? d.selling_price)

  const energization = asArray(d.puja_energization_list)
    .filter(item => !/no\s*energization/i.test(String(item.name || '')))
    .map(item => {
      const rawName = String(item.name || '')
      let name = rawName
      let price = Number(item.price) || 0
      if (/basic\s*energization/i.test(rawName)) {
        name = 'Energized (Free)'
        price = 0
      } else if (/pran\s*pratishtha|vedic\s*pran/i.test(rawName)) {
        name = 'Abhimantrit'
        price = 1100
      }
      return {
        id: item.id,
        name: brandify(name),
        price,
      }
    })

  const FREE_LAB_CERT = {
    id: 'authorized-lab-tested-free',
    name: 'Authorized Lab Tested Certificate (Free)',
    price: 0,
  }
  let certification = asArray(d.certification_list)
    .filter(item => !/x[\s-]*ray/i.test(String(item.name || '')))
    .map(item => {
      const rawName = String(item.name || '')
      let name = rawName
      let price = Number(item.price) || 0
      if (/free\s*certificate|lab\s*tested|authorized|autorized/i.test(rawName)) {
        name = FREE_LAB_CERT.name
        price = 0
      }
      return {
        id: item.id,
        name: brandify(name),
        price,
      }
    })
  // Always offer free lab certificate on every product page
  if (!certification.some(c => /authorized\s*lab\s*tested\s*certificate/i.test(c.name))) {
    certification = [FREE_LAB_CERT, ...certification]
  }

  const isYantra = Number(d.mainprodtype || info.mainprodtype) === 4

  const CLEANING_RECOMMENDATION_DESC = isYantra
    ? 'Clean your Yantra gently using a soft cloth to remove dust and dirt. For metal Yantras, apply a small amount of herbal polish and gently wipe the surface using a melamine sponge, avoiding excessive pressure. Use Gangajal for ritual purification, and apply Kumkum or sandal paste as part of your daily puja. Keep the Yantra on a clean altar cloth and avoid harsh chemicals or abrasive materials to preserve its shine, sacredness, and longevity.'
    : 'Clean your Rudraksha gently using a soft brush to remove accumulated dust and dirt. Apply a small amount of sandalwood oil to keep the beads moisturised and prevent them from drying out. Use a clean cotton cloth to wipe the beads and allow them to air-dry naturally. Avoid harsh chemicals, excessive water, and direct sunlight to maintain the natural beauty, purity, and longevity of your Rudraksha.'

  const bundles = asArray(d.bundleproduct).map(item => {
    const rawName = String(item.product_name || item.name || '')
    const isCleaning = /cleaning\s*kit|cleaning\s*recommendation/i.test(rawName)
    return {
      id: item.id,
      name: brandify(isCleaning ? 'Cleaning recommendation' : rawName),
      price: isCleaning ? 0 : Number(item.price) || 0,
      image: isCleaning ? '' : (item.image || ''),
      description: brandify(isCleaning ? CLEANING_RECOMMENDATION_DESC : (item.description || '')),
    }
  })

  const necklaceDesigns = asArray(d.pendentgroup).map(item => ({
    id: item.id,
    name: brandify(item.name || ''),
    price: Number(item.price) || 0,
    image: item.image || '',
    description: brandify(item.short_description || ''),
  }))

  const braceletDesigns = asArray(d.braceletgroup).map(item => ({
    id: item.id,
    name: brandify(item.name || ''),
    price: Number(item.price) || 0,
    image: item.image || '',
    description: brandify(item.short_description || ''),
  }))

  // Design picker (Select Design) removed site-wide.
  const topDesigns = []

  // Wear / mount picker (Loose Bead / Necklace / Bracelet) removed site-wide.
  const wearOptions = []

  const rawTypeName = String(variants[0]?.typeName || '')
    .replace(/size[-\s]?finish/i, 'Size')
    .trim()
  const variantTypeName = rawTypeName
    || (variants.some(v => /\bmm\b|”|"|inch|x\s*\d/i.test(v.label))
      ? 'Size'
      : variants.some(v => /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day|kunda|package)\b/i.test(v.label))
        ? 'Package'
        : 'Variation')

  const shortRaw = sanitizeProductHtml(d.short_description || '')
  const longRaw = sanitizeProductHtml(d.long_description || '')

  return {
    id: d.id || d.product_id,
    slug: slugValue,
    name: productName,
    code: d.product_code || '',
    price: basePrice,
    priceLabel: range.label,
    priceMin: range.min,
    priceMax: range.max,
    hasPriceRange: range.min !== range.max,
    shortDescription: brandify(shortRaw),
    longDescription: brandify(longRaw),
    beadSize: '',
    grade: '',
    origin: isYantra
      ? ''
      : (d.origin
        || (Number(d.mainprodtype || info.mainprodtype) === 3
          ? String(d.second_level_name || '')
              .replace(/\s*Rudraksha\s*$/i, '')
              .trim()
          : '')),
    caratWeight: '',
    rattiWeight: '',
    pricePerCarat: '',
    images,
    breadcrumbs: crumbs.map(c => ({ ...c, label: brandify(c.label) })),
    inStock: !d.out_of_stock,
    rating: Number(d.overall_rating) || 0,
    reviewCount: Number(d.review_count) || 0,
    energization,
    certification,
    bundles,
    wearOptions,
    necklaceDesigns,
    braceletDesigns,
    topDesigns,
    variants,
    variantTypeName,
    requiresVariant: variants.length > 0,
    mainprodtype: Number(d.mainprodtype || info.mainprodtype),
    raw: d,
  }
}

export { formatInr }
