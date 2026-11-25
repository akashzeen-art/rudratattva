import { Link } from 'react-router-dom'
import '../App.css'

export default function ComingSoon({ title = 'This Page' }) {
  return (
    <main>
      <div className="page-banner">
        <p className="breadcrumb">Home &gt; <span>{title}</span></p>
        <h1>{title}</h1>
        <p>
          This section is being prepared to match the full Rudraksha Ratna catalogue.
          Browse related categories below or contact us for product availability.
        </p>
      </div>
      <section className="home-section">
        <div className="home-container" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 20, color: '#555' }}>
            Looking for something specific? Our team can help you with authentic products and RRCT recommendations.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rudraksha" className="btn-sm">Browse Rudraksha</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
