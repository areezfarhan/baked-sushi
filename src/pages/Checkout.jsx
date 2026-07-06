import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Helper to format date as "7 Jul 2026"
const formatDateAesthetic = (dateString) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [year, month, day] = dateString.split('-')
  const monthName = months[parseInt(month) - 1]
  return `${parseInt(day)} ${monthName} ${year}`
}

export default function Checkout() {
  const { cartItems, clearCart } = useCart() // FIXED: Correctly using useCart()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [deliveryType, setDeliveryType] = useState('pickup')
  const [address, setAddress] = useState('')
  const [receipt, setReceipt] = useState(null)

  // If cart is empty, send them back to menu
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <p className="text-text-muted mb-4">Your cart is empty.</p>
        <Link to="/" className="btn-secondary inline-block">
          Go to Menu
        </Link>
      </div>
    )
  }

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Upload the receipt to Supabase Storage
      const fileExt = receipt.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, receipt)
      if (uploadError) throw uploadError

      // 2. Get the public URL of the uploaded receipt
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath)
      const receiptUrl = urlData.publicUrl

      // 3. Call the atomic database function
      const { data, error } = await supabase.rpc('place_order', {
        p_product_ids: cartItems.map(item => item.product.id),
        p_quantities: cartItems.map(item => item.quantity),
        p_date: cartItems[0].date,
        p_customer_name: name,
        p_phone: phone,
        p_delivery_type: deliveryType,
        p_address: deliveryType === 'delivery' ? address : null,
        p_total_amount: total,
        p_receipt_url: receiptUrl
      })
      if (error) throw error

      // 4. Handle the response
      if (data.status === 'sold_out') {
        alert(`Sold out! ${data.message || 'Please try another date.'}`)
        setIsSubmitting(false)
      } else if (data.status === 'success') {
        // --- START: TRIGGER ADMIN EMAIL ---
        try {
          await supabase.functions.invoke('send-order-email', {
            body: { order_reference: data.order_reference }
          })
        } catch (err) {
          console.error('Edge function error:', err)
        }
        // --- END: TRIGGER ADMIN EMAIL ---

        clearCart()
        navigate(`/confirmation/${data.order_reference}`)
      } else {
        alert('An unexpected error occurred.')
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Submission error:', err)
      alert('Failed to submit order. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Back Button */}
      <Link to="/cart" className="text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1 mb-6">
        ← Back to Cart
      </Link>

      <h1 className="text-3xl font-bold text-text-main mb-6">Checkout</h1>

      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl shadow-soft p-6 mb-8 border border-warm-100">
        <h2 className="text-xl font-semibold text-text-main mb-4">Order Summary</h2>
        <p className="text-text-muted mb-4">
          Delivery Date: <span className="font-semibold text-text-main">{formatDateAesthetic(cartItems[0].date)}</span>
        </p>
        <ul className="space-y-4 mb-6">
          {cartItems.map((item, index) => (
            <li key={index} className="flex items-center gap-4 py-3 border-b border-warm-100 last:border-0">
              {/* Product Image */}
              <div className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden flex-shrink-0">
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1">
                <h3 className="text-text-main font-medium">{item.product.name}</h3>
                <p className="text-sm text-text-muted">Quantity: {item.quantity}</p>
              </div>

              {/* Price */}
              <span className="font-semibold text-text-main">RM{item.product.price * item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center pt-4 border-t-2 border-warm-200">
          <span className="text-lg font-semibold text-text-main">Total</span>
          <span className="text-2xl font-bold text-primary">RM{total}</span>
        </div>
      </div>

      {/* Checkout Form */}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Customer Details Section */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-warm-100">
          <h2 className="text-xl font-semibold text-text-main mb-4">Customer Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field"
                placeholder="e.g., 012-3456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-3">Delivery Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${deliveryType === 'pickup'
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-warm-100 text-text-main hover:bg-warm-200'
                    }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 ${deliveryType === 'delivery'
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-warm-100 text-text-main hover:bg-warm-200'
                    }`}
                >
                  Delivery
                </button>
              </div>
            </div>
            {deliveryType === 'delivery' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Delivery Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows="3"
                    className="input-field resize-none"
                    placeholder="Enter your full address"
                  />
                </div>
                <p className="text-sm text-text-muted bg-warm-50 p-3 rounded-lg border border-warm-200">
                  <i>Note: Delivery charges vary depending on location and will be confirmed via WhatsApp.</i>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-8 border border-warm-100">
          <h2 className="text-xl font-semibold text-text-main mb-4">Payment</h2>

          {/* Payment Info Card */}
          <div className="bg-gradient-to-br from-warm-50 to-warm-100 p-5 rounded-xl border border-warm-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-semibold text-text-main">DuitNow QR / Bank Transfer</h3>
            </div>

            {/* QR Code Placeholder Frame */}
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-warm-200 mb-4 flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-stone-100 rounded-lg flex items-center justify-center mb-3">
                {/* Replace this with your actual QR code image later */}
                <div className="text-center">
                  <svg className="w-16 h-16 text-stone-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p className="text-xs text-text-muted">Your QR Code Here</p>
                </div>
              </div>
              <p className="text-xs text-text-muted text-center">Scan to pay instantly</p>
            </div>

            {/* Bank Details */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <div>
                  <p className="text-text-muted font-medium">Bank Name</p>
                  <p className="text-text-main font-semibold">Maybank</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <div>
                  <p className="text-text-muted font-medium">Account Number</p>
                  <p className="text-text-main font-semibold">1234567890</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-text-muted font-medium">Account Name</p>
                  <p className="text-text-main font-semibold">Baked Sushi Owner</p>
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-warm-200">
              <p className="text-xs text-text-muted">
                <span className="font-semibold text-primary">Important:</span> Please ensure your payment amount matches the order total exactly.
              </p>
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-3 flex flex-col items-center text-center mt-6">
            <label className="block text-sm font-medium text-text-main">
              Upload Payment Receipt
              <span className="text-text-muted font-normal ml-1">(JPG, PNG, PDF)</span>
            </label>

            <div className="w-full max-w-md">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-warm-200 rounded-xl cursor-pointer hover:bg-warm-50 hover:border-primary transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {/* Upload Icon */}
                  <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>

                  {/* Choose File Text */}
                  <p className="text-primary font-semibold mb-1">Choose File</p>

                  {/* Filename Display - Shows below icon, keeps everything centered */}
                  {receipt && (
                    <p className="text-sm text-text-muted mt-1 break-all px-2">
                      {receipt.name}
                    </p>
                  )}

                  {/* Hidden input */}
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

            <p className="text-xs text-text-muted max-w-xs mx-auto">
              Please ensure your receipt is clear and shows the full payment details before submitting.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </button>
      </form>
    </div>
  )
}