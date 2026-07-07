import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import AlertModal from '../components/AlertModal'

// Helper to format date as "7 Jul 2026"
const formatDateAesthetic = (dateString) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = dateString.split('-')
  const monthName = months[parseInt(month) - 1]
  return `${parseInt(day)} ${monthName} ${year}`
}

export default function Cart() {
  const { cartItems, clearCart, removeFromCart, decreaseQuantity, alert, closeAlert } = useCart()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center text-center px-6">
        <div className="bg-warm-100 p-8 rounded-full mb-6">
          <svg className="w-16 h-16 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-main mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          Add some delicious baked sushi to get started.
        </p>
        <Link to="/" className="btn-secondary w-full max-w-xs py-3 text-center">
          Go back to Menu
        </Link>
      </div>
    )
  }

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      {/* Sticky Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-text-main hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-text-main">Your Cart</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Delivery Date Badge */}
        <div className="flex justify-center">
          <div className="bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Delivery Date: {formatDateAesthetic(cartItems[0].date)}
          </div>
        </div>

        {/* Cart Items List */}
        <ul className="space-y-4">
          {cartItems.map((item, index) => (
            <li key={index} className="bg-white rounded-2xl shadow-soft overflow-hidden border border-warm-100">
              <div className="flex items-stretch p-4">
                {/* Product Image */}
                <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-stone-200">
                  {item.product.image_url ? (
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="flex-1 ml-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text-main leading-tight">{item.product.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.date)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1"
                      title="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">RM{item.product.price} each</p>
                      <p className="text-xl font-bold text-primary">RM{item.product.price * item.quantity}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-warm-50 rounded-lg border border-warm-100 p-1">
                      <button
                        onClick={() => decreaseQuantity(item.product.id, item.date)}
                        className="w-8 h-8 rounded-md bg-white border border-gray-200 text-text-main font-bold flex items-center justify-center transition-all hover:bg-gray-50 active:scale-95 shadow-sm"
                      >
                        −
                      </button>
                      <span className="text-text-main font-semibold w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Clear Cart Button */}
        <div className="pt-4">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-red-600 bg-red-50 border-2 border-red-100 hover:bg-red-100 hover:border-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Entire Cart
          </button>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-text-main">RM{total}</p>
          </div>
          <Link to="/checkout" className="flex-1 max-w-xs">
            <button className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2">
              Checkout
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </Link>
        </div>
      </div>

      {/* Alert Modal (for errors/warnings) */}
      {alert && (
        <AlertModal 
          message={alert.message} 
          onClose={closeAlert}
          type={alert.type || 'error'}
        />
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <AlertModal
          message="Are you sure you want to clear your entire cart? This action cannot be undone."
          onClose={() => setShowClearConfirm(false)}
          onConfirm={clearCart}
          type="warning"
          confirmText="Clear Cart"
        />
      )}
    </div>
  )
}