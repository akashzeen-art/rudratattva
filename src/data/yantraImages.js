/** Local category heading images for Yantras home. */
export const YANTRA_SECTION_IMAGES = {
  'p/yantras': '/image/yantra/01-yantra-sheet.jpg',
  'p/siddh-meru-yantras': '/image/yantra/02-siddh-meru-yantras.jpg',
}

/** Force Yantra Sheets / Siddh Meru cards onto local heading images. */
export function mapYantraSectionImages(children = [], pageSlug = '') {
  const parent = String(pageSlug || '').replace(/^\//, '')
  if (parent !== 'c/yantras-and-mahayantras' && parent !== 'yantra') return children || []
  return (children || []).map((child) => {
    const slug = String(child.slug || child.to || '')
      .replace(/^\//, '')
      .trim()
    const img = YANTRA_SECTION_IMAGES[slug]
    if (!img) return child
    return { ...child, img, image: img }
  })
}
