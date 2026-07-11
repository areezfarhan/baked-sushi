import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import AlertModal from '../components/AlertModal'
import ConfirmModal from '../components/ConfirmModal';

// Helper to format date as "9 Jul 2026"
const formatDateAesthetic = (dateString) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = dateString.split('-')
  const monthName = months[parseInt(month) - 1]
  return `${parseInt(day)} ${monthName} ${year}`
}

export default function Cart() {
  const { cartItems, clearCart, removeFromCart, decreaseQuantity, alert, closeAlert } = useCart()
  const [confirmData, setConfirmData] = useState(null);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen w-full max-w-7xl mx-auto bg-warm-100/90 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <div className="bg-warm-50 p-8 rounded-full mb-6 shadow-elevated border-2 border-warm-200">
          <svg className="w-16 h-16 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2 font-display">Your Cart is Empty</h1>
        <p className="text-text-muted mb-8 max-w-xs mx-auto font-body">
          Add some delicious baked sushi to get started.
        </p>
        <Link to="/" className="px-8 py-3 bg-primary text-warm-50 rounded-2xl font-bold font-display hover:bg-primary-dark transition-colors shadow-warm">
          Go back to Menu
        </Link>
      </div>
    )
  }

  // Calculate total using item.price (for variants) or product.price (for sushi)
  const total = cartItems.reduce((sum, item) => {
    const price = item.price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto bg-warm-100/80 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden pb-32">
      {/* Sticky Header */}
      <header className="bg-warm-50/80 backdrop-blur-md sticky top-0 z-10 border-b border-warm-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-primary hover:text-accent transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-primary font-display">Your Cart</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Delivery Date Badge */}
        <div className="flex justify-center">
          <div className="bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border border-primary/20 font-body">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Delivery Date: {formatDateAesthetic(cartItems[0].date)}
          </div>
        </div>

        {/* Cart Items List */}
        <ul className="space-y-4">
          {cartItems.map((item, index) => {
            const itemPrice = item.price || item.product.price;
            return (
              <li key={index} className="bg-warm-50 rounded-3xl shadow-soft overflow-hidden border border-warm-200/60 hover:shadow-elevated transition-shadow duration-300">
                <div className="flex items-stretch p-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-28 h-24 rounded-2xl overflow-hidden bg-warm-200 border border-warm-200/40">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-light">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 ml-3 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-primary leading-tight font-display">
                        {item.product.name}
                        {item.variant && <span className="text-sm font-normal text-text-muted ml-2 font-body">({item.variant})</span>}
                      </h3>
                      {/* Delete Button */}
                      <button
                        onClick={() => setConfirmData({
                          title: "Remove Item?",
                          message: `Are you sure you want to remove ${item.product.name} from your cart?`,
                          confirmText: "Remove",
                          onConfirm: () => {
                            removeFromCart(item.product.id, item.date, item.variant);
                            setConfirmData(null);
                          }
                        })}
                        className="text-text-light hover:text-accent transition-colors p-1 -mr-1 -mt-1"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-xs text-text-muted mb-1 font-body">RM{Number(itemPrice).toFixed(2)} each</p>
                        <p className="text-xl font-bold text-accent font-display">RM{(itemPrice * item.quantity).toFixed(2)}</p>
                      </div>
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-warm-50 rounded-xl border border-warm-200/60 p-1">
                        <button
                          onClick={() => decreaseQuantity(item.product.id, item.date, item.variant)}
                          className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/60 text-primary font-bold flex items-center justify-center transition-all hover:bg-warm-200 active:scale-95 shadow-soft font-display"
                        >
                          −
                        </button>
                        <span className="text-primary font-semibold w-6 text-center text-sm font-display">
                          {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Clear Cart Button */}
        <div className="pt-4">
          <button
            onClick={() => setConfirmData({
              title: "Clear Entire Cart?",
              message: "This will remove all items from your cart. This action cannot be undone.",
              confirmText: "Clear Cart",
              onConfirm: () => {
                clearCart();
                setConfirmData(null);
              }
            })}
            className="w-full py-3.5 px-6 rounded-2xl font-semibold text-accent bg-accent/5 border-2 border-accent/20 hover:bg-accent/10 hover:border-accent/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-display"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Entire Cart
          </button>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-warm-50 border-t-2 border-warm-200 p-4 shadow-elevated z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider font-body">Total</p>
            <p className="text-2xl font-bold text-primary font-display">RM{total.toFixed(2)}</p>
          </div>
          <Link to="/checkout" className="flex-1 max-w-xs">
            <button className="w-full bg-primary text-warm-50 py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-warm font-display">
              Checkout
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </Link>
        </div>
      </div>

      {/* Alert Modal */}
      {alert && (
        <AlertModal message={alert.message} onClose={closeAlert} type={alert.type || 'error'} />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmData}
        onClose={() => setConfirmData(null)}
        onConfirm={confirmData?.onConfirm}
        title={confirmData?.title}
        message={confirmData?.message}
        confirmText={confirmData?.confirmText}
      />
    </div>
  )
}