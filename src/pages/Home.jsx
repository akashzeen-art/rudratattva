import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const banners = [
  {
    src: '/images/hero1.png',
    alt: 'Natural gemstones from Rudra Tattva',
    title: 'Gemstones for every path',
    text: 'Fine natural, unheated and untreated stones chosen for clarity and energy.',
    cta: { to: '/gemstones', label: 'Shop Gemstones' },
    focus: 'center',
  },
  {
    src: '/images/hero2.png',
    alt: 'Gandaki River Shaligram Shila',
    title: 'Sacred Gandaki Shaligram',
    text: 'Authentic Shila for puja, home and spiritual practice.',
    cta: { to: '/idols', label: 'Explore Collection' },
    focus: 'left',
  },
  {
    src: '/images/hero3.png',
    alt: 'Handpicked Rudraksha beads',
    title: 'Handpicked Rudraksha beads',
    text: 'Nepal and Indonesia beads, energized with care before they reach you.',
    cta: { to: '/rudraksha', label: 'Shop Rudraksha' },
    focus: 'right',
  },
]

const mainCategories = [
  { to: '/rudraksha', img: '/images/rudraksha/1-to-21-mukhi-nepal-rudraksha-category-thumbnail_206520.jpg', label: 'Rudraksha' },
  { to: '/gemstones', img: '/images/gemstones/Gemstone-Category-thumbnail_227288.jpg', label: 'Gemstones' },
  { to: '/yantra', img: '/images/yantra/Desktop-Yantras_219077.jpg', label: 'Yantras' },
  { to: '/idols', img: '/images/idols/brass-new_110599.jpg', label: 'Idols' },
  { to: '/pujas', img: '/images/pujas/1---Maha-Pujas_88533.jpg', label: 'Pujas' },
  { to: '/consultation', img: '/images/home/consultations/astrology.jpg', label: 'Consultation' },
]

const specialProducts = [
  { name: 'Collector Trijuti Nepal Rudraksha - XVII', price: 'INR 38,00,000', code: 'CT62', img: '/images/home/products/ct62.jpg', to: '/rudraksha' },
  { name: 'Super Collector 22 Mukhi Nepal Rudraksha', price: 'INR 32,00,000', code: 'SCB22A', img: '/images/home/products/scb22a.jpg', to: '/rudraksha' },
  { name: 'Natural Dakshinavarti Laxmi Shankh – 202 gms', price: 'INR 51,00,000', code: 'RHS31', img: '/images/home/products/rhs31.jpg', to: '/rudraksha' },
  { name: 'Super Collector 21 Mukhi Nepal Rudraksha', price: 'Contact for Price', code: 'SCB21B', img: '/images/home/products/scb21b.jpg', to: '/rudraksha' },
  { name: 'Yellow Sapphire - 11.49 Carats', price: 'INR 10,57,655', code: 'YS467', img: '/images/home/products/ys467.jpg', to: '/gemstones' },
  { name: 'Sphatik Meru Shree Yantra - 1135 gms', price: 'INR 2,41,000', code: 'SSY59', img: '/images/home/products/ssy59.jpg', to: '/yantra' },
]

const mahapujas = [
  { name: 'Kaal Bhairav Jayanti Mahapuja 1st Dec 2026', img: '/images/home/pujas/kaal-bhairav.jpg', to: '/p/maha-anushthan-pujas' },
  { name: 'Mangalam Navagraha Shanti New Year Mahapuja 23 Dec', img: '/images/home/pujas/navagraha-newyear.jpg', to: '/p/maha-anushthan-pujas' },
]

const popularPujas = [
  { name: 'Navagraha Shanti Puja Vidhanam and Homam', price: 'INR 9,501 - 74,501', img: '/images/home/pujas/navagraha.jpg', to: '/p/navgraha-dosh-nivaran-pujas' },
  { name: 'Ann Daan (Food Donation)', price: 'INR 8,801 - 88,101', img: '/images/home/pujas/ann-daan.jpg', to: '/pujas' },
  { name: 'Lakshmi Kuber Maha Anusthaan (9 Kunda Homa)', price: 'INR 2,51,000 - 8,15,000', img: '/images/home/pujas/lakshmi-kuber.jpg', to: '/p/maha-anushthan-pujas' },
  { name: 'Maharudra Maha Anushtaan', price: 'INR 2,51,000', img: '/images/home/pujas/maharudra.jpg', to: '/p/maha-anushthan-pujas' },
]

const HERO_MS = 6500

export default function Home() {
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    const t = setInterval(() => setSlide(s => (s + 1) % banners.length), HERO_MS)
    return () => clearInterval(t)
  }, [paused, slide])

  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal-section')
    if (!nodes.length || typeof IntersectionObserver === 'undefined') {
      nodes.forEach(n => n.classList.add('is-visible'))
      return undefined
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])

  const go = (next) => {
    setSlide((next + banners.length) % banners.length)
  }

  const current = banners[slide]

  return (
    <main className="home">
      <section
        className="hero-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
        aria-label="Featured collections"
      >
        <div className="hero-media">
          {banners.map((b, i) => (
            <div
              key={b.src}
              className={`hero-slide${i === slide ? ' active' : ''}`}
              aria-hidden={i !== slide}
            >
              <img
                src={b.src}
                alt={b.alt}
                className={`hero-slide-img focus-${b.focus || 'center'}`}
              />
            </div>
          ))}
          <div className="hero-veil" aria-hidden="true" />
        </div>

        <div className="hero-content" key={slide}>
          <p className="hero-brand">Rudra Tattva</p>
          <h1 className="hero-title">{current.title}</h1>
          <p className="hero-text">{current.text}</p>
          <div className="hero-actions">
            <Link to={current.cta.to} className="btn-primary">{current.cta.label}</Link>
            <Link to="/consultation" className="btn-outline hero-btn-ghost">Speak with Panditji</Link>
          </div>
        </div>

        <button
          type="button"
          className="hero-nav prev"
          aria-label="Previous slide"
          onClick={() => go(slide - 1)}
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        <button
          type="button"
          className="hero-nav next"
          aria-label="Next slide"
          onClick={() => go(slide + 1)}
        >
          <i className="fa-solid fa-chevron-right" />
        </button>

        <div className="hero-footer">
          <div className="hero-dots" role="tablist" aria-label="Choose slide">
            {banners.map((b, i) => (
              <button
                key={b.src}
                type="button"
                role="tab"
                aria-selected={i === slide}
                className={i === slide ? 'active' : ''}
                aria-label={b.title}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="hero-progress" aria-hidden="true">
            <span
              key={`${slide}-${paused}`}
              className={`hero-progress-bar${paused ? ' is-paused' : ''}`}
              style={{ animationDuration: `${HERO_MS}ms` }}
            />
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Why Rudra Tattva">
        <div className="trust-strip-inner">
          <p>Handpicked authenticity</p>
          <span aria-hidden="true" />
          <p>Vedic energisation</p>
          <span aria-hidden="true" />
          <p>Panditji guidance</p>
          <span aria-hidden="true" />
          <p>Secure WhatsApp checkout</p>
        </div>
      </section>

      <section className="home-section reveal-section">
        <div className="home-container">
          <h2 className="home-heading">Shop by Category</h2>
          <div className="cat-row cat-row-main">
            {mainCategories.map(c => (
              <Link to={c.to} className="cat-card" key={c.to}>
                <img src={c.img} alt={c.label} loading="lazy" />
                <span>{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt reveal-section">
        <div className="home-container">
          <h2 className="home-heading">Explore Products</h2>
          <p className="home-sublabel">Special Products</p>
          <div className="special-grid">
            {specialProducts.map(p => (
              <Link to={p.to} className="special-card" key={p.code}>
                <div className="special-img">
                  <img src={p.img} alt={p.name} loading="lazy" />
                </div>
                <h3>{p.name}</h3>
                <p className="special-price">{p.price}</p>
                <p className="special-code">Product Code: {p.code}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pandit-banner-section reveal-section">
        <div className="pandit-banner">
          <div className="pandit-banner-media">
            <img
              src="/images/home/consultations/astrology.jpg"
              alt="Speak with Panditji at Rudra Tattva"
              loading="lazy"
            />
          </div>
          <div className="pandit-banner-content">
            <p className="pandit-banner-eyebrow">Consultation</p>
            <h2>Speak with Panditji</h2>
            <p>
              Get personal Vedic guidance for Rudraksha, gemstones, pujas and life decisions from
              experienced pandits — available online through Rudra Tattva.
            </p>
            <div className="pandit-banner-actions">
              <Link to="/consultation" className="btn-primary">Book Consultation</Link>
              <Link to="/contact-us" className="btn-outline">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section reveal-section">
        <div className="home-container">
          <h2 className="home-heading">Rudra Tattva Puja Services</h2>
          <h3 className="home-subheading">Upcoming Mahapujas</h3>
          <div className="puja-row">
            {mahapujas.map(p => (
              <Link to={p.to} className="puja-card" key={p.name}>
                <img src={p.img} alt={p.name} loading="lazy" />
                <div className="puja-card-body">
                  <h4>{p.name}</h4>
                  <span className="btn-sm">Book now</span>
                </div>
              </Link>
            ))}
          </div>
          <h3 className="home-subheading">Popular Individual Pujas</h3>
          <div className="puja-grid">
            {popularPujas.map(p => (
              <Link to={p.to} className="puja-card" key={p.name}>
                <img src={p.img} alt={p.name} loading="lazy" />
                <div className="puja-card-body">
                  <h4>{p.name}</h4>
                  <p className="special-price">{p.price}</p>
                  <span className="btn-sm">Book Now</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
