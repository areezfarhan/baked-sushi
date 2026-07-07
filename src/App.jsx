import { Routes, Route } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext'
import Toast from './components/Toast'
import ScrollToTop from './components/ScrollToTop' // 👈 1. IMPORT IT HERE

import Layout from './components/Layout';
import Menu from './pages/Menu'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminHistory from './pages/AdminHistory'
import AdminInventory from './pages/AdminInventory'
import ProtectedRoute from './components/ProtectedRoute'

function ToastManager() {
  const { toast, closeToast } = useCart()
  return toast ? <Toast message={toast} onClose={closeToast} /> : null
}

function App() {
  return (
    <CartProvider>
      <ScrollToTop /> {/* 👈 2. ADD IT RIGHT HERE */}
      <ToastManager />
      <Layout>
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
          <Route path="/admin/history" element={
            <ProtectedRoute>
              <AdminHistory />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute>
              <AdminInventory />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </CartProvider>
  )
}

export default App