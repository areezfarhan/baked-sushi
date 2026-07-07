import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import LogoutConfirmation from '../components/LogoutConfirmation';
import RejectConfirmation from '../components/RejectConfirmation';
import { formatPhoneNumber } from '../utils/phoneFormatter'; // 👈 ADD THIS LINE

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCloseModal = () => setShowLogoutModal(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);

  const [expandedOrder, setExpandedOrder] = useState(null);
  const toggleAddress = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const handleConfirmLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/admin/login');
    }
    setShowLogoutModal(false);
  };

  // MOVED UP: fetchOrders must be defined BEFORE useEffect
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))') // Fixed the select syntax
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleApprove = async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'payment_confirmed' })
      .eq('id', orderId)

    if (error) {
      console.error('Error approving order:', error)
      alert('Error approving order')
    } else {
      fetchOrders()
    }
  }

  // This just opens the modal
  const handleRejectClick = (orderId) => {
    setRejectingOrderId(orderId);
    setShowRejectModal(true);
  };

  // This actually does the rejection logic
  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;

    // 1. Restore stock
    const { error: rpcError } = await supabase.rpc('restore_stock', { p_order_id: rejectingOrderId });
    if (rpcError) {
      console.error('Error restoring stock:', rpcError);
      alert('Error restoring stock');
      setShowRejectModal(false);
      return;
    }

    // 2. Update status to rejected
    const { error } = await supabase
      .from('orders')
      .update({ status: 'rejected' })
      .eq('id', rejectingOrderId);

    if (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order');
    } else {
      fetchOrders(); // Refresh the dashboard
    }

    // Close modal and reset
    setShowRejectModal(false);
    setRejectingOrderId(null);
  };

  // ... KEEP ALL YOUR EXISTING RETURN JSX AND BOTTOM NAVIGATION EXACTLY AS IT IS ...

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A237E] mx-auto mb-4"></div>
          <p className="text-gray-700">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#FDFBF7] to-[#F5F0E6] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-500">Pending Verification</p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
            <p className="text-3xl font-bold text-[#1A237E]">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              RM{orders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
            <p className="text-gray-500">No pending orders at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-[#1A237E]/5 to-gray-50 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-lg">{order.order_reference}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-MY', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A237E]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{order.customer_name}</p>
                      <a
                        href={`https://wa.me/${formatPhoneNumber(order.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        {order.phone}
                      </a>
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Delivery: {new Date(order.delivery_date).toLocaleDateString('en-MY')}</span>
                  </div>

                  {/* Expandable Address Section */}
                  {order.delivery_type === 'delivery' && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleAddress(order.id)}
                        className="text-xs text-[#1A237E] font-bold flex items-center gap-1 hover:underline transition-colors"
                      >
                        {expandedOrder === order.id ? 'Hide Address' : 'View Address'}
                        <svg className={`w-3 h-3 transition-transform duration-200 ${expandedOrder === order.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedOrder === order.id && (
                        <div className="mt-2 p-3 bg-[#FDFBF7] rounded-xl border border-[#F5F0E6] text-sm text-gray-700 flex items-start gap-2 animate-fade-in">
                          <svg className="w-4 h-4 text-[#E31E24] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="leading-relaxed">{order.address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-sm font-medium text-gray-900 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.order_items && order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.products?.name}</span>
                          <span className="font-medium text-gray-900">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receipt */}
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {order.receipt_url ? (
                      <a
                        href={order.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#1A237E] hover:underline font-medium"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No receipt uploaded</span>
                    )}
                  </div>

                  {/* Total Amount */}
                  <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Total Amount</span>
                    <span className="text-2xl font-bold text-[#1A237E]">RM{Number(order.total_amount).toFixed(2)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(order.id)}
                      className="flex-1 bg-[#1A237E] hover:bg-[#151a5c] text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(order.id)}
                      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200 rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex flex-col items-center gap-1 text-[#E31E24] px-4 py-2 border-t-2 border-[#E31E24] -mt-3 pt-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/admin/history')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">History</span>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-xs font-medium">Inventory</span>
            </button>
          </div>
        </div>
      </nav>

      <RejectConfirmation
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
      />

      {/* ADD THIS AT THE VERY BOTTOM */}
      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
      />
    </div>
  )
}
