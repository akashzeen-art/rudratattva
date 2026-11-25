import '../App.css'

const whyItems = [
  ['Credibility Since 1997', '/images/shared/credibility.svg'],
  ['Fastest Delivery', '/images/shared/fastest-delivery.svg'],
  ['Expert Advise & Counselling', '/images/shared/expert-advise-and-counselling.svg'],
  ['Worldwide Distribution', '/images/shared/worldwide-distribution-network.svg'],
  ['Vedic Pooja Energisation', '/images/shared/vedic-pooja-energization.svg'],
  ['100,000+ Testimonials', '/images/shared/testimonials.svg'],
]

const affiliations = [
  ['/images/shared/gia.png', 'GIA'],
  ['/images/shared/gjepc-india.png', 'GJEPC India'],
  ['/images/shared/international-gemological-institute.png', 'International Gemological Institute'],
  ['/images/shared/aigs.png', 'AIGS'],
]

export default function PageLayout({ title, description, children }) {
  return (
    <>
      <div className="page-banner">
        <p className="breadcrumb">Home &gt; <span>{title}</span></p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <section className="product-section">
        <p className="section-title">Our {title} Collection</p>
        <div className="product-grid">{children}</div>
      </section>

      <section className="why-section">
        <h2>Why Choose Us?</h2>
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
          World's Oldest &amp; Most Trusted Website on Rudraksha, Gemstone, Pujas, Spiritual Products &amp; Services.
          Achieve Healing, Empowerment &amp; Success With RRCT.
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

      <section className="affiliations">
        <h2>Affiliations</h2>
        <div className="affil-logos">
          {affiliations.map(([src, alt]) => (
            <img key={alt} src={src} alt={alt} />
          ))}
        </div>
      </section>
    </>
  )
}
