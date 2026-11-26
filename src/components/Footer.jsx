import { Link } from 'react-router-dom'
import '../App.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/images/gems-and-jewels-logo.png" alt="Gems & Jewels" />
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
              <li><Link to="/p/natural-jyotish-gemstones">Gemstones</Link></li>
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
              Call:{' '}
              <a href="tel:+918929728030">+91 89297 28030</a>
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>All Rights Reserved | Copyright © Gems & Jewels</p>
      </div>
    </footer>
  )
}
