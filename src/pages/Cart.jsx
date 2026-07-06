import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

// Helper to format date as "07 Jul 2026"
const formatDateAesthetic = (dateString) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = dateString.split('-')
  const monthName = months[parseInt(month) - 1]
  return `${parseInt(day)} ${monthName} ${year}`
}

export default function Cart() {
  const { cartItems, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-stone-100 p-6 rounded-full mb-6">
          <svg className="w-12 h-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-main mb-2">Your Cart is Empty</h1>
        <p className="text-text-muted mb-8">Add some delicious baked sushi to get started.</p>
        <Link to="/" className="btn-secondary w-full max-w-xs">
          Go back to Menu
        </Link>
      </div>
    )
  }

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Back to Menu Button */}
      <Link to="/" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1 mb-6">
        ← Back to Menu
      </Link>

      <h1 className="text-3xl font-bold text-text-main mb-2">Your Cart</h1>
      
      {/* UPDATED: Aesthetic date format */}
      <p className="text-text-muted mb-6">
        Delivery Date: <span className="font-semibold text-text-main">
          {formatDateAesthetic(cartItems[0].date)}
        </span>
      </p>

      {/* Cart Items List */}
      <ul className="space-y-4">
        {cartItems.map((item, index) => (
          <li key={index} className="bg-white rounded-2xl shadow-soft p-4 border border-warm-100">
            <div className="flex justify-between items-start mb-2">
              <strong className="text-lg text-text-main">{item.product.name}</strong>
              <span className="text-primary font-bold text-lg">RM{item.product.price * item.quantity}</span>
            </div>
            <div className="text-sm text-text-muted">
              Quantity: <span className="font-medium text-text-main">{item.quantity}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Total and Actions */}
      <div className="mt-8 pt-6 border-t border-warm-200">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xl font-semibold text-text-main">Total</span>
          <span className="text-2xl font-bold text-primary">RM{total}</span>
        </div>

        <div className="space-y-3">
          <button
            onClick={clearCart}
            className="w-full py-3 px-6 rounded-xl font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors active:scale-95"
          >
            Clear Cart
          </button>
          <Link to="/checkout" className="block">
            <button className="btn-primary w-full">
              Proceed to Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}