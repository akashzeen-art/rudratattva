import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadProductPage } from '../api/product'
import { useCart } from '../context/CartContext'
import BuyNowModal from '../components/BuyNowModal'

function StarRating({ rating = 0 }) {
  const stars = []
  for (let i = 1; i <= 5; i += 1) {
    if (rating >= i) stars.push(<i key={i} className="fa-solid fa-star" />)
    else if (rating >= i - 0.5) stars.push(<i key={i} className="fa-solid fa-star-half-stroke" />)
    else stars.push(<i key={i} className="fa-regular fa-star" />)
  }
  return <div className="pd-stars" aria-label={`Rated ${rating} out of 5`}>{stars}</div>
}

export default function ProductPage() {
  const { '*': rest } = useParams()
  const slugValue = `buy/${rest || ''}`.replace(/\/$/, '')
  const { addItem } = useCart()

  const [state, setState] = useState({ loading: true, error: '', product: null })
  const [activeImage, setActiveImage] = useState(0)
  const [thumbStart, setThumbStart] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)
  const [qty, setQty] = useState(1)
  const [energyId, setEnergyId] = useState(null)
  const [certId, setCertId] = useState(null)
  const [variantId, setVariantId] = useState(null)
  const [bundleIds, setBundleIds] = useState([])
  const [lightbox, setLightbox] = useState(false)
  const [toast, setToast] = useState('')
  const [buyNowOpen, setBuyNowOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setState({ loading: true, error: '', product: null })
    loadProductPage(slugValue)
      .then(product => {
        if (cancelled) return
        setState({ loading: false, error: '', product })
        setActiveImage(0)
        setThumbStart(0)
        setQty(1)
        setEnergyId(product.energization[0]?.id ?? null)
        setCertId(product.certification[0]?.id ?? null)
        setVariantId(null)
        setBundleIds([])
      })
      .catch(err => {
        if (!cancelled) setState({ loading: false, error: err.message || 'Product not found', product: null })
      })
    return () => { cancelled = true }
  }, [slugValue])

  const product = state.product

  const selectedVariant = useMemo(
    () => product?.variants.find(v => v.id === variantId) || null,
    [product, variantId]
  )

  const energy = useMemo(
    () => product?.energization.find(e => e.id === energyId) || null,
    [product, energyId]
  )
  const cert = useMemo(
    () => product?.certification.find(c => c.id === certId) || null,
    [product, certId]
  )

  const selectedBundles = useMemo(
    () => (product?.bundles || []).filter(b => bundleIds.includes(b.id)),
    [product, bundleIds]
  )

  const galleryImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : (product?.images || [])

  const unitPrice = useMemo(() => {
    if (!product) return 0
    const base = selectedVariant
      ? Number(selectedVariant.price)
      : Number(product.price)
    const safeBase = Number.isFinite(base) ? base : 0
    return safeBase
      + (Number(energy?.price) || 0)
      + (Number(cert?.price) || 0)
      + selectedBundles.reduce((sum, b) => sum + (Number(b.price) || 0), 0)
  }, [product, selectedVariant, energy, cert, selectedBundles])

  const thumbsVisible = 4
  const maxThumbStart = Math.max(0, galleryImages.length - thumbsVisible)
  const visibleThumbs = galleryImages.slice(thumbStart, thumbStart + thumbsVisible)

  useEffect(() => {
    setActiveImage(0)
    setThumbStart(0)
  }, [variantId])

  const showToast = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2200)
  }

  const canCheckout = () => {
    if (!product?.inStock) return false
    if (product.requiresVariant && !selectedVariant) return false
    if (selectedVariant && !selectedVariant.inStock) return false
    return true
  }

  const buildCartItem = () => {
    const options = []
    if (selectedVariant) options.push(`${product.variantTypeName}: ${selectedVariant.label}`)
    if (energy) options.push(`Energisation: ${energy.name}`)
    if (cert) options.push(`Certification: ${cert.name}`)
    selectedBundles.forEach(b => options.push(`Add-on: ${b.name}`))

    const price = Number(unitPrice)
    return {
      lineKey: [
        product.slug,
        variantId || selectedVariant?.id || 'v0',
        energyId || 'e0',
        certId || 'c0',
        [...bundleIds].sort().join('-') || 'b0',
      ].join('|'),
      productId: selectedVariant?.id || product.id,
      slug: product.slug,
      name: selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name,
      code: product.code,
      image: galleryImages[0]?.src || product.images[0]?.src || '/images/gems-and-jewels-logo.png',
      unitPrice: Number.isFinite(price) ? price : 0,
      quantity: qty,
      options,
    }
  }

  const handleAddToCart = () => {
    if (!canCheckout()) {
      if (product.requiresVariant && !selectedVariant) showToast(`Please select a ${product.variantTypeName}`)
      else showToast('Unable to add this product')
      return false
    }
    addItem(buildCartItem())
    showToast('Added to cart')
    return true
  }

  const handleBuyNow = () => {
    if (!canCheckout()) {
      if (product.requiresVariant && !selectedVariant) showToast(`Please select a ${product.variantTypeName}`)
      else showToast('Unable to buy this product')
      return
    }
    setBuyNowOpen(true)
  }

  const toggleBundle = (id) => {
    setBundleIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const selectVariant = (id) => {
    setVariantId(id)
  }

  if (state.loading) {
    return (
      <section className="pd-section">
        <p className="pd-loading">Loading product…</p>
      </section>
    )
  }

  if (state.error || !product) {
    return (
      <section className="pd-section">
        <p className="pd-loading">{state.error || 'Product not found'}</p>
      </section>
    )
  }

  const currentImage = galleryImages[activeImage] || galleryImages[0]
  const needsVariation = product.requiresVariant && !selectedVariant

  return (
    <div className="pd-page">
      <div className="pd-breadcrumb-wrap">
        <nav aria-label="Breadcrumb">
          <ol className="rc-breadcrumb">
            <li><Link to="/">Home</Link></li>
            {product.breadcrumbs.map((b, i) => (
              <li key={b.to || b.label} className={i === product.breadcrumbs.length - 1 ? 'active' : ''}>
                {i === product.breadcrumbs.length - 1 || !b.to
                  ? <span>{b.label}</span>
                  : <Link to={b.to}>{b.label}</Link>}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <section className="pd-section">
        <div className="pd-grid">
          <div className="pd-gallery">
            <button
              type="button"
              className="pd-main-image"
              onClick={() => setLightbox(true)}
              aria-label="Expand image"
            >
              <img
                src={currentImage?.src}
                alt={currentImage?.alt || product.name}
                onError={e => { e.target.src = '/images/gems-and-jewels-logo.png' }}
              />
              <span className="pd-expand-hint">Click to expand</span>
            </button>

            {galleryImages.length > 1 && (
              <div className="pd-thumbs">
                <button
                  type="button"
                  className="pd-thumb-nav"
                  disabled={thumbStart <= 0}
                  onClick={() => setThumbStart(s => Math.max(0, s - 1))}
                  aria-label="Previous thumbnails"
                >
                  <i className="fa-solid fa-angle-left" />
                </button>
                <div className="pd-thumb-track">
                  {visibleThumbs.map((img, idx) => {
                    const realIndex = thumbStart + idx
                    return (
                      <button
                        type="button"
                        key={`${img.src}-${realIndex}`}
                        className={`pd-thumb${realIndex === activeImage ? ' active' : ''}`}
                        onClick={() => setActiveImage(realIndex)}
                      >
                        <img src={img.src} alt={img.alt} loading="lazy" />
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  className="pd-thumb-nav"
                  disabled={thumbStart >= maxThumbStart}
                  onClick={() => setThumbStart(s => Math.min(maxThumbStart, s + 1))}
                  aria-label="Next thumbnails"
                >
                  <i className="fa-solid fa-angle-right" />
                </button>
              </div>
            )}
          </div>

          <div className="pd-info">
            <div className="pd-title-row">
              <h1 className="pd-name">{product.name}</h1>
              <button
                type="button"
                className="pd-wish"
                aria-label="Add to wishlist"
                onClick={() => setWishlisted(w => !w)}
              >
                <i className={wishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
              </button>
            </div>

            {product.rating > 0 && (
              <div className="pd-rating-row">
                <StarRating rating={product.rating} />
                {product.reviewCount > 0 && <span>({product.reviewCount})</span>}
              </div>
            )}

            {(product.shortDescription || selectedVariant?.descriptionHtml) && (
              <div
                className="pd-short-desc"
                dangerouslySetInnerHTML={{
                  __html: selectedVariant?.descriptionHtml || product.shortDescription,
                }}
              />
            )}

            <div className="pd-details">
              {product.code && <p><span className="pd-prop">Product Code: </span>{product.code}</p>}
              {product.origin && <p><span className="pd-prop">Origin: </span>{product.origin}</p>}
            </div>

            {product.variants.length > 0 && (
              <div className="pd-block">
                <p className="pd-selection-heading">Select {product.variantTypeName}</p>
                <div className="pd-chip-row">
                  {product.variants.map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`pd-chip${variantId === opt.id ? ' active' : ''}`}
                      onClick={() => selectVariant(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.energization.length > 0 && (
              <div className="pd-block">
                <p className="pd-selection-heading">Energisation</p>
                <div className="pd-chip-row">
                  {product.energization.map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`pd-chip${energyId === opt.id ? ' active' : ''}`}
                      onClick={() => setEnergyId(opt.id)}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.bundles.map(bundle => (
              <div className="pd-block" key={bundle.id}>
                <p className="pd-selection-heading">Add: {bundle.name}</p>
                <button
                  type="button"
                  className={`pd-bundle${bundle.image ? '' : ' pd-bundle--no-img'}${bundleIds.includes(bundle.id) ? ' active' : ''}`}
                  onClick={() => toggleBundle(bundle.id)}
                >
                  <span className="pd-wear-marker" />
                  {bundle.image ? (
                    <img src={bundle.image} alt={bundle.name} loading="lazy" />
                  ) : null}
                  <div>
                    <p className="pd-design-name">{bundle.name}</p>
                    {bundle.description && <p className="pd-bundle-desc">{bundle.description}</p>}
                  </div>
                </button>
              </div>
            ))}

            {product.certification.length > 0 && (
              <div className="pd-block">
                <p className="pd-selection-heading">Certification</p>
                <div className="pd-chip-row">
                  {product.certification.map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`pd-chip${certId === opt.id ? ' active' : ''}`}
                      onClick={() => setCertId(opt.id)}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {needsVariation ? (
              <div className="pd-actions pd-actions-center">
                <button type="button" className="pd-btn pd-btn-solid" disabled>
                  Select a Variation
                </button>
              </div>
            ) : (
              <div className="pd-actions">
                <div className="pd-qty-wrap">
                  <p className="pd-selection-heading">Quantity:</p>
                  <div className="pd-qty">
                    <button type="button" className="pd-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">
                      <i className="fa-solid fa-minus" />
                    </button>
                    <input type="text" readOnly value={qty} aria-label="Quantity" />
                    <button type="button" className="pd-qty-btn" onClick={() => setQty(q => q + 1)} aria-label="Increase quantity">
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>
                </div>

                <div className="pd-cta-row">
                  <button
                    type="button"
                    className="pd-btn pd-btn-outline"
                    onClick={handleAddToCart}
                    disabled={!product.inStock || (selectedVariant && !selectedVariant.inStock)}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="pd-btn pd-btn-solid"
                    onClick={handleBuyNow}
                    disabled={!product.inStock || (selectedVariant && !selectedVariant.inStock)}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            )}

            {(!product.inStock || (selectedVariant && !selectedVariant.inStock)) && (
              <p className="pd-oos">Out of Stock</p>
            )}

            <div className="pd-consult">
              <h3>Seeking Rudraksha Recommendation?</h3>
              <p>Speak with our Panditji for expert Vedic guidance from Gems & Jewels</p>
              <div className="pd-consult-btns">
                <Link to="/consultation" className="pd-btn pd-btn-solid">
                  Talk to panditji
                </Link>
              </div>
              <p className="pd-consult-note">Chakra &amp; Horoscope Analysis included in Paid Consultation</p>
            </div>
          </div>
        </div>
      </section>

      {product.longDescription && (
        <section className="pd-long-desc">
          <h2>Description</h2>
          <div className="rc-tab-html" dangerouslySetInnerHTML={{ __html: product.longDescription }} />
        </section>
      )}

      {lightbox && currentImage && (
        <div className="pd-lightbox" onClick={() => setLightbox(false)} role="presentation">
          <button type="button" className="pd-lightbox-close" aria-label="Close" onClick={() => setLightbox(false)}>
            <i className="fa-solid fa-xmark" />
          </button>
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {toast && <div className="pd-toast" role="status">{toast}</div>}

      <BuyNowModal
        open={buyNowOpen}
        productName={product.name}
        onClose={() => setBuyNowOpen(false)}
      />
    </div>
  )
}
