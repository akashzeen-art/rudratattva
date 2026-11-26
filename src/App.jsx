import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import LegacyLinkGuard from './components/LegacyLinkGuard'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home'
import CartPage from './pages/CartPage'
import CatalogPage, { MainCategoryPage } from './pages/CatalogPage'
import ProductPage from './pages/ProductPage'
import Consultation from './pages/Consultation'
import ContactUs from './pages/ContactUs'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <LegacyLinkGuard />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact-us" element={<ContactUs />} />

          <Route path="/rudraksha" element={<MainCategoryPage type="rudraksha" />} />
          <Route path="/gemstones" element={<Navigate to="/p/natural-jyotish-gemstones" replace />} />
          <Route path="/yantra" element={<MainCategoryPage type="yantra" />} />
          <Route path="/idols" element={<MainCategoryPage type="idols" />} />
          <Route path="/pujas" element={<MainCategoryPage type="pujas" />} />
          <Route path="/consultation" element={<Consultation />} />

          <Route path="/c/*" element={<CatalogPage prefix="c" />} />
          <Route path="/k/*" element={<CatalogPage prefix="k" />} />
          <Route path="/p/*" element={<CatalogPage prefix="p" />} />
          <Route path="/buy/*" element={<ProductPage />} />

          <Route path="/rudraksha/1-mukhi-nepal" element={<Navigate to="/buy/one-mukhi-half-moon" replace />} />
          <Route path="/rudraksha/2-mukhi-nepal" element={<Navigate to="/buy/rare-two-mukhi-from-nepal" replace />} />
          <Route path="/rudraksha/3-mukhi-nepal" element={<Navigate to="/buy/three-mukhi-round-from-nepal" replace />} />
          <Route path="/rudraksha/4-mukhi-nepal" element={<Navigate to="/buy/four-mukhi-from-nepal" replace />} />
          <Route path="/rudraksha/5-mukhi-nepal" element={<Navigate to="/buy/five-mukhi-from-nepal" replace />} />
          <Route path="/rudraksha/:rest" element={<Navigate to="/rudraksha" replace />} />
          <Route path="/gemstones/:rest" element={<Navigate to="/gemstones" replace />} />
          <Route path="/yantra/:rest" element={<Navigate to="/yantra" replace />} />
          <Route path="/idols/:rest" element={<Navigate to="/idols" replace />} />
          <Route path="/pujas/:rest" element={<Navigate to="/pujas" replace />} />
        </Routes>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  )
}
