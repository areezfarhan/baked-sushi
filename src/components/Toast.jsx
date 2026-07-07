import { useEffect } from 'react'

export default function Toast({ message, onClose }) {
  useEffect(() => {
    // Auto-dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-slideDown">
      <div className="bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3 flex items-center gap-3 max-w-sm">
        <div className="bg-green-100 p-1.5 rounded-full">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-text-main text-sm">{message}</p>
        </div>
      </div>
    </div>
  )
}