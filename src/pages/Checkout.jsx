import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AlertModal from '../components/AlertModal'

// Helper to format date as "9 Jul 2026"
const formatDateAesthetic = (dateString) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = dateString.split('-')
  const monthName = months[parseInt(month) - 1]
  return `${parseInt(day)} ${monthName} ${year}`
}

export default function Checkout() {
  const { cartItems, clearCart } = useCart()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [receipt, setReceipt] = useState(null)
  
  // Alert state
  const [alert, setAlert] = useState(null)
  const closeAlert = () => setAlert(null)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen w-full max-w-7xl mx-auto bg-warm-100/90 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <div className="bg-warm-50 p-8 rounded-full mb-6 shadow-elevated border-2 border-warm-200">
          <svg className="w-16 h-16 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2 font-display">Your Cart is Empty</h1>
        <p className="text-text-muted mb-8 max-w-xs mx-auto font-body">Add some delicious baked sushi to get started.</p>
        <Link to="/" className="px-8 py-3 bg-primary text-warm-50 rounded-2xl font-bold font-display hover:bg-primary-dark transition-colors shadow-warm">
          Go to Menu
        </Link>
      </div>
    )
  }

  const total = cartItems.reduce((sum, item) => {
    const price = item.price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name || name.trim() === '') {
      setAlert({ message: 'Please enter your full name.', type: 'error' })
      return
    }
    if (!phone || phone.trim() === '') {
      setAlert({ message: 'Please enter your WhatsApp number.', type: 'error' })
      return
    }
    if (!receipt) {
      setAlert({ message: 'Please upload your payment receipt.', type: 'error' })
      return
    }
    if (deliveryType === 'delivery' && (!address || address.trim() === '')) {
      setAlert({ message: 'Please enter your delivery address.', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const fileExt = receipt.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, receipt)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath)
      const receiptUrl = urlData.publicUrl

      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price || item.product.price,
        variant: item.variant || null
      }))

      const { data, error } = await supabase.rpc('place_order', {
        p_product_ids: cartItems.map(item => item.product.id),
        p_quantities: cartItems.map(item => item.quantity),
        p_prices: cartItems.map(item => item.price || item.product.price),
        p_variants: cartItems.map(item => item.variant || null),
        p_date: cartItems[0].date,
        p_customer_name: name,
        p_phone: phone,
        p_delivery_type: deliveryType,
        p_address: deliveryType === 'delivery' ? address : null,
        p_notes: notes || null,
        p_total_amount: total,
        p_receipt_url: receiptUrl
      })

      if (error) throw error

      if (data.status === 'sold_out') {
        setAlert({ message: `Sold out! ${data.message || 'Please try another date.'}`, type: 'warning' })
        setIsSubmitting(false)
      } else if (data.status === 'success') {
        try {
          await supabase.functions.invoke('send-order-email', {
            body: { order_reference: data.order_reference }
          })
        } catch (err) {
          console.error('Edge function error:', err)
        }
        clearCart()
        navigate(`/confirmation/${data.order_reference}`)
      } else {
        setAlert({ message: 'An unexpected error occurred.', type: 'error' })
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Submission error:', err)
      setAlert({ message: 'Failed to submit order. Please try again.', type: 'error' })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto bg-warm-100/90 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden pb-32">
      {/* Sticky Header */}
      <header className="bg-warm-50/80 backdrop-blur-md sticky top-0 z-10 border-b border-warm-200">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <Link to="/cart" className="text-primary hover:text-accent transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-primary font-display">Checkout</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Order Summary Card */}
        <div className="bg-warm-50 rounded-3xl shadow-elevated border-2 border-warm-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-primary font-display">Order Summary</h2>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/20 font-body">
              {formatDateAesthetic(cartItems[0].date)}
            </div>
          </div>
          <ul className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            {cartItems.map((item, index) => {
              const itemPrice = item.price || item.product.price;
              return (
                <li key={index} className="flex items-center gap-3 md:gap-4 py-2 border-b border-warm-200 last:border-0 last:pb-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-warm-200 overflow-hidden flex-shrink-0 border border-warm-200">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-light">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-bold text-primary font-body leading-snug">
                      {item.product.name}
                      {item.variant && <span className="text-xs font-normal text-text-muted ml-1 font-body">({item.variant})</span>}
                    </h3>
                    <p className="text-xs text-text-muted font-body mt-1">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-accent font-display text-sm md:text-base">
                    RM{(itemPrice * item.quantity).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between items-center pt-4 border-t-2 border-warm-200">
            <span className="text-base md:text-lg font-bold text-primary font-display">Total</span>
            <span className="text-2xl md:text-3xl font-bold text-accent font-display">RM{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Customer Details Section */}
          <div className="bg-warm-50 rounded-3xl shadow-elevated border-2 border-warm-200 p-5 md:p-6 space-y-4 md:space-y-5">
            <h2 className="text-lg md:text-xl font-bold text-primary font-display">Customer Details</h2>
            <div>
              <label className="block text-sm font-medium text-text-body mb-2 font-body">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-100 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 font-body"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-2 font-body">WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-100 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 font-body"
                placeholder="e.g., 012-3456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-3 font-body">Delivery Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all font-display ${
                    deliveryType === 'pickup'
                      ? 'bg-primary text-warm-50 shadow-md'
                      : 'bg-warm-100 text-text-body border border-warm-200 hover:bg-warm-200'
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all font-display ${
                    deliveryType === 'delivery'
                      ? 'bg-primary text-warm-50 shadow-md'
                      : 'bg-warm-100 text-text-body border border-warm-200 hover:bg-warm-200'
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>
            {deliveryType === 'delivery' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2 font-body">Delivery Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-warm-100 text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none font-body"
                    placeholder="Enter your full address"
                  />
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs text-primary font-body">
                    <span className="font-semibold">Note:</span> Delivery charges vary depending on location and will be confirmed via WhatsApp.
                  </p>
                </div>
              </div>
            )}

                     {/* Additional Notes */}
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2 font-body">
             Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
           </label>
           <textarea
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             rows="3"
             className="w-full px-4 py-3 rounded-xl border border-[#F5F0E6] bg-[#FDFBF7] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E] transition-all duration-200 resize-none font-body"
             placeholder="Any special requests or instructions..."
           />
         </div>
          </div>

          {/* Payment Section */}
          <div className="bg-warm-50 rounded-3xl shadow-elevated border-2 border-warm-200 p-5 md:p-6 space-y-5">
            <h2 className="text-lg md:text-xl font-bold text-primary font-display">Payment</h2>
            
            {/* Payment Info Card */}
            <div className="bg-gradient-to-br from-warm-100 to-warm-200 p-4 md:p-5 rounded-2xl border border-warm-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="text-base font-bold text-primary font-display">DuitNow QR / Bank Transfer</h3>
              </div>
              
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-warm-200 mb-4 flex flex-col items-center justify-center">
                <div className="w-40 h-40 rounded-lg overflow-hidden mb-3">
                  <img
                    src="/duitnow-qr.png"
                    alt="DuitNow QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-text-muted text-center font-body">Scan to pay instantly</p>
              </div>
              
              {/* Bank Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <div>
                    <p className="text-text-muted text-xs font-medium font-body">Bank Name</p>
                    <p className="text-primary font-bold font-display">Maybank</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <div>
                    <p className="text-text-muted text-xs font-medium font-body">Account Number</p>
                    <p className="text-primary font-bold font-display">1627 5914 6547</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-text-muted text-xs font-medium font-body">Account Name</p>
                    <p className="text-primary font-bold font-display">Mumtazah Darajat Binti Ahmad</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/60 rounded-xl border border-warm-200">
                <p className="text-xs text-text-body font-body">
                  <span className="font-semibold text-accent">Important:</span> Please ensure your payment amount matches the order total exactly.
                </p>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-body font-body">
                Upload Payment Receipt
                <span className="text-text-muted font-normal ml-1">(JPG, PNG, PDF)</span>
              </label>
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-warm-200 rounded-2xl cursor-pointer hover:bg-warm-200/50 hover:border-primary/30 transition-all bg-warm-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    <svg className="w-10 h-10 text-primary/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-primary font-semibold mb-1 font-display">Choose File</p>
                    {receipt && (
                      <p className="text-xs text-text-muted text-center break-all px-2 font-body">
                        {receipt.name}
                      </p>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.png,.pdf"
                      onChange={(e) => setReceipt(e.target.files[0])}
                      required
                      className="hidden"
                    />
                  </div>
                </label>
              </div>
              <p className="text-xs text-text-muted text-center font-body">
                Please ensure your receipt is clear and shows the full payment details.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-warm-50 border-t-2 border-warm-200 p-4 md:p-6 shadow-elevated z-20">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-primary text-warm-50 py-4 md:py-5 text-lg md:text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-2xl hover:bg-primary-dark transition-colors shadow-warm font-display"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-warm-50"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit Order • RM{total.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Modal */}
      {alert && (
        <AlertModal
          message={alert.message}
          onClose={closeAlert}
          type={alert.type || 'error'}
        />
      )}
    </div>
  )
}