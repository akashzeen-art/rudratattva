import { Link } from 'react-router-dom'
import '../App.css'

const WA = '918929728030'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/images/RudraTattvalogo.png" alt="Rudra Tattva" />
          <p>
            Authentic Rudraksha, gemstones, yantras, idols and Vedic puja services —
            guided by tradition and care.
          </p>
        </div>

        <div className="footer-grid footer-grid-3">
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/rudraksha">Rudraksha</Link></li>
              <li><Link to="/gemstones">Gemstones</Link></li>
              <li><Link to="/yantra">Yantras</Link></li>
              <li><Link to="/idols">Idols</Link></li>
              <li><Link to="/pujas">Pujas</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Guidance</h4>
            <ul>
              <li><Link to="/consultation">Speak with Panditji</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/cart">Cart</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Reach Us</h4>
            <p className="footer-addr">
              Forte Digital Solutions LLP<br />
              WhatsApp / Call:{' '}
              <a href="tel:+918929728030">+91 89297 28030</a>
            </p>
            <a
              className="footer-wa"
              href={`https://api.whatsapp.com/send?phone=${WA}&text=${encodeURIComponent('Namaste. I would like to enquire with Rudra Tattva.')}`}
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-brands fa-whatsapp" aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>All Rights Reserved | Copyright © Rudra Tattva</p>
      </div>
    </footer>
  )
}
