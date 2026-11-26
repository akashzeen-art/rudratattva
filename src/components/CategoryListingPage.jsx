import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

function formatBound(n) {
  if (n == null || Number.isNaN(Number(n))) return ''
  return Number(n).toLocaleString('en-IN')
}

function RangeFilter({
  label,
  open,
  onToggle,
  minBound,
  maxBound,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  onApply,
  onClear,
  unit = '',
}) {
  const hasValue = minValue !== '' || maxValue !== ''
  const summary = hasValue
    ? `${minValue !== '' ? minValue : formatBound(minBound)}${unit} – ${maxValue !== '' ? maxValue : formatBound(maxBound)}${unit}`
    : label

  return (
    <div className={`rc-filter-col rc-range-filter${open ? ' open' : ''}`}>
      <button type="button" className="rc-custom-filter" onClick={onToggle} aria-expanded={open}>
        <p className="rc-filter-label">{summary}</p>
        <span className="rc-ng-arrow-wrapper"><span className="rc-ng-arrow" /></span>
      </button>
      {open && (
        <div className="rc-filter-panel">
          <p className="rc-filter-panel-hint">
            Range: {formatBound(minBound)}{unit} – {formatBound(maxBound)}{unit}
          </p>
          <div className="rc-filter-range-inputs">
            <label>
              <span>Min</span>
              <input
                type="number"
                min={minBound}
                max={maxBound}
                value={minValue}
                placeholder={String(minBound)}
                onChange={e => onMinChange(e.target.value)}
              />
            </label>
            <label>
              <span>Max</span>
              <input
                type="number"
                min={minBound}
                max={maxBound}
                value={maxValue}
                placeholder={String(maxBound)}
                onChange={e => onMaxChange(e.target.value)}
              />
            </label>
          </div>
          <div className="rc-filter-panel-actions">
            <button type="button" className="rc-filter-clear" onClick={onClear}>Clear</button>
            <button type="button" className="rc-filter-btn" onClick={onApply}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Matches rudraksha-ratna.com category / subcategory listing UI:
 * grey header, breadcrumb, title, description, tabs, filters, product grid
 */
export default function CategoryListingPage({
  title,
  breadcrumbs = [],
  description,
  descriptionHtml,
  tabs,
  childrenCards = [],
  products = [],
  keyFacts,
  faqs = [],
  bannerImage,
  loading = false,
  loadingMore = false,
  error = '',
  hasMore = false,
  onLoadMore,
  filterMeta = null,
  filters = {},
  onFiltersChange,
}) {
  const [activeTab, setActiveTab] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [openRange, setOpenRange] = useState(null)
  const [draftMinPrice, setDraftMinPrice] = useState('')
  const [draftMaxPrice, setDraftMaxPrice] = useState('')
  const filtersRef = useRef(null)

  useEffect(() => {
    setDraftMinPrice(filters.minPrice ?? '')
    setDraftMaxPrice(filters.maxPrice ?? '')
  }, [filters.minPrice, filters.maxPrice])

  useEffect(() => {
    const onDoc = (e) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target)) setOpenRange(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const contentTabs = useMemo(
    () => (tabs || []).filter(t => {
      const heading = String(t.heading || '').trim()
      if (/size\s*grade|bead\s*size|carat|dimension|ratti|size\s*guide/i.test(heading)) return false
      const text = String(t.html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return Boolean(heading && text)
    }),
    [tabs]
  )

  const tabItems = useMemo(() => {
    const items = contentTabs.map(t => ({
      type: 'content',
      label: String(t.heading).trim(),
      html: t.html || '',
    }))
    if (faqs?.length) {
      items.push({ type: 'faqs', label: 'FAQs' })
    }
    return items
  }, [contentTabs, faqs])

  const showPriceFilter = Boolean(filterMeta?.price)
  const showFilterBar = products.length > 0 || showPriceFilter || Boolean(filterMeta)

  const sortedProducts = useMemo(() => {
    let list = [...products]

    // Client-side safety net (API ignores some filters, e.g. price-only)
    if (filters.minPrice !== '' && filters.minPrice != null) {
      const min = Number(filters.minPrice)
      if (Number.isFinite(min)) list = list.filter(p => Number(p.price) >= min)
    }
    if (filters.maxPrice !== '' && filters.maxPrice != null) {
      const max = Number(filters.maxPrice)
      if (Number.isFinite(max)) list = list.filter(p => Number(p.price) <= max)
    }

    const sortBy = filters.sortBy || ''
    if (sortBy === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0))
    if (sortBy === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0))
    if (sortBy === 'name-asc') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return list
  }, [products, filters])

  const showProducts = products.length > 0 || (showFilterBar && !loading)
  const showChildren = childrenCards.length > 0 && products.length === 0 && !showFilterBar

  const updateFilters = (patch) => {
    onFiltersChange?.({ ...filters, ...patch })
  }

  const applyPrice = () => {
    updateFilters({
      minPrice: draftMinPrice,
      maxPrice: draftMaxPrice,
    })
    setOpenRange(null)
  }

  const renderTabBody = (item) => {
    if (item.type === 'faqs') {
      return (
        <div className="rc-tab-panel">
          <div className="rc-accordion">
            {faqs.map((f, i) => (
              <div className="rc-accordion-item" key={i}>
                <h2 className="rc-accordion-header">
                  <button
                    type="button"
                    className={`rc-accordion-btn${openFaq === i ? '' : ' collapsed'}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <p className="rc-accordion-head">{f.q}</p>
                  </button>
                </h2>
                {openFaq === i && (
                  <div className="rc-accordion-body">
                    {f.aHtml
                      ? <div dangerouslySetInnerHTML={{ __html: f.aHtml }} />
                      : <p>{f.a}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    const htmlHasHeading = /<h[1-6][\s>]/i.test(item.html || '')

    return (
      <div className="rc-tab-panel">
        {item.label && !htmlHasHeading && <h2>{item.label}</h2>}
        {item.html
          ? <div className="rc-tab-html" dangerouslySetInnerHTML={{ __html: item.html }} />
          : (
            <>
              {descriptionHtml
                ? <div className="rc-tab-html" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                : <p>{description}</p>}
              {keyFacts && (
                <table className="rc-facts-table">
                  <tbody>
                    {keyFacts.map((f, i) => {
                      const [label, value] = f.split(':')
                      return (
                        <tr key={i}>
                          <th><strong>{label}:</strong></th>
                          <td>{value}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
      </div>
    )
  }

  return (
    <div>
      <div className="rc-page-header">
        <div className="rc-page-header-inner">
          <div className="rc-header-left">
            <nav aria-label="Breadcrumb">
              <ol className="rc-breadcrumb">
                <li><Link to="/">Home</Link></li>
                {breadcrumbs.map((b, i) => (
                  <li key={b.to || b.label} className={i === breadcrumbs.length - 1 ? 'active' : ''}>
                    {i === breadcrumbs.length - 1 || !b.to
                      ? <span>{b.label}</span>
                      : <Link to={b.to}>{b.label}</Link>}
                  </li>
                ))}
              </ol>
            </nav>
            <h1 className="rc-page-title">{title}</h1>
            {description && <p className="rc-page-desc">{description}</p>}
          </div>
          <div className="rc-cat-banner">
            <img
              src={bannerImage || '/images/shared/category-banner.png'}
              alt="category-banner"
              onError={e => { e.target.src = '/images/shared/category-banner.png' }}
            />
          </div>
        </div>

        {tabItems.length > 0 && (
          <ul className="rc-tab-list">
            {tabItems.map((t, i) => (
              <li
                key={`${t.label}-${i}`}
                className={activeTab === i ? 'active' : ''}
                onClick={() => setActiveTab(activeTab === i ? null : i)}
              >{t.label}</li>
            ))}
          </ul>
        )}
      </div>

      {activeTab != null && tabItems[activeTab] && renderTabBody(tabItems[activeTab])}

      {loading && products.length === 0 && (
        <section className="rc-products">
          <p className="rc-page-desc" style={{ textAlign: 'center', padding: '2rem' }}>Loading collection…</p>
        </section>
      )}

      {error && !loading && (
        <section className="rc-products">
          <p className="rc-page-desc" style={{ textAlign: 'center', padding: '2rem' }}>{error}</p>
        </section>
      )}

      {showProducts && (
        <>
          <section className="rc-filters mt-4" ref={filtersRef}>
            <div className="rc-filters-container">
              {showFilterBar && (
                <div className="rc-filters-row">
                  <div className="rc-filter-col">
                    <div className="rc-ng-select-wrap">
                      <div className="rc-ng-select-container">
                        <div className="rc-ng-value-container">
                          <div className="rc-ng-placeholder">
                            {filters.sortBy === 'name-asc' ? 'Name: A to Z' : 'Sort By'}
                          </div>
                        </div>
                        <span className="rc-ng-arrow-wrapper"><span className="rc-ng-arrow" /></span>
                      </div>
                      <select
                        className="rc-ng-select-native"
                        value={filters.sortBy || ''}
                        onChange={e => updateFilters({ sortBy: e.target.value })}
                      >
                        <option value="">Sort By</option>
                        <option value="name-asc">Name: A to Z</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <h2 className="rc-collection-heading">Gems & Jewels Online Collection</h2>
            </div>
          </section>

          <section className="rc-products">
            {loading && products.length === 0 ? null : sortedProducts.length === 0 ? (
              <p className="rc-page-desc" style={{ textAlign: 'center', padding: '1.5rem 0 2.5rem' }}>
                No products match these filters.
              </p>
            ) : (
              <div className="rc-products-grid">
                {sortedProducts.map(p => {
                  const ProductTag = p.to && p.to !== '#' ? Link : 'a'
                  const linkProps = p.to && p.to !== '#'
                    ? { to: p.to }
                    : { href: '#' }
                  return (
                    <div className="rc-product" key={p.sku || p.id || p.name}>
                      <ProductTag className="rc-product-img-wrap" {...linkProps}>
                        <img
                          src={p.img}
                          alt={p.name}
                          className="rc-product-img"
                          loading="lazy"
                          onError={e => { e.target.src = '/images/shared/logo.jpg' }}
                        />
                        {p.inStock === false && <span className="rc-out-badge">Out of Stock</span>}
                      </ProductTag>
                      <button type="button" className="rc-wishlist-btn" aria-label="Add to wishlist">
                        <i className="fa-regular fa-heart" />
                      </button>
                      <ProductTag className="rc-product-name" {...linkProps}>{p.name}</ProductTag>
                      <div className="rc-product-details">
                        {p.sku && <p><span className="rc-param">Product Code: </span>{p.sku}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0 2.5rem' }}>
                <button
                  type="button"
                  className="rc-filter-btn"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {showChildren && (
        <section className="rc-products">
          <h2 className="rc-collection-heading">Gems & Jewels Online Collection</h2>
          <div className="rc-products-grid">
            {childrenCards.map(c => (
              <Link to={c.to} className="rc-product" key={c.to}>
                <span className="rc-product-img-wrap">
                  <img
                    src={c.img || '/images/shared/logo.jpg'}
                    alt={c.label}
                    className="rc-product-img"
                    loading="lazy"
                    onError={e => { e.target.src = '/images/shared/logo.jpg' }}
                  />
                </span>
                <span className="rc-product-name">{c.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && !showProducts && !showChildren && (
        <section className="rc-products">
          <h2 className="rc-collection-heading">Gems & Jewels Online Collection</h2>
          <div className="rc-products-grid">
            <div className="rc-product">
              <div className="rc-product-img-wrap">
                <img src="/images/shared/logo.jpg" alt={title} className="rc-product-img" />
              </div>
              <p className="rc-product-name">{title}</p>
              <div className="rc-product-details">
                <p>Products for this category will appear here. Contact us with the category name to enquire.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
