import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import LegacyLinkGuard from './components/LegacyLinkGuard'
import WhatsAppFab from './components/WhatsAppFab'
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
          <Route path="/gemstones" element={<MainCategoryPage type="gemstones" />} />
          <Route path="/yantra" element={<MainCategoryPage type="yantra" />} />
          <Route path="/idols" element={<MainCategoryPage type="idols" />} />
          <Route path="/pujas" element={<MainCategoryPage type="pujas" />} />
          <Route path="/consultation" element={<Consultation />} />

          <Route path="/c/*" element={<CatalogPage prefix="c" />} />
          <Route path="/k/*" element={<CatalogPage prefix="k" />} />
          <Route path="/p/*" element={<CatalogPage prefix="p" />} />
          <Route path="/buy/*" element={<ProductPage />} />

          <Route path="/rudraksha/1-mukhi-nepal" element={<Navigate to="/k/1-mukhi-rudraksha" replace />} />
          <Route path="/rudraksha/2-mukhi-nepal" element={<Navigate to="/k/2-mukhi-rudraksha" replace />} />
          <Route path="/rudraksha/3-mukhi-nepal" element={<Navigate to="/k/3-mukhi-rudraksha" replace />} />
          <Route path="/rudraksha/4-mukhi-nepal" element={<Navigate to="/k/4-mukhi-rudraksha" replace />} />
          <Route path="/rudraksha/5-mukhi-nepal" element={<Navigate to="/k/5-mukhi-rudraksha" replace />} />
          <Route path="/rudraksha/:rest" element={<Navigate to="/rudraksha" replace />} />
          <Route path="/gemstones/:rest" element={<Navigate to="/gemstones" replace />} />
          <Route path="/yantra/:rest" element={<Navigate to="/yantra" replace />} />
          <Route path="/idols/:rest" element={<Navigate to="/idols" replace />} />
          <Route path="/pujas/:rest" element={<Navigate to="/pujas" replace />} />
        </Routes>
        <Footer />
        <WhatsAppFab />
      </CartProvider>
    </BrowserRouter>
  )
}
