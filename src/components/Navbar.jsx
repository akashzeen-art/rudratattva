import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { navLinks } from '../data/categories'
import { useCart } from '../context/CartContext'
import '../App.css'

const PREVIEW_COUNT = 8
const HEADER_PREVIEW = 6
const SECTION_PREVIEW = 5

function LinkList({ links, onNavigate, preview, linkClassName }) {
  const list = links || []
  const visible = list.slice(0, preview)
  return (
    <ul>
      {visible.map(item => (
        <li key={item.to}>
          <Link to={item.to} className={linkClassName} onClick={onNavigate}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function MegaColumn({ col, onNavigate }) {
  if (col.sections?.length) {
    return (
      <div className="mega-col">
        {col.sections.map(sec => {
          const total = (sec.links || []).length
          const hasMore = total > SECTION_PREVIEW
          return (
            <div className="mega-section" key={sec.title}>
              <Link to={sec.to || '#'} className="mega-col-title" onClick={onNavigate}>
                {sec.title}
              </Link>
              <LinkList
                links={sec.links}
                onNavigate={onNavigate}
                preview={SECTION_PREVIEW}
              />
              {(hasMore || sec.to) && (
                <Link to={sec.to || '#'} className="mega-view-all" onClick={onNavigate}>
                  View All{hasMore ? ` (${total})` : ''}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (col.headerOnly) {
    return (
      <div className="mega-col mega-col-headers">
        <LinkList
          links={col.links}
          onNavigate={onNavigate}
          preview={HEADER_PREVIEW}
          linkClassName="mega-header-link"
        />
      </div>
    )
  }

  const total = (col.links || []).length
  const hasMore = total > PREVIEW_COUNT

  return (
    <div className="mega-col">
      {col.to ? (
        <Link to={col.to} className="mega-col-title" onClick={onNavigate}>{col.title}</Link>
      ) : (
        <p className="mega-col-title">{col.title}</p>
      )}
      <LinkList links={col.links} onNavigate={onNavigate} preview={PREVIEW_COUNT} />
      {(col.showViewAll || hasMore) && col.to && (
        <Link to={col.to} className="mega-view-all" onClick={onNavigate}>
          View All{hasMore ? ` (${total})` : ''}
        </Link>
      )}
    </div>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const { count } = useCart()

  const close = () => setOpenDropdown(null)

  return (
    <nav className="navbar">
      <div className="nav-middle">
        <NavLink to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <img src="/images/RudraTattvalogo.png" alt="Rudra Tattva" className="logo-desk" />
          <img src="/images/RudraTattvalogo.png" alt="Rudra Tattva" className="logo-mob" />
        </NavLink>

        <div className={`nav-search${searchOpen ? ' open' : ''}`}>
          <input type="text" placeholder="Search products by name or product code" />
          <button type="button" aria-label="Search"><i className="fa-solid fa-magnifying-glass" /></button>
        </div>

        <div className="nav-icons">
          <button type="button" className="icon-btn search-toggle" aria-label="Search" onClick={() => setSearchOpen(o => !o)}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <a href="#" aria-label="Wishlist"><i className="fa-regular fa-heart" /></a>
          <Link to="/cart" className="nav-cart" aria-label="Cart">
            <i className="fa-solid fa-cart-shopping" />
            {count > 0 && <span className="nav-cart-count">{count}</span>}
          </Link>
          <div className="currency-btn currency-india" aria-label="India">
            <img src="/images/shared/india.svg" alt="India" />
            <span>INR</span>
          </div>
          <button type="button" className="hamburger" aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
            <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} />
          </button>
        </div>
      </div>

      <div className="nav-bottom">
        <div className="nav-bottom-inner">
          {navLinks.map(l => {
            const cols = l.dropdown?.columns || []
            const hasDropdown = cols.length > 0
            const isOpen = hasDropdown && openDropdown === l.to
            if (!hasDropdown) {
              return (
                <NavLink key={l.to} to={l.to} className="nav-dropdown-trigger nav-simple-link">
                  {l.label}
                </NavLink>
              )
            }
            return (
              <div
                key={l.to}
                className={`nav-item-dropdown${isOpen ? ' is-open' : ''}`}
                onMouseEnter={() => setOpenDropdown(l.to)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <NavLink to={l.to} className="nav-dropdown-trigger">
                  {l.label} <i className="fa-solid fa-angle-down nav-arrow-icon" />
                </NavLink>

                {isOpen && (
                  <div className="mega-dropdown" style={{ '--mega-cols': cols.length }}>
                    <div className="mega-dropdown-inner">
                      {cols.map((col, i) => (
                        <MegaColumn
                          key={`${l.to}-${col.title || col.sections?.[0]?.title || i}`}
                          col={col}
                          onNavigate={close}
                        />
                      ))}
                    </div>
                    {l.dropdown?.footerLink && (
                      <div className="mega-footer-link">
                        <Link to={l.dropdown.footerLink.to} onClick={close}>
                          {l.dropdown.footerLink.label}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(l => (
            <div key={l.to} className="mobile-menu-group">
              <NavLink to={l.to} onClick={() => setMenuOpen(false)} className="mobile-menu-parent">
                {l.label}
              </NavLink>
              {(l.dropdown?.columns || []).flatMap((col, ci) => {
                const items = [
                  ...(col.links || []),
                  ...(col.sections || []).flatMap(s => s.links || []),
                ]
                if (col.title && col.to) items.unshift({ label: col.title, to: col.to })
                return items.slice(0, 6).map(item => (
                  <Link
                    key={`${ci}-${item.to}`}
                    to={item.to}
                    className="mobile-menu-sub"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))
              })}
              {l.dropdown?.columns?.length > 0 && (
                <Link to={l.to} className="mobile-menu-sub mobile-menu-viewall" onClick={() => setMenuOpen(false)}>
                  View all {l.label} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}
