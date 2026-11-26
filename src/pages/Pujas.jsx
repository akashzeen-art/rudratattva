import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { pujasDropdown } from '../data/categories'

const products = pujasDropdown[0].links

export default function Pujas() {
  return (
    <PageLayout
      title="Online Puja Services"
      description="Book authentic Vedic Puja Services online at Gems & Jewels. Our experienced pandits perform pujas with complete Vedic rituals. Explore Maha Pujas, God & Goddess Pujas, Navgraha remedies and more."
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
