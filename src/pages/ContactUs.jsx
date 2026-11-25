import { Link } from 'react-router-dom'
import '../App.css'

const WHATSAPP = '918929728030'

export default function ContactUs() {
  return (
    <div className="contact-page">
      <div className="rc-page-header">
        <div className="rc-page-header-inner">
          <div className="rc-header-left">
            <nav aria-label="Breadcrumb">
              <ol className="rc-breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li className="active"><span>Contact Us</span></li>
              </ol>
            </nav>
            <h1 className="rc-page-title">Contact Us</h1>
            <p className="rc-page-desc">
              Reach Rudra Tattva for product orders, puja services, and consultation enquiries.
            </p>
          </div>
        </div>
      </div>

      <section className="contact-section">
        <div className="contact-card">
          <h2>Company</h2>
          <p className="contact-company">Forte Digital Solutions LLP</p>

          <div className="contact-rows">
            <div className="contact-row">
              <span className="contact-icon" aria-hidden="true">📍</span>
              <div>
                <h3>Address</h3>
                <p>
                  417, 4th Floor, Tower A, Spaze I Tech Park, Sohna Road,
                  Gurugram, Haryana - 122018
                </p>
              </div>
            </div>

            <div className="contact-row">
              <span className="contact-icon" aria-hidden="true">✉️</span>
              <div>
                <h3>Email</h3>
                <p>
                  <a href="mailto:info@fortedigitalsolutions.com">
                    info@fortedigitalsolutions.com
                  </a>
                </p>
              </div>
            </div>

            <div className="contact-row">
              <span className="contact-icon" aria-hidden="true">📞</span>
              <div>
                <h3>Phone</h3>
                <p>
                  <a href="tel:+918929728030">+91 89297 28030</a>
                </p>
              </div>
            </div>
          </div>

          <div className="contact-actions">
            <a
              className="pd-btn pd-btn-whatsapp"
              href={`https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent('Namaste. I would like to enquire with Rudra Tattva.')}`}
              target="_blank"
              rel="noreferrer"
            >
              <i className="fab fa-whatsapp" /> WhatsApp Us
            </a>
            <Link to="/consultation" className="pd-btn pd-btn-solid">
              Speak with Panditji
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
