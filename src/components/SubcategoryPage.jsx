import { Link } from 'react-router-dom'
import '../App.css'

const whyItems = [
  ['Credibility Since 1997', '/images/shared/credibility.svg'],
  ['Fastest Delivery', '/images/shared/fastest-delivery.svg'],
  ['Expert Advise & Counselling', '/images/shared/expert-advise-and-counselling.svg'],
  ['Worldwide Distribution', '/images/shared/worldwide-distribution-network.svg'],
  ['Vedic Pooja Energisation', '/images/shared/vedic-pooja-energization.svg'],
  ['100,000+ Testimonials', '/images/shared/testimonials.svg'],
]

export default function SubcategoryPage({ title, parent, parentTo, img, description }) {
  return (
    <main>
      <div className="page-banner">
        <p className="breadcrumb">
          Home &gt; <Link to={parentTo}>{parent}</Link> &gt; <span>{title}</span>
        </p>
        <h1>{title}</h1>
        <p>
          {description ||
            `Explore our authentic collection of ${title} at Gems & Jewels. All products are carefully selected, quality-checked and energized as per Vedic traditions before dispatch.`}
        </p>
      </div>

      <section className="product-section">
        <p className="section-title">Gems & Jewels Online Collection</p>
        <div className="product-grid">
          <div className="product-card">
            <img src={img || '/images/shared/logo.jpg'} alt={title} />
            <p className="p-name">{title}</p>
            <div className="p-info">
              <p className="p-sku">Category collection</p>
              <button type="button" className="p-btn">Enquire Now</button>
            </div>
          </div>
        </div>
      </section>

      <section className="why-section">
        <h2>Why Choose Us?</h2>
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
          World&apos;s Oldest &amp; Most Trusted Website on Rudraksha, Gemstone, Pujas, Spiritual Products &amp; Services.
        </p>
        <div className="why-grid">
          {whyItems.map(([label, icon]) => (
            <div className="why-item" key={label}>
              <img src={icon} alt={label} />
              {label}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
