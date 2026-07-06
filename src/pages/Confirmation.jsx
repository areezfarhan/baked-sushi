import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'

export default function Confirmation() {
  const { ref } = useParams()
  const [copied, setCopied] = useState(false)
  
  const adminPhone = "60123456789" // Remember to update this to your real number later!
  const message = `I have ordered, thank you — Order Ref: ${ref}`
  const waLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`

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
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size
      canvas.width = 400
      canvas.height = 300
      
      // Draw background
      ctx.fillStyle = '#FDFBF7'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw title
      ctx.fillStyle = '#2C2A29'
      ctx.font = 'bold 24px Quicksand, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Order Confirmation', canvas.width / 2, 50)
      
      // Draw reference label
      ctx.fillStyle = '#7A7571'
      ctx.font = '14px Quicksand, sans-serif'
      ctx.fillText('YOUR ORDER REFERENCE', canvas.width / 2, 100)
      
      // Draw reference number
      ctx.fillStyle = '#A65E44'
      ctx.font = 'bold 32px Quicksand, sans-serif'
      ctx.fillText(ref, canvas.width / 2, 150)
      
      // Draw instruction
      ctx.fillStyle = '#7A7571'
      ctx.font = 'italic 12px Quicksand, sans-serif'
      ctx.fillText('Please save this reference number', canvas.width / 2, 180)
      
      // Convert to blob and download
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
      alert('Failed to save image. Please try copying the reference number instead.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-12">
      
      {/* Success Icon */}
      <div className="bg-accent/10 p-6 rounded-full mb-6">
        <svg className="w-16 h-16 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-text-main mb-4">Order Placed!</h1>
      
      <p className="text-text-muted max-w-md mb-2">
        Thank you for your order!
      </p>
      <p className="text-text-muted max-w-md mb-8">
        You will receive a WhatsApp confirmation once your payment has been approved.
      </p>

      {/* Order Reference Card */}
      <div className="bg-white rounded-2xl shadow-soft p-6 w-full max-w-sm border border-warm-100 mb-6">
        <p className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
          Your Order Reference
        </p>
        <h2 className="text-2xl font-bold text-primary tracking-wide mb-2">
          {ref}
        </h2>
        <p className="text-xs text-text-muted italic mb-4">
          Please save this reference number.
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-warm-100 text-text-main rounded-lg text-sm font-medium hover:bg-warm-200 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          
          <button
            onClick={handleSaveAsImage}
            className="px-4 py-2 bg-warm-100 text-text-main rounded-lg text-sm font-medium hover:bg-warm-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Save as PNG
          </button>
        </div>
      </div>

      {/* WhatsApp Button */}
      <p className="text-text-main font-medium mb-4">Want to let us know you've ordered?</p>
      <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full max-w-sm block">
        <button className="btn-primary w-full flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          Message us on WhatsApp
        </button>
      </a>

      {/* Return to Menu Link */}
      <Link to="/" className="mt-8 text-primary font-medium hover:text-primary-dark transition-colors">
        ← Return to Menu
      </Link>
    </div>
  )
}