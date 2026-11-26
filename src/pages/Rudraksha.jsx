import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'

const products = [
  { img: '/image/rudraksh/01-nepal-rudraksha.jpg', name: 'Nepal Rudraksha', to: '/rudraksha/5-mukhi-nepal' },
  { img: '/image/rudraksh/02-java-indonesian-rudraksha.jpg', name: 'Java (Indonesian) Rudraksha', to: '/rudraksha/5-mukhi-java' },
  { img: '/images/rudraksha/rudraksha-ratna-chakra-therapy-category-thumbnail_206527.jpg', name: 'Rudraksha Ratna Chakra Therapy (RRCT)', to: '/rudraksha/rrct' },
  { img: '/image/rudraksh/03-rudraksha-bracelets.jpg', name: 'Rudraksha Bracelets', to: '/rudraksha/5-mukhi-bracelet' },
  { img: '/image/rudraksh/04-rudraksha-malas-kanthas.jpg', name: 'Rudraksha Malas & Kanthas', to: '/rudraksha/5-mukhi-mala' },
  { img: '/images/rudraksha/indrakshi-combinations-mala-and-bracelet-category-thumbnail_206521.jpg', name: 'Indrakshi Combination (Indra Mala)', to: '/rudraksha/indra-mala' },
  { img: '/images/rudraksha/siddha-combinations-mala-and-bracelet-category-thumbnail_206528.jpg', name: 'Siddha Combination (Siddha Mala)', to: '/rudraksha/siddha-mala' },
  { img: '/images/rudraksha/rudraksha-ratna-7-chakra-jewellery-category-thumbnail_206526.jpg', name: 'Rudraksha Ratna 7 Chakra Jewellery', to: '/rudraksha/7-chakra-jewellery' },
  { img: '/images/rudraksha/OM-Design-Round-Silver-s_218520.jpg', name: 'Rudraksha Rings', to: '/rudraksha/rings' },
  { img: '/images/rudraksha/rudraksha-beading-tool-category-thumbnail_206522.jpg', name: 'Rudraksha Beading Tools', to: '/rudraksha/beading-tools' },
]

export default function Rudraksha() {
  return (
    <PageLayout
      title="Rudraksha"
      description="Rudraksha beads are a gift from Lord Shiva to Humankind to achieve their Material & Spiritual Goals. They radiate divine energy, fostering inner peace, mental clarity, and overall well-being. Gems & Jewels, the world's first ISO-certified Rudraksha organization, offers premium, hand-selected beads from Nepal and Indonesia."
    >
      {products.map(p => (
        <Link to={p.to} className="product-card" key={p.name}>
          <img src={p.img} alt={p.name} />
          <p className="p-name">{p.name}</p>
        </Link>
      ))}
    </PageLayout>
  )
}
