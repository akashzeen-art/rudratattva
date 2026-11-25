import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { yantraDropdown } from '../data/categories'

const products = yantraDropdown[0].links

export default function Yantra() {
  return (
    <PageLayout
      title="Yantras"
      description="Explore all types of Yantras and Mahayantras at Rudra Tattva. Yantras are sacred geometric diagrams that serve as powerful tools for meditation, worship, and spiritual growth. All Yantras are energized prior to sending."
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
