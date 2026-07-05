import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation' // <-- Add this

function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/confirmation/:ref" element={<Confirmation />} /> {/* <-- Add this */}
    </Routes>
  )
}

export default App