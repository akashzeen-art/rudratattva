import { useState } from 'react'
import { Link } from 'react-router-dom'

const TABS = ['About', 'Benefits & Price', 'Who Should Wear', 'Identification & Maintenance', 'FAQs']

export default function RudrakshaListingPage({ title, breadcrumb, description, products, keyFacts, faqs }) {
  const [activeTab, setActiveTab] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [sortBy, setSortBy] = useState('')

  let filtered = [...products]
  if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price)
  if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price)
  if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="rc-page-header">
        <div className="rc-page-header-inner">
          <div className="rc-header-left">
            <nav aria-label="Breadcrumb">
              <ol className="rc-breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/rudraksha">Rudraksha</Link></li>
                <li><Link to="/p/rudraksha-1-mukhi---21-mukhi">Nepal Rudraksha</Link></li>
                {breadcrumb && <li className="active"><span>{breadcrumb}</span></li>}
              </ol>
            </nav>
            <h1 className="rc-page-title">{title}</h1>
            {description && <p className="rc-page-desc">{description}</p>}
          </div>
          <div className="rc-cat-banner">
            <img src="/images/shared/category-banner.png" alt="category-banner" onError={e => e.target.style.display = 'none'} />
          </div>
        </div>

        {/* Tabs */}
        <ul className="rc-tab-list">
          {TABS.map((t, i) => (
            <li
              key={t}
              className={activeTab === i ? 'active' : ''}
              onClick={() => setActiveTab(activeTab === i ? null : i)}
            >{t}</li>
          ))}
        </ul>
      </div>

      {/* ── Tab Panels ── */}
      {activeTab === 0 && (
        <div className="rc-tab-panel">
          <p>{description}</p>
          {keyFacts && (
            <table className="rc-facts-table">
              <tbody>
                {keyFacts
                  .filter((f) => !/bead\s*size|size\s*grade|carat|dimension|ratti/i.test(String(f)))
                  .map((f, i) => {
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
        </div>
      )}
      {activeTab === 1 && (
        <div className="rc-tab-panel">
          <h2>Benefits & Price</h2>
          <p>Explore the wide range of benefits and pricing options for {title}. Bigger sized beads work faster as they have more surface area in contact with skin, dispersing energy more quickly throughout the body.</p>
        </div>
      )}
      {activeTab === 2 && (
        <div className="rc-tab-panel">
          <h2>Who Should Wear</h2>
          <p>This Rudraksha is suitable for everyone seeking spiritual growth, mental clarity, and overall well-being. It is especially recommended for those with related planetary doshas in their horoscope.</p>
        </div>
      )}
      {activeTab === 3 && (
        <div className="rc-tab-panel">
          <h2>Identification & Maintenance</h2>
          <p>To identify an original Rudraksha, count the natural lines (mukhis) on the surface. Avoid fake tests like the water test or copper coin test. For maintenance, clean with lukewarm water and a soft brush, dry in shade, and apply natural unscented oil periodically.</p>
        </div>
      )}
      {activeTab === 4 && faqs && (
        <div className="rc-tab-panel">
          <div className="rc-accordion" id="listingFAQs">
            {faqs.map((f, i) => (
              <div className="rc-accordion-item" key={i}>
                <h2 className="rc-accordion-header">
                  <button
                    className={`rc-accordion-btn${openFaq === i ? '' : ' collapsed'}`}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <p className="rc-accordion-head">{f.q}</p>
                  </button>
                </h2>
                {openFaq === i && (
                  <div className="rc-accordion-body">
                    <p>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <section className="rc-filters mt-4">
        <div className="rc-filters-container">

          {/* Mobile toggle row */}
          <div className="rc-filters-toggle-row">
            <p>Apply Filters</p>
            <button className="rc-filter-btn">
              <i className="fa-solid fa-filter" style={{color:'#fff',marginRight:4}}></i> Filters
            </button>
          </div>

          {/* Desktop filter row */}
          <div className="rc-filters-row">
            {/* Price */}
            {/* Sort By */}
            <div className="rc-filter-col">
              <div className="rc-ng-select-wrap">
                <div className="rc-ng-select-container">
                  <div className="rc-ng-value-container">
                    <div className="rc-ng-placeholder">
                      {sortBy === 'name-asc' ? 'Name: A to Z' : 'Sort By'}
                    </div>
                  </div>
                  <span className="rc-ng-arrow-wrapper"><span className="rc-ng-arrow"></span></span>
                </div>
                <select
                  className="rc-ng-select-native"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="">Sort By</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          <h2 className="rc-collection-heading">Gems & Jewels Online Collection</h2>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="rc-products">
        <div className="rc-products-grid">
          {filtered.map(p => (
            <div className="rc-product" key={p.sku || p.id}>
              <a className="rc-product-img-wrap" href="#">
                <img
                  src={p.img}
                  alt={p.name}
                  className="rc-product-img"
                  loading="lazy"
                  onError={e => { e.target.src = '/images/shared/logo.jpg' }}
                />
                {!p.inStock && <span className="rc-out-badge">Out of Stock</span>}
              </a>
              <button className="rc-wishlist-btn" aria-label="Add to wishlist">
                <i className="fa-regular fa-heart"></i>
              </button>
              <a className="rc-product-name" href="#">{p.name}</a>
              <div className="rc-product-details">
                {p.sku && <p><span className="rc-param">Product Code: </span>{p.sku}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
