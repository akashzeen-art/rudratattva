const ASTRO_BASE = import.meta.env.VITE_ASTRO_API_BASE || '/astro-api/'

function splitList(value = '') {
  return String(value)
    .split(/[,|/]+/)
    .map(part => part.trim())
    .filter(Boolean)
}

function normalizeSessions(raw = '') {
  const text = String(raw || '').trim()
  if (!text) return { modes: [], fee: '' }
  // Some records store a fee in `sessions` instead of Call/Chat
  if (/^\d+(\.\d+)?$/.test(text)) {
    return { modes: ['Call'], fee: text }
  }
  const modes = splitList(text).filter(m => !/^\d+(\.\d+)?$/.test(m))
  return { modes: modes.length ? modes : ['Call'], fee: '' }
}

function mapPandit(item) {
  const { modes, fee } = normalizeSessions(item.sessions)
  const status = String(item.status || '').toUpperCase() || 'OFFLINE'
  return {
    id: item.id,
    name: item.fullName || 'Panditji',
    title: item.title || 'Vedic Astrologer',
    specialty: item.specialty || '',
    image: item.imageUrl || '/images/RudraTattvalogo.png',
    languages: splitList(item.languages),
    sessionModes: modes,
    sessionFee: fee,
    experienceYears: item.experienceYears || '',
    phone: String(item.phoneNumber || '').replace(/\D/g, ''),
    gender: item.gender || '',
    status,
    available: status === 'AVAILABLE',
    isActive: item.isActive !== false,
  }
}

export async function loadPandits() {
  const res = await fetch(`${ASTRO_BASE}astro/pandit/all`, {
    headers: { Accept: 'application/json' },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error('Unable to load pandits right now')
  }

  const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
  return list
    .map(mapPandit)
    .filter(p => p.isActive)
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1
      return String(a.name).localeCompare(String(b.name))
    })
}
