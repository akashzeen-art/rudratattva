import { brandify } from './catalog'
import { fetchProductBundle } from './localStore'

const MAIN_NAV = {
  1: { label: 'Pujas', to: '/pujas' },
  2: { label: 'Gemstones', to: '/gemstones' },
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
    return { label: 'Gemstones', to: '/gemstones' }
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

function mapImages(list, fallbackAlt = 'Product') {
  return asArray(list)
    .map(img => {
      if (typeof img === 'string') return { src: img, alt: fallbackAlt }
      return {
        src: img?.path || img?.image || img?.url || '',
        alt: brandify(img?.img_alt_text || img?.alt_text || fallbackAlt),
      }
    })
    .filter(img => img.src && !/youtube\.com|youtu\.be|ytimg\.com/i.test(img.src))
}

function variantLabel(item) {
  const name = String(item.variant_name || item.name || '')
  const dash = name.lastIndexOf('-')
  if (dash > -1) {
    const tail = name.slice(dash + 1).trim()
    if (tail) return tail
  }
  if (item.bead_size) return `${item.bead_size}`.includes('mm') ? String(item.bead_size) : `${item.bead_size} mm`
  return name || 'Option'
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
  const crumbs = []
  const main = firstLevelNav({ ...d, mainprodtype: d.mainprodtype || info.mainprodtype })
  if (main) crumbs.push(main)
  if (d.second_level_name && d.second_level_slug) {
    crumbs.push({ label: d.second_level_name, to: `/${String(d.second_level_slug).replace(/^\//, '')}` })
  }
  if (d.third_level_name && d.third_level_slug) {
    crumbs.push({ label: d.third_level_name, to: `/${String(d.third_level_slug).replace(/^\//, '')}` })
  }
  crumbs.push({ label: d.product_name || d.mainheadingtext || 'Product' })

  const productName = brandify(d.product_name || d.mainheadingtext || 'Product')
  let images = mapImages(d.image_url, productName)
  if (!images.length) {
    images = [{ src: '/images/RudraTattvalogo.png', alt: 'Rudra Tattva' }]
  }

  const variants = asArray(d.product_variant_data).map(item => {
    const vImages = mapImages(item.image_url, productName)
    const designs = asArray(item.designgrp)
      .filter(dg => dg && typeof dg === 'object' && (dg.id || dg.name || dg.image))
      .map(dg => ({
        id: dg.id,
        name: brandify(dg.name || ''),
        price: Number(dg.price) || 0,
        image: dg.image || '',
        description: brandify(dg.short_description || ''),
      }))
      .filter(dg => dg.name || dg.image)
    const variantPrice = parsePrice(item.display_price ?? item.selling_price ?? item.price)
    return {
      id: item.id,
      label: variantLabel(item),
      typeName: item.variant_type_name || 'Variation',
      name: brandify(item.variant_name || item.name || productName),
      price: variantPrice,
      images: vImages.length ? vImages : images,
      descriptionHtml: brandify(item.description || ''),
      inStock: !item.out_of_stock,
      designs,
    }
  })

  const range = priceRangeFromVariants(variants, d.display_price ?? d.selling_price)
  const basePrice = variants.length ? range.min : parsePrice(d.display_price ?? d.selling_price)

  const energization = asArray(d.puja_energization_list).map(item => ({
    id: item.id,
    name: brandify(item.name || ''),
    price: Number(item.price) || 0,
  }))

  const certification = asArray(d.certification_list).map(item => ({
    id: item.id,
    name: brandify(item.name || ''),
    price: Number(item.price) || 0,
  }))

  const bundles = asArray(d.bundleproduct).map(item => ({
    id: item.id,
    name: brandify(item.product_name || item.name || ''),
    price: Number(item.price) || 0,
    image: item.image || '',
    description: brandify(item.description || ''),
  }))

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

  // Top-level design groups (some yantras / other products)
  const topDesigns = asArray(d.designgrp)
    .filter(item => item && typeof item === 'object' && (item.id || item.name || item.image))
    .map(item => ({
      id: item.id,
      name: brandify(item.name || ''),
      price: Number(item.price) || 0,
      image: item.image || '',
      description: brandify(item.short_description || ''),
    }))
    .filter(item => item.name || item.image)

  const wearOptions = []
  if (necklaceDesigns.length || braceletDesigns.length || d.bracelet || d.pendent) {
    wearOptions.push({ id: 'loose', label: 'Loose Bead', price: 0 })
    if (necklaceDesigns.length) wearOptions.push({ id: 'necklace', label: 'Necklace', price: 0 })
    if (braceletDesigns.length) wearOptions.push({ id: 'bracelet', label: 'Bracelet', price: 0 })
  }

  const rawTypeName = String(variants[0]?.typeName || '').trim()
  const variantTypeName = rawTypeName
    || (variants.some(v => /\bmm\b|”|"|inch|x\s*\d/i.test(v.label))
      ? 'Size'
      : variants.some(v => /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day|kunda|package)\b/i.test(v.label))
        ? 'Package'
        : 'Variation')

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
    shortDescription: brandify(d.short_description || ''),
    longDescription: brandify(d.long_description || ''),
    beadSize: d.bead_size || '',
    grade: d.size_grade || '',
    origin: d.origin
      || (Number(d.mainprodtype || info.mainprodtype) === 3
        ? String(d.second_level_name || '')
            .replace(/\s*Rudraksha\s*$/i, '')
            .trim()
        : ''),
    caratWeight: d.carat_weight || '',
    rattiWeight: d.ratti_weight || '',
    pricePerCarat: d.price_per_carat || '',
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
