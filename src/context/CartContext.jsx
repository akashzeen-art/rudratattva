import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getRegularParentForProduct } from '../data/rudrakshaRegular'
import { getGemstoneDisplayForProduct } from '../data/gemstoneBuy'

const CartContext = createContext(null)
const STORAGE_KEY = 'rudra-tattva-cart'

function toMoney(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function localThumbForSlug(slug = '', fallback = '') {
  const s = String(slug || '').replace(/^\//, '')
  const rudra = getRegularParentForProduct(s)
  if (rudra?.img?.startsWith('/image/')) return rudra.img
  const gem = getGemstoneDisplayForProduct(s)
  if (gem?.img?.startsWith('/image/')) return gem.img
  if (String(fallback || '').startsWith('/image/')) return fallback
  return fallback || '/images/gems-and-jewels-logo.png'
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null
  const quantity = Math.max(1, Number(item.quantity) || 1)
  const slug = item.slug || ''
  return {
    lineKey: String(item.lineKey || `${slug || 'item'}|${item.productId || 'p'}`),
    productId: item.productId ?? null,
    slug,
    name: item.name || 'Product',
    code: item.code || '',
    image: localThumbForSlug(slug, item.image),
    unitPrice: toMoney(item.unitPrice),
    quantity,
    options: Array.isArray(item.options) ? item.options.filter(Boolean) : [],
  }
}

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeItem).filter(Boolean)
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    // Drop legacy lines saved without a valid price so cart totals stay correct
    return readCart().filter(item => item.unitPrice > 0)
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (raw) => {
    const item = normalizeItem(raw)
    if (!item) return false
    if (!item.slug || !item.name) return false

    setItems(prev => {
      const existing = prev.find(p => p.lineKey === item.lineKey)
      if (existing) {
        return prev.map(p =>
          p.lineKey === item.lineKey
            ? {
                ...p,
                ...item,
                quantity: p.quantity + item.quantity,
                // Prefer a real price if an older line was saved as 0
                unitPrice: item.unitPrice > 0 ? item.unitPrice : p.unitPrice,
              }
            : p
        )
      }
      return [...prev, item]
    })
    return true
  }

  const updateQuantity = (lineKey, quantity) => {
    const nextQty = Number(quantity)
    setItems(prev =>
      prev
        .map(p => (p.lineKey === lineKey ? { ...p, quantity: Math.max(1, nextQty || 1) } : p))
        .filter(p => p.quantity > 0)
    )
  }

  const removeItem = (lineKey) => {
    setItems(prev => prev.filter(p => p.lineKey !== lineKey))
  }

  const clearCart = () => setItems([])

  const count = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + toMoney(item.unitPrice) * (item.quantity || 0), 0),
    [items]
  )

  const value = {
    items,
    count,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
