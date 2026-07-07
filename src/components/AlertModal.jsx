import { useEffect } from 'react'

export default function AlertModal({ message, onClose, onConfirm, type = 'error', confirmText = 'Clear Cart' }) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const isConfirmation = !!onConfirm

  const icons = {
    error: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  // UPDATED: Changed warning colors from yellow to red/pink to match error style
  const bgColors = {
    error: 'bg-red-50',
    warning: 'bg-red-50',  // Changed from bg-yellow-50
    info: 'bg-blue-50'
  }

  const textColors = {
    error: 'text-red-800',
    warning: 'text-red-800',  // Changed from text-yellow-800
    info: 'text-blue-800'
  }

  const borderColors = {
    error: 'border-red-200',
    warning: 'border-red-200',  // Changed from border-yellow-200
    info: 'border-blue-200'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`${bgColors[type]} ${borderColors[type]} border rounded-2xl shadow-2xl max-w-sm w-full p-6 transform animate-slideUp`}
        role={isConfirmation ? "alertdialog" : "alert"}
      >
        <div className="flex items-start gap-4">
          <div className={`${textColors[type]} flex-shrink-0`}>
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${textColors[type]} mb-1`}>
              {isConfirmation ? 'Confirm Action' : type === 'error' ? 'Oops!' : type === 'warning' ? 'Notice' : 'Information'}
            </h3>
            <p className={`${textColors[type]} text-sm leading-relaxed`}>
              {message}
            </p>
          </div>
        </div>
        
        {/* Button Container */}
        <div className={`mt-6 flex gap-3 ${isConfirmation ? 'justify-end' : ''}`}>
          {isConfirmation ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-white/60 hover:bg-white/80 text-text-main rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-2.5 px-4 ${textColors[type]} bg-white/60 hover:bg-white/80 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'error' || type === 'warning' ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}