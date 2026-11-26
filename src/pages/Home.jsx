import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const banners = [
  {
    src: '/image/gemstone/01-yellow-sapphire-stone.jpg',
    alt: 'Natural gemstones from Gems & Jewels',
    title: 'Gemstones for every path',
    text: 'Fine natural, unheated and untreated stones chosen for clarity and energy.',
    cta: { to: '/p/natural-jyotish-gemstones', label: 'Shop Gemstones' },
    focus: 'center',
  },
  {
    src: '/image/idol/01-brass-idols.jpg',
    alt: 'Sacred idols from Gems & Jewels',
    title: 'Sacred idols for your altar',
    text: 'Brass, bronze and silver idols chosen for home, puja and spiritual practice.',
    cta: { to: '/idols', label: 'Explore Collection' },
    focus: 'left',
  },
  {
    src: '/image/rudraksh/01-nepal-rudraksha.jpg',
    alt: 'Handpicked Rudraksha beads',
    title: 'Handpicked Rudraksha beads',
    text: 'Nepal and Indonesia beads, energized with care before they reach you.',
    cta: { to: '/rudraksha', label: 'Shop Rudraksha' },
    focus: 'right',
  },
]

const rudrakshaCollections = [
  {
    name: 'Nepal Rudraksha',
    text: '1 to 21 Mukhi beads from Nepal',
    img: '/image/rudraksh/01-nepal-rudraksha.jpg',
    to: '/p/rudraksha-1-mukhi---21-mukhi',
  },
  {
    name: 'Java Rudraksha',
    text: 'Indonesian beads for daily wear',
    img: '/image/rudraksh/02-java-indonesian-rudraksha.jpg',
    to: '/p/rudraksha-1-mukhi-21-mukhi-java-indonesia',
  },
  {
    name: 'Rudraksha Bracelets',
    text: 'Mukhi bracelets ready to wear',
    img: '/image/rudraksh/03-rudraksha-bracelets.jpg',
    to: '/p/rudraksha-bracelets',
  },
  {
    name: 'Malas & Kanthas',
    text: 'Sacred malas for japa and blessing',
    img: '/image/rudraksh/04-rudraksha-malas-kanthas.jpg',
    to: '/p/rudraksha-kantha-rudraksha-mala',
  },
]

const featuredGemstones = [
  {
    name: 'Yellow Sapphire Stone',
    img: '/image/gemstone/01-yellow-sapphire-stone.jpg',
    to: '/buy/yellow-sapphire-pukhraj-3-22-carats',
  },
  {
    name: 'Blue Sapphire Stone',
    img: '/image/gemstone/02-blue-sapphire-stone.jpg',
    to: '/buy/natural-blue-sapphire-1.01-carats',
  },
  {
    name: 'Emerald Stone',
    img: '/image/gemstone/04-emerald-stone.jpg',
    to: '/buy/emerald-zambian-0-68-carats',
  },
  {
    name: 'Ruby Stone',
    img: '/image/gemstone/05-ruby-stone.jpg',
    to: '/buy/indian-ruby-1-45-carats',
  },
  {
    name: 'Gomed Stone',
    img: '/image/gemstone/07-gomed-stone.jpg',
    to: '/buy/indian-oval-gomed-3-to-4-carats',
  },
  {
    name: 'Red Coral (Italy)',
    img: '/image/gemstone/06-red-coral-italy.jpg',
    to: '/buy/red-italian-coral-gemstone-3-05-carats',
  },
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
          <p className="hero-brand">Gems & Jewels</p>
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

      <section className="trust-strip" aria-label="Why Gems & Jewels">
        <div className="trust-strip-inner">
          <p>Handpicked authenticity</p>
          <span aria-hidden="true" />
          <p>Vedic energisation</p>
          <span aria-hidden="true" />
          <p>Panditji guidance</p>
          <span aria-hidden="true" />
          <p>Secure checkout</p>
        </div>
      </section>

      <section className="home-section reveal-section">
        <div className="home-container">
          <p className="home-sublabel">From our catalogue</p>
          <h2 className="home-heading">Rudraksha Collections</h2>
          <p className="home-lead">
            Nepal beads, Java beads, bracelets and malas — chosen for purity and energised with care.
          </p>
          <div className="home-feature-grid">
            {rudrakshaCollections.map((item) => (
              <Link to={item.to} className="home-feature-card" key={item.to}>
                <span className="home-feature-media">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </span>
                <span className="home-feature-copy">
                  <strong>{item.name}</strong>
                  <em>{item.text}</em>
                </span>
              </Link>
            ))}
          </div>
          <div className="home-section-cta">
            <Link to="/rudraksha" className="btn-primary">View all Rudraksha</Link>
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt reveal-section">
        <div className="home-container">
          <p className="home-sublabel">Natural loose stones</p>
          <h2 className="home-heading">Jyotish Gemstones</h2>
          <p className="home-lead">
            Planetary gemstones from our Natural Loose Gemstones collection — open price and add to cart directly.
          </p>
          <div className="home-gem-grid">
            {featuredGemstones.map((item) => (
              <Link to={item.to} className="home-gem-card" key={item.to}>
                <span className="home-gem-media">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </span>
                <span className="home-gem-name">{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="home-section-cta">
            <Link to="/p/natural-jyotish-gemstones" className="btn-primary">View all Gemstones</Link>
          </div>
        </div>
      </section>

      <section className="pandit-banner-section reveal-section">
        <div className="pandit-banner">
          <div className="pandit-banner-media">
            <img
              src="/image/pujas/Navgraha Puja and Dosh Nivaran Altar-1.png"
              alt="Speak with Panditji at Gems & Jewels"
              loading="lazy"
            />
          </div>
          <div className="pandit-banner-content">
            <p className="pandit-banner-eyebrow">Consultation</p>
            <h2>Speak with Panditji</h2>
            <p>
              Get personal Vedic guidance for Rudraksha, gemstones, pujas and life decisions from
              experienced pandits — available online through Gems & Jewels.
            </p>
            <div className="pandit-banner-actions">
              <Link to="/consultation" className="btn-primary">Book Consultation</Link>
              <Link to="/contact-us" className="btn-outline">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
