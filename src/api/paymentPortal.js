/** Drishhya payment APIs — always hit production domain (never localhost). */
export const PAYMENT_PORTAL_ID = 1034
export const PAYMENT_API_ORIGIN = 'https://drishhya.live'

export function createClickId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `click-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/**
 * GET https://drishhya.live/api/payment/portal/{portalId}?clickid={clickId}
 * Fetch plans/prices and record campaign click.
 */
export async function fetchPaymentPortal({
  portalId = PAYMENT_PORTAL_ID,
  clickId = createClickId(),
} = {}) {
  const url =
    `${PAYMENT_API_ORIGIN}/api/payment/portal/${encodeURIComponent(portalId)}`
    + `?clickid=${encodeURIComponent(clickId)}`

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    mode: 'cors',
    credentials: 'omit',
  })
  if (!res.ok) {
    throw new Error(`Payment portal unavailable (${res.status})`)
  }
  const data = await res.json()
  return {
    portalId: Number(data.portalId ?? portalId),
    clickId,
    portalName: data.portalName || '',
    pgName: data.pgName || '',
    currencyCode: data.currencyCode || 'INR',
    plans: parsePlans(data),
    raw: data,
  }
}

/**
 * POST https://drishhya.live/api/payment/initiate
 * Form fields → browser navigates to payment gateway (bypasses CORS).
 */
export function initiatePaymentRedirect({
  portalId = PAYMENT_PORTAL_ID,
  mobile,
  email = '',
  clickId,
  servicePack,
  amount,
} = {}) {
  const msisdn = String(mobile || '').replace(/\D/g, '')
  if (!msisdn) throw new Error('Mobile number required')
  if (!clickId) throw new Error('Click ID required')
  if (!servicePack) throw new Error('Service pack required')
  if (amount == null || amount === '') throw new Error('Amount required')

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = `${PAYMENT_API_ORIGIN}/api/payment/initiate`
  form.acceptCharset = 'UTF-8'
  form.style.display = 'none'

  const fields = {
    portalId: String(portalId),
    mobile: msisdn,
    email: email == null ? '' : String(email),
    clickId: String(clickId),
    servicePack: String(servicePack),
    amount: String(amount),
  }

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}

function parsePlans(data = {}) {
  let packs = data.multiplePackType
  if (!packs && data.multiplePackTypeJson) {
    try {
      packs = typeof data.multiplePackTypeJson === 'string'
        ? JSON.parse(data.multiplePackTypeJson)
        : data.multiplePackTypeJson
    } catch {
      packs = null
    }
  }
  if (!packs || typeof packs !== 'object') {
    if (data.price != null && Number(data.price) > 0) {
      return [{ key: 'DEFAULT', label: 'Plan', amount: String(data.price) }]
    }
    return []
  }
  return Object.entries(packs).map(([key, amount]) => ({
    key,
    label: formatPlanLabel(key),
    amount: String(amount),
  }))
}

function formatPlanLabel(key = '') {
  const k = String(key).trim()
  if (!k) return 'Plan'
  return k
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
