import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

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

  // If cart is empty, send them back to menu
  if (cartItems.length === 0) {
    return <div>Your cart is empty. <a href="/">Go to Menu</a></div>
  }

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

    const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Upload the receipt to Supabase Storage
      const fileExt = receipt.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}` // Unique name so files don't overwrite
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, receipt)

      if (uploadError) throw uploadError

      // 2. Get the public URL of the uploaded receipt
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath)
      const receiptUrl = urlData.publicUrl

      // 3. Call the atomic database function (from Milestone 1)
      // IMPORTANT: Make sure 'place_order' matches the exact name of your Postgres function!
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
        clearCart() // Empty the cart
        navigate(`/confirmation/${data.order_reference}`) // Go to success page
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
    <div>
      <h1>Checkout</h1>
      
      <h3>Order Summary</h3>
      <p>Date: {cartItems[0].date}</p>
      <ul>
        {cartItems.map((item, index) => (
          <li key={index}>{item.product.name} x {item.quantity} = RM{item.product.price * item.quantity}</li>
        ))}
      </ul>
      <h3>Total: RM{total}</h3>
      
      <hr />
      
      <h2>Customer Details</h2>
      <form onSubmit={handleSubmit}>
        
        <label>Full Name:</label><br />
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required /><br /><br />

        <label>WhatsApp Number:</label><br />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /><br /><br />

        <label>Delivery Type:</label><br />
        <input 
          type="radio" 
          value="pickup" 
          checked={deliveryType === 'pickup'} 
          onChange={(e) => setDeliveryType(e.target.value)} 
        /> Pickup
        <input 
          type="radio" 
          value="delivery" 
          checked={deliveryType === 'delivery'} 
          onChange={(e) => setDeliveryType(e.target.value)} 
        /> Delivery<br /><br />

        {deliveryType === 'delivery' && (
          <div>
            <label>Address:</label><br />
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} required /><br />
            <p><i>Note: Delivery charges vary depending on location and will be confirmed via WhatsApp.</i></p>
          </div>
        )}

        <hr />

        <h2>Payment</h2>
        <p><b>DuitNow QR / Bank Transfer:</b></p>
        <p>Bank: Maybank</p>
        <p>Account Number: 1234567890 (Replace with your real one later)</p>
        <p>Account Name: Baked Sushi Owner</p>
        <br />

        <label>Upload Receipt (JPG, PNG, PDF):</label><br />
        <input 
          type="file" 
          accept=".jpg,.png,.pdf" 
          onChange={(e) => setReceipt(e.target.files[0])} 
          required 
        /><br />
        <p><i>Please ensure your receipt is clear before submitting.</i></p>
        <br />

        <button type="submit" disabled={isSubmitting}>
         {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </button>
      </form>
    </div>
  )
}

const handleSubmit = async (e) => {
  e.preventDefault()
  console.log('Form submitted!') // Debug log 1
  setIsSubmitting(true)

  try {
    console.log('Starting upload...') // Debug log 2
    
    // 1. Upload the receipt
    const fileExt = receipt.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    console.log('Uploading file:', filePath) // Debug log 3

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, receipt)

    if (uploadError) {
      console.error('Upload error:', uploadError) // Debug log 4
      throw uploadError
    }

    console.log('Upload success:', uploadData) // Debug log 5

    // 2. Get the public URL
    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath)
    const receiptUrl = urlData.publicUrl
    console.log('Receipt URL:', receiptUrl) // Debug log 6

    // 3. Call the atomic function
    console.log('Calling place_order function...') // Debug log 7
    console.log('Cart items:', cartItems) // Debug log 8

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

    console.log('Function response:', { data, error }) // Debug log 9

    if (error) {
      console.error('Function error:', error) // Debug log 10
      throw error
    }

    // 4. Handle the response
    if (data.status === 'sold_out') {
      alert(`Sold out! ${data.message || 'Please try another date.'}`)
      setIsSubmitting(false)
    } else if (data.status === 'success') {
      console.log('Order successful! Reference:', data.order_reference) // Debug log 11
      clearCart()
      navigate(`/confirmation/${data.order_reference}`)
    } else {
      alert('An unexpected error occurred.')
      setIsSubmitting(false)
    }

  } catch (err) {
    console.error('Full error details:', err) // Debug log 12
    console.error('Error message:', err.message) // Debug log 13
    alert('Failed to submit order. Please try again.')
    setIsSubmitting(false)
  }
}