import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Confirmation() {
  const { ref } = useParams()
  const [copied, setCopied] = useState(false)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const adminPhone = "60127575453" // Remember to update this to your real number later!
  const message = `I have ordered, thank you — Order Ref: ${ref}`
  const waLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`

  useEffect(() => {
    fetchOrderDetails()
  }, [ref])

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price_at_order,
            products (
              name
            )
          )
        `)
        .eq('order_reference', ref)
        .single()

      if (error) {
        console.error('Error fetching order:', error)
        return
      }
      setOrder(data)
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSaveAsImage = async () => {
    if (!order) return;
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calculate dynamic height based on number of items
      const itemsCount = order.order_items ? order.order_items.length : 0
      const itemHeight = 40 
      const baseHeight = 320 
      const canvasHeight = baseHeight + (itemsCount * itemHeight)
      
      canvas.width = 400
      canvas.height = canvasHeight
      
      // Background
      ctx.fillStyle = '#FDFBF7'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header
      ctx.fillStyle = '#1A237E'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Order Confirmation', canvas.width / 2, 40)
      
      // Ref Label
      ctx.fillStyle = '#7A7571'
      ctx.font = '12px sans-serif'
      ctx.fillText('YOUR ORDER REFERENCE', canvas.width / 2, 70)
      
      // Ref Number
      ctx.fillStyle = '#E31E24'
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText(ref, canvas.width / 2, 110)
      
      // Divider
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(30, 130)
      ctx.lineTo(370, 130)
      ctx.stroke()
      
      // Delivery Date
      ctx.fillStyle = '#374151'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'left'
      const dateStr = new Date(order.delivery_date).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      ctx.fillText(`Delivery Date: ${dateStr}`, 30, 160)
      
      // Items Header
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('Items Ordered:', 30, 200)
      
      // Items List
      let currentY = 230
      ctx.font = '14px sans-serif'
      if (order.order_items) {
        order.order_items.forEach((item) => {
          const name = item.products?.name || 'Product'
          const qty = item.quantity
          const price = Number(item.price_at_order).toFixed(2)
          const subtotal = (Number(item.price_at_order) * item.quantity).toFixed(2)
          
          // Product Name
          ctx.textAlign = 'left'
          ctx.fillStyle = '#111827'
          ctx.fillText(name, 30, currentY)
          
          // Subtotal (Right aligned)
          ctx.textAlign = 'right'
          ctx.fillStyle = '#1A237E'
          ctx.font = 'bold 14px sans-serif'
          ctx.fillText(`RM${subtotal}`, 370, currentY)
          
          // Qty x Price (Left aligned, smaller)
          ctx.textAlign = 'left'
          ctx.font = '12px sans-serif'
          ctx.fillStyle = '#6B7280'
          ctx.fillText(`Qty: ${qty} × RM${price}`, 30, currentY + 18)
          
          ctx.font = '14px sans-serif' // Reset for next item
          currentY += 40
        })
      }
      
      // Divider before total
      ctx.strokeStyle = '#E5E7EB'
      ctx.beginPath()
      ctx.moveTo(30, currentY + 10)
      ctx.lineTo(370, currentY + 10)
      ctx.stroke()
      
      // Total Amount
      ctx.textAlign = 'left'
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('Total Amount', 30, currentY + 45)
      
      ctx.textAlign = 'right'
      ctx.fillStyle = '#E31E24'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText(`RM${Number(order.total_amount).toFixed(2)}`, 370, currentY + 48)
      
      // Trigger download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `Order-${ref}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('Failed to save image:', err)
      alert('Failed to save image.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E31E24] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1A237E] mb-3 font-display">Order Placed!</h1>
          <p className="text-gray-600 leading-relaxed font-body">
            Thank you for your order! You will receive a WhatsApp confirmation once your payment has been approved.
          </p>
        </div>

        {/* Merged Order Summary Card */}
        {order && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-2 border-[#F5F0E6]">
            {/* Reference Number Section */}
            <div className="text-center mb-6 pb-6 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 font-body">
                Your Order Reference
              </p>
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl font-bold text-[#E31E24] tracking-wide font-display">
                  {ref}
                </h2>
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-lg transition-all ${
                    copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title="Copy reference"
                >
                  {copied ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 mt-2 font-body">Copied to clipboard!</p>}
            </div>

            {/* Order Details Section */}
            <div className="space-y-4">
              {/* Delivery Date */}
              <div className="flex items-center gap-3 text-sm text-gray-700 font-body">
                <svg className="w-5 h-5 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Delivery Date:</span>
                <span>{new Date(order.delivery_date).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              {/* Items Ordered */}
              <div className="pt-2">
                <p className="text-sm font-bold text-gray-900 mb-3 font-display">Items Ordered:</p>
                <div className="space-y-3">
                  {order.order_items && order.order_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm font-display">{item.products?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-body">Qty: {item.quantity} × RM{Number(item.price_at_order).toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-[#1A237E] text-sm font-display ml-4">
                        RM{(Number(item.price_at_order) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-[#FDFBF7] rounded-2xl p-4 flex justify-between items-center border border-[#F5F0E6] mt-4">
                <span className="font-bold text-gray-900 font-display">Total Amount</span>
                <span className="text-2xl font-bold text-[#E31E24] font-display">RM{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Save Image Button (Full Width) */}
            <button
              onClick={handleSaveAsImage}
              className="w-full mt-6 py-3.5 px-4 rounded-2xl font-semibold text-sm bg-[#1A237E] text-white hover:bg-[#151a5c] transition-colors flex items-center justify-center gap-2 font-display shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Save Receipt as PNG
            </button>
          </div>
        )}

        {/* WhatsApp Button */}
        <div className="mb-8">
          <p className="text-gray-700 font-medium mb-4 text-center font-body">
            Want to let us know you've ordered?
          </p>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="block">
            <button className="w-full bg-[#0fa348] text-white py-4 text-base font-bold flex items-center justify-center gap-3 rounded-2xl hover:bg-[#1DA851] transition-colors shadow-lg font-display">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              Message on WhatsApp
            </button>
          </a>
        </div>

        {/* Return to Menu */}
        <div className="text-center">
          <Link to="/" className="text-[#1A237E] font-medium hover:text-[#E31E24] transition-colors inline-flex items-center gap-2 font-body">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Return to Menu
          </Link>
        </div>
      </div>
    </div>
  )
}