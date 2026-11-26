import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const WHATSAPP = '918929728030'

function buildOrderMessage(items) {
  const lines = [
    'Namaste. I would like to place an order from Gems & Jewels.',
    '',
    ...items.map((item, i) => {
      const opts = item.options?.length ? ` (${item.options.join('; ')})` : ''
      const code = item.code ? ` [${item.code}]` : ''
      return `${i + 1}. ${item.name}${code}${opts} × ${item.quantity}`
    }),
    '',
    'Please confirm availability, pricing, and payment details.',
  ]
  return lines.join('\n')
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, count } = useCart()

  if (!items.length) {
    return (
      <section className="pd-cart-page">
        <h1>Your Cart</h1>
        <p className="pd-cart-empty">Your cart is empty.</p>
        <div className="pd-cart-empty-actions">
          <Link to="/rudraksha" className="pd-btn pd-btn-solid">Shop Rudraksha</Link>
          <Link to="/p/natural-jyotish-gemstones" className="pd-btn pd-btn-outline">Shop Gemstones</Link>
        </div>
      </section>
    )
  }

  const checkoutHref = `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(buildOrderMessage(items))}`

  return (
    <section className="pd-cart-page">
      <div className="pd-cart-head">
        <h1>Your Cart ({count})</h1>
        <button type="button" className="pd-link-btn" onClick={clearCart}>Clear cart</button>
      </div>

      <div className="pd-cart-list">
        {items.map(item => (
          <article className="pd-cart-row" key={item.lineKey}>
            <Link to={`/${item.slug}`} className="pd-cart-thumb">
              <img
                src={item.image}
                alt={item.name}
                onError={e => { e.target.src = '/images/gems-and-jewels-logo.png' }}
              />
            </Link>
            <div className="pd-cart-info">
              <Link to={`/${item.slug}`} className="pd-cart-name">{item.name}</Link>
              {item.code && <p>Code: {item.code}</p>}
              {item.options?.length > 0 && (
                <ul className="pd-cart-options">
                  {item.options.map(opt => <li key={opt}>{opt}</li>)}
                </ul>
              )}
              <div className="pd-cart-qty">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.lineKey, item.quantity - 1)}
                  aria-label="Decrease"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.lineKey, item.quantity + 1)}
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
            </div>
            <div className="pd-cart-side">
              <button
                type="button"
                className="pd-link-btn"
                onClick={() => removeItem(item.lineKey)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="pd-cart-summary">
        <p className="pd-cart-summary-note">Pricing, taxes &amp; shipping confirmed on WhatsApp</p>
        <a
          className="pd-btn pd-btn-solid"
          href={checkoutHref}
          target="_blank"
          rel="noreferrer"
        >
          Proceed to Checkout
        </a>
        <Link to="/" className="pd-link-btn">Continue Shopping</Link>
      </div>
    </section>
  )
}
