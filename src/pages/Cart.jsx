import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

// Helper to format date as "7 Jul 2026"
const formatDateAesthetic = (dateString) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = dateString.split('-')
  const monthName = months[parseInt(month) - 1]
  return `${parseInt(day)} ${monthName} ${year}`
}

export default function Cart() {
  const { cartItems, clearCart, removeFromCart, decreaseQuantity } = useCart()

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

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Back to Menu Button */}
      <Link to="/" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1 mb-6">
        ← Back to Menu
      </Link>

      <h1 className="text-3xl font-bold text-text-main mb-2">Your Cart</h1>
      
      <p className="text-text-muted mb-6">
        Delivery Date: <span className="font-semibold text-text-main">
          {formatDateAesthetic(cartItems[0].date)}
        </span>
      </p>

      {/* Cart Items List */}
      <ul className="space-y-4">
        {cartItems.map((item, index) => (
          <li key={index} className="bg-white rounded-2xl shadow-soft overflow-hidden border border-warm-100">
            <div className="flex items-center p-4">
              {/* Product Image */}
              <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-200">
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
              <div className="flex-1 ml-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-bold text-text-main">{item.product.name}</h3>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id, item.date)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Price Breakdown */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-muted">
                    RM{item.product.price} × {item.quantity}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    RM{item.product.price * item.quantity}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 pt-2 border-t border-warm-100">
                  <span className="text-sm font-medium text-text-muted">Quantity</span>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => decreaseQuantity(item.product.id, item.date)}
                      className="w-8 h-8 rounded-lg bg-warm-100 border border-warm-200 text-text-main font-bold flex items-center justify-center transition-all duration-200 hover:bg-warm-200 active:scale-95"
                    >
                      −
                    </button>

                    <span className="text-text-main font-semibold w-6 text-center">
                      {item.quantity}
                    </span>
                  </div>
                </div>
              </div>
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