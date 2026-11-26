import { useEffect, useState } from 'react'
import {
  PAYMENT_API_ORIGIN,
  PAYMENT_PORTAL_ID,
  createClickId,
  fetchPaymentPortal,
} from '../api/paymentPortal'

function normalizeMobile(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 10)
}

function isValidMobile(value = '') {
  return /^[6-9]\d{9}$/.test(value)
}

export default function BuyNowModal({ open, productName = '', onClose, onComplete }) {
  const [step, setStep] = useState('mobile') // mobile | plans
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [portalId, setPortalId] = useState(PAYMENT_PORTAL_ID)
  const [clickId, setClickId] = useState('')
  const [plans, setPlans] = useState([])
  const [currency, setCurrency] = useState('INR')
  const [selectedPlanKey, setSelectedPlanKey] = useState('')

  useEffect(() => {
    if (!open) return
    setStep('mobile')
    setMobile('')
    setLoading(false)
    setError('')
    setPortalId(PAYMENT_PORTAL_ID)
    setClickId('')
    setPlans([])
    setCurrency('INR')
    setSelectedPlanKey('')
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  if (!open) return null

  const selectedPlan = plans.find(p => p.key === selectedPlanKey) || null
  const canPay = Boolean(selectedPlan && clickId && mobile && portalId)

  const submitMobile = async (e) => {
    e.preventDefault()
    const msisdn = normalizeMobile(mobile)
    if (!isValidMobile(msisdn)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setError('')
    setLoading(true)
    const nextClickId = createClickId()
    try {
      const portal = await fetchPaymentPortal({
        portalId: PAYMENT_PORTAL_ID,
        clickId: nextClickId,
      })
      setPortalId(portal.portalId)
      setClickId(portal.clickId)
      setPlans(portal.plans)
      setCurrency(portal.currencyCode || 'INR')
      setMobile(msisdn)
      setSelectedPlanKey(portal.plans[0]?.key || '')
      if (!portal.plans.length) {
        setError('No plans available right now. Please try again.')
      }
      setStep('plans')
    } catch (err) {
      setError(err.message || 'Could not load plans. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onPaySubmit = (e) => {
    if (!canPay) {
      e.preventDefault()
      setError('Please choose a plan')
      return
    }
    setLoading(true)
    onComplete?.({
      mobile,
      portalId,
      clickId,
      plan: selectedPlan,
      currency,
      productName,
    })
    // Native form POST → https://drishhya.live/api/payment/initiate (shows in Network)
  }

  return (
    <div className="bn-modal-overlay" role="presentation" onClick={() => !loading && onClose?.()}>
      <div
        className="bn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bn-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="bn-modal-close"
          aria-label="Close"
          disabled={loading}
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <h2 id="bn-modal-title" className="bn-modal-title">
          {step === 'mobile' ? 'Enter mobile number' : 'Choose a plan'}
        </h2>
        {productName ? <p className="bn-modal-sub">{productName}</p> : null}

        {step === 'mobile' && (
          <form className="bn-modal-form" onSubmit={submitMobile}>
            <label className="bn-field" htmlFor="bn-mobile">
              Mobile number
              <div className="bn-mobile-row">
                <span className="bn-prefix">+91</span>
                <input
                  id="bn-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(normalizeMobile(e.target.value))
                    if (error) setError('')
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </label>
            {error ? <p className="bn-error">{error}</p> : null}
            <button type="submit" className="pd-btn pd-btn-solid bn-submit" disabled={loading}>
              {loading ? 'Loading plans…' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'plans' && (
          <form
            className="bn-plans"
            method="POST"
            action={`${PAYMENT_API_ORIGIN}/api/payment/initiate`}
            acceptCharset="UTF-8"
            onSubmit={onPaySubmit}
          >
            <input type="hidden" name="portalId" value={String(portalId)} />
            <input type="hidden" name="mobile" value={mobile} />
            <input type="hidden" name="email" value="" />
            <input type="hidden" name="clickId" value={clickId} />
            <input type="hidden" name="servicePack" value={selectedPlan?.key || ''} />
            <input type="hidden" name="amount" value={selectedPlan?.amount || ''} />

            <div className="bn-meta">
              <p><span>Portal ID</span> {portalId}</p>
              <p><span>Click ID</span> {clickId}</p>
              <p><span>Mobile</span> +91 {mobile}</p>
            </div>
            {error ? <p className="bn-error">{error}</p> : null}
            <div className="bn-plan-list" role="radiogroup" aria-label="Plans">
              {plans.map((plan) => {
                const active = selectedPlanKey === plan.key
                return (
                  <button
                    type="button"
                    key={plan.key}
                    className={`bn-plan-card${active ? ' is-active' : ''}`}
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setSelectedPlanKey(plan.key)
                      if (error) setError('')
                    }}
                  >
                    <span className="bn-plan-name">{plan.label}</span>
                    <span className="bn-plan-price">{currency} {plan.amount}</span>
                  </button>
                )
              })}
            </div>
            <button
              type="submit"
              className="pd-btn pd-btn-solid bn-submit"
              disabled={loading || !canPay}
            >
              {loading ? 'Redirecting…' : 'Continue'}
            </button>
            <button
              type="button"
              className="pd-btn pd-btn-outline bn-submit"
              disabled={loading}
              onClick={() => setStep('mobile')}
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
