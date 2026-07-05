import { Routes, Route } from 'react-router-dom'
import Menu from './pages/Menu'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import AdminInventory from './pages/AdminInventory'

// Import new Admin components
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute' // Make sure this path is correct

function App() {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<Menu />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/confirmation/:ref" element={<Confirmation />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory" element={
        <ProtectedRoute>
          <AdminInventory />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App