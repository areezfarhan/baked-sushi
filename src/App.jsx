import { Routes, Route } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext' // 1. Import Provider and Hook
import Toast from './components/Toast' // 2. Import the Toast component

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

// 3. Create a small component to handle the Toast display
function ToastManager() {
  const { toast, closeToast } = useCart()
  return toast ? <Toast message={toast} onClose={closeToast} /> : null
}

function App() {
  return (
    // 4. Wrap the entire app in the CartProvider so the Toast can access the cart state
    <CartProvider>
      <Layout>
        {/* 5. Place the ToastManager here so it floats above all pages */}
        <ToastManager />
        
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