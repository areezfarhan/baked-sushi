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
  const [receipt, setReceipt] = useState(null)

  // Alert state
  const [alert, setAlert] = useState(null)
  const closeAlert = () => setAlert(null)

  // If cart is empty, send them back to menu
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] flex flex-col items-center justify-center text-center px-6">
        <div className="bg-white p-8 rounded-full mb-6 shadow-xl border-2 border-[#F5F0E6]">
          <svg className="w-16 h-16 text-[#1A237E]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1A237E] mb-2 font-display">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto font-body">Add some delicious baked sushi to get started.</p>
        <Link to="/" className="px-8 py-3 bg-[#E31E24] text-white rounded-2xl font-bold font-display hover:bg-[#C41820] transition-colors shadow-lg">
          Go to Menu
        </Link>
      </div>
    )
  }

  // UPDATED: Calculate total using item.price (for variants) or product.price (for sushi)
  const total = cartItems.reduce((sum, item) => {
    const price = item.price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault()

    // VALIDATION: Check all required fields
    if (!name || name.trim() === '') {
      setAlert({
        message: 'Please enter your full name.',
        type: 'error'
      })
      return
    }

    if (!phone || phone.trim() === '') {
      setAlert({
        message: 'Please enter your WhatsApp number.',
        type: 'error'
      })
      return
    }

    if (!receipt) {
      setAlert({
        message: 'Please upload your payment receipt.',
        type: 'error'
      })
      return
    }

    if (deliveryType === 'delivery' && (!address || address.trim() === '')) {
      setAlert({
        message: 'Please enter your delivery address.',
        type: 'error'
      })
      return
    }

    // All validations passed - proceed with submission
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

      // 3. Prepare order items data (with variant info)
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.price || item.product.price,
        variant: item.variant || null
      }))

      // 4. Call the atomic database function
      const { data, error } = await supabase.rpc('place_order', {
        p_product_ids: cartItems.map(item => item.product.id),
        p_quantities: cartItems.map(item => item.quantity),
        p_prices: cartItems.map(item => item.price || item.product.price), // 👈 ADD THIS LINE
        p_variants: cartItems.map(item => item.variant || null), // 👈 ADD THIS LINE
        p_date: cartItems[0].date,
        p_customer_name: name,
        p_phone: phone,
        p_delivery_type: deliveryType,
        p_address: deliveryType === 'delivery' ? address : null,
        p_total_amount: total,
        p_receipt_url: receiptUrl
      })

      if (error) throw error

      // 5. Handle the response
      if (data.status === 'sold_out') {
        setAlert({
          message: `Sold out! ${data.message || 'Please try another date.'}`,
          type: 'warning'
        })
        setIsSubmitting(false)
      } else if (data.status === 'success') {
        // Trigger admin email
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
        setAlert({
          message: 'An unexpected error occurred.',
          type: 'error'
        })
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Submission error:', err)
      setAlert({
        message: 'Failed to submit order. Please try again.',
        type: 'error'
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] pb-32">
      {/* Sticky Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#F5F0E6]">
        <div className="max-w-3xl mx-auto px-4 py-4 md:py-5 flex items-center gap-4">
          <Link to="/cart" className="text-[#1A237E] hover:text-[#E31E24] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A237E] font-display">Checkout</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">

        {/* Order Summary Card */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-[#F5F0E6] p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-[#1A237E] font-display">Order Summary</h2>
            <div className="bg-[#1A237E]/10 text-[#1A237E] px-3 py-1 rounded-full text-xs font-semibold border border-[#1A237E]/20 font-body">
              {formatDateAesthetic(cartItems[0].date)}
            </div>
          </div>

          <ul className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            {cartItems.map((item, index) => {
              // Get the correct price for this item
              const itemPrice = item.price || item.product.price;

              return (
                <li key={index} className="flex items-center gap-3 md:gap-4 py-2 border-b border-[#F5F0E6] last:border-0 last:pb-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 border border-[#F5F0E6]">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-bold text-[#1A237E] font-body leading-snug">
                      {item.product.name}
                      {/* Show variant if it exists */}
                      {item.variant && <span className="text-xs font-normal text-gray-500 ml-1 font-body">({item.variant})</span>}
                    </h3>
                    <p className="text-xs text-gray-500 font-body mt-1">Qty: {item.quantity}</p>
                  </div>

                  <span className="font-bold text-[#E31E24] font-display text-sm md:text-base">
                    RM{(itemPrice * item.quantity).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-between items-center pt-4 border-t-2 border-[#F5F0E6]">
            <span className="text-base md:text-lg font-bold text-[#1A237E] font-display">Total</span>
            <span className="text-2xl md:text-3xl font-bold text-[#E31E24] font-display">RM{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">

          {/* Customer Details Section */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-[#F5F0E6] p-5 md:p-6 space-y-4 md:space-y-5">
            <h2 className="text-lg md:text-xl font-bold text-[#1A237E] font-display">Customer Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-body">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#F5F0E6] bg-[#FDFBF7] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E] transition-all duration-200 font-body"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-body">WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#F5F0E6] bg-[#FDFBF7] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E] transition-all duration-200 font-body"
                placeholder="e.g., 012-3456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 font-body">Delivery Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all font-display ${deliveryType === 'pickup'
                      ? 'bg-[#E31E24] text-white shadow-lg'
                      : 'bg-[#FDFBF7] text-gray-700 border border-[#F5F0E6] hover:bg-[#F5F0E6]'
                    }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all font-display ${deliveryType === 'delivery'
                      ? 'bg-[#E31E24] text-white shadow-lg'
                      : 'bg-[#FDFBF7] text-gray-700 border border-[#F5F0E6] hover:bg-[#F5F0E6]'
                    }`}
                >
                  Delivery
                </button>
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-body">Delivery Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-[#F5F0E6] bg-[#FDFBF7] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E] transition-all duration-200 resize-none font-body"
                    placeholder="Enter your full address"
                  />
                </div>
                <div className="bg-[#1A237E]/5 border border-[#1A237E]/20 rounded-xl p-3">
                  <p className="text-xs text-[#1A237E] font-body">
                    <span className="font-semibold">Note:</span> Delivery charges vary depending on location and will be confirmed via WhatsApp.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-3xl shadow-xl border-2 border-[#F5F0E6] p-5 md:p-6 space-y-5">
            <h2 className="text-lg md:text-xl font-bold text-[#1A237E] font-display">Payment</h2>

            {/* Payment Info Card */}
            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] p-4 md:p-5 rounded-2xl border border-[#F5F0E6]">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#E31E24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="text-base font-bold text-[#1A237E] font-display">DuitNow QR / Bank Transfer</h3>
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-[#F5F0E6] mb-4 flex flex-col items-center justify-center">
                <div className="w-40 h-40 rounded-lg overflow-hidden mb-3">
                  <img
                    src="/duitnow-qr.png"
                    alt="DuitNow QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center font-body">
                  Scan to pay instantly
                </p>
              </div>

              {/* Bank Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#E31E24] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <div>
                    <p className="text-gray-500 text-xs font-medium font-body">Bank Name</p>
                    <p className="text-[#1A237E] font-bold font-display">Maybank</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#E31E24] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <div>
                    <p className="text-gray-500 text-xs font-medium font-body">Account Number</p>
                    <p className="text-[#1A237E] font-bold font-display">1627 5914 6547</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#E31E24] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-gray-500 text-xs font-medium font-body">Account Name</p>
                    <p className="text-[#1A237E] font-bold font-display">Mumtazah Darajat Binti Ahmad</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/60 rounded-xl border border-[#F5F0E6]">
                <p className="text-xs text-gray-600 font-body">
                  <span className="font-semibold text-[#E31E24]">Important:</span> Please ensure your payment amount matches the order total exactly.
                </p>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 font-body">
                Upload Payment Receipt
                <span className="text-gray-500 font-normal ml-1">(JPG, PNG, PDF)</span>
              </label>
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#F5F0E6] rounded-2xl cursor-pointer hover:bg-[#F5F0E6]/50 hover:border-[#1A237E]/30 transition-all bg-[#FDFBF7]">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    <svg className="w-10 h-10 text-[#1A237E]/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-[#1A237E] font-semibold mb-1 font-display">Choose File</p>
                    {receipt && (
                      <p className="text-xs text-gray-500 text-center break-all px-2 font-body">
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
              <p className="text-xs text-gray-500 text-center font-body">
                Please ensure your receipt is clear and shows the full payment details.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F5F0E6] p-4 md:p-6 shadow-2xl z-20">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#E31E24] text-white py-4 md:py-5 text-lg md:text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-2xl hover:bg-[#C41820] transition-colors shadow-lg font-display"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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