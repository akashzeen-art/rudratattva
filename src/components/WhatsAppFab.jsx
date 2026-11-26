const WA = '918929728030'
const MSG = encodeURIComponent('Namaste. I would like to enquire with Gems & Jewels.')

export default function WhatsAppFab() {
  return (
    <a
      className="wa-fab"
      href={`https://api.whatsapp.com/send?phone=${WA}&text=${MSG}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <i className="fa-brands fa-whatsapp" aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  )
}
