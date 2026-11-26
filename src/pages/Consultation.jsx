import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadPandits } from '../api/pandits'
import '../App.css'

export default function Consultation() {
  const [pandits, setPandits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    loadPandits()
      .then(list => {
        if (!active) return
        setPandits(list)
        setLoading(false)
      })
      .catch(err => {
        if (!active) return
        setError(err.message || 'Unable to load consultations')
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <div className="consult-page">
      <div className="rc-page-header">
        <div className="rc-page-header-inner">
          <div className="rc-header-left">
            <nav aria-label="Breadcrumb">
              <ol className="rc-breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li className="active"><span>Talk To PanditJi</span></li>
              </ol>
            </nav>
            <h1 className="rc-page-title">Speak with Panditji</h1>
            <p className="rc-page-desc">
              Connect with experienced Vedic astrologers and pandits for guidance on life, career,
              relationships, and spiritual remedies.
            </p>
          </div>
        </div>
      </div>

      <section className="consult-section">
        {loading && <p className="consult-status">Loading pandits…</p>}
        {error && !loading && <p className="consult-status consult-error">{error}</p>}

        {!loading && !error && pandits.length === 0 && (
          <p className="consult-status">No pandits are available right now. Please check again soon.</p>
        )}

        {!loading && pandits.length > 0 && (
          <div className="consult-grid">
            {pandits.map(p => {
              const callModes = (p.sessionModes || []).filter(
                m => !/chat|whatsapp|message/i.test(String(m)),
              )
              return (
                <article className={`consult-card${p.available ? '' : ' is-offline'}`} key={p.id}>
                  <div className="consult-card-media">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      onError={e => { e.target.src = '/images/gems-and-jewels-logo.png' }}
                    />
                    <span className={`consult-status-pill${p.available ? ' available' : ''}`}>
                      {p.available ? 'Available' : 'Offline'}
                    </span>
                  </div>

                  <div className="consult-card-body">
                    <h2>{p.name}</h2>
                    <p className="consult-title">{p.title}</p>
                    {p.specialty && <p className="consult-specialty">{p.specialty}</p>}

                    <ul className="consult-meta">
                      {p.experienceYears && (
                        <li><span>Experience</span> {p.experienceYears} years</li>
                      )}
                      {p.languages.length > 0 && (
                        <li><span>Languages</span> {p.languages.join(', ')}</li>
                      )}
                      {callModes.length > 0 && (
                        <li><span>Sessions</span> {callModes.join(', ')}</li>
                      )}
                      {p.sessionFee && (
                        <li><span>Fee</span> INR {Number(p.sessionFee).toLocaleString('en-IN')}</li>
                      )}
                    </ul>

                    <div className="consult-actions">
                      {p.phone && (
                        <a className="consult-click-call" href={`tel:+91${p.phone}`}>
                          Click to call
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
