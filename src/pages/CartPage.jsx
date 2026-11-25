import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatInr } from '../api/product'

const WHATSAPP = '918929728030'

function buildOrderMessage(items, subtotal) {
  const lines = [
    'Namaste. I would like to place an order from Rudra Tattva.',
    '',
    ...items.map((item, i) => {
      const opts = item.options?.length ? ` (${item.options.join('; ')})` : ''
      const code = item.code ? ` [${item.code}]` : ''
      const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0)
      return `${i + 1}. ${item.name}${code}${opts} × ${item.quantity} = INR ${formatInr(lineTotal)}`
    }),
    '',
    `Subtotal: INR ${formatInr(subtotal)}`,
    '',
    'Please confirm availability and payment details.',
  ]
  return lines.join('\n')
}

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart, count } = useCart()

  if (!items.length) {
    return (
      <section className="pd-cart-page">
        <h1>Your Cart</h1>
        <p className="pd-cart-empty">Your cart is empty.</p>
        <div className="pd-cart-empty-actions">
          <Link to="/rudraksha" className="pd-btn pd-btn-solid">Shop Rudraksha</Link>
          <Link to="/gemstones" className="pd-btn pd-btn-outline">Shop Gemstones</Link>
        </div>
      </section>
    )
  }

  const hasMissingPrice = items.some(item => !(Number(item.unitPrice) > 0))
  const checkoutHref = `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(buildOrderMessage(items, subtotal))}`

  return (
    <section className="pd-cart-page">
      <div className="pd-cart-head">
        <h1>Your Cart ({count})</h1>
        <button type="button" className="pd-link-btn" onClick={clearCart}>Clear cart</button>
      </div>

      {hasMissingPrice && (
        <p className="pd-cart-warning">
          Some items have no price. Remove them and add again from the product page after selecting size / variation.
        </p>
      )}

      <div className="pd-cart-list">
        {items.map(item => {
          const unit = Number(item.unitPrice) || 0
          const lineTotal = unit * (item.quantity || 0)
          return (
            <article className="pd-cart-row" key={item.lineKey}>
              <Link to={`/${item.slug}`} className="pd-cart-thumb">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={e => { e.target.src = '/images/RudraTattvalogo.png' }}
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
                <p className="pd-cart-unit">
                  {unit > 0 ? `INR ${formatInr(unit)} each` : 'Price unavailable'}
                </p>
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
                <p className="pd-cart-price">
                  {unit > 0 ? `INR ${formatInr(lineTotal)}` : '—'}
                </p>
                <button
                  type="button"
                  className="pd-link-btn"
                  onClick={() => removeItem(item.lineKey)}
                >
                  Remove
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="pd-cart-summary">
        <p>Subtotal <strong>INR {formatInr(subtotal)}</strong></p>
        <p className="pd-cart-summary-note">Taxes &amp; shipping confirmed on WhatsApp</p>
        <a
          className={`pd-btn pd-btn-solid${hasMissingPrice || subtotal <= 0 ? ' is-disabled' : ''}`}
          href={hasMissingPrice || subtotal <= 0 ? undefined : checkoutHref}
          target="_blank"
          rel="noreferrer"
          aria-disabled={hasMissingPrice || subtotal <= 0}
          onClick={e => {
            if (hasMissingPrice || subtotal <= 0) e.preventDefault()
          }}
        >
          Proceed to Checkout
        </a>
        <Link to="/" className="pd-link-btn">Continue Shopping</Link>
      </div>
    </section>
  )
}
