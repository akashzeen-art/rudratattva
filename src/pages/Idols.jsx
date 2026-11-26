import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { idolsDropdown } from '../data/categories'

const products = idolsDropdown[0].links

export default function Idols() {
  return (
    <PageLayout
      title="Gods & Goddesses Idols"
      description="Discover the divine essence with our exquisite collection of Hindu God & Goddess Idols at Gems & Jewels. Crafted in Brass, Marble, Silver, Gemstones, Wood, Bronze, Ashtadhatu, and Clay Fiber Resin."
    >
      {products.map(p => (
        <Link to={p.to} className="product-card" key={p.to}>
          <img src={p.img} alt={p.label} />
          <p className="p-name">{p.label}</p>
        </Link>
      ))}
    </PageLayout>
  )
}
