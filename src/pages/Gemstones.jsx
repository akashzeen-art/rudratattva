import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { gemstonesDropdown } from '../data/categories'

const products = gemstonesDropdown[0].links

export default function Gemstones() {
  return (
    <PageLayout
      title="Gemstones"
      description="Explore our exquisite collection of natural, lab-tested, certified gemstones at Gems & Jewels. Each gemstone is carefully selected for its quality, authenticity, and astrological benefits."
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
