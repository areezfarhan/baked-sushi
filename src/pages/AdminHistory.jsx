import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [sortOption, setSortOption] = useState('newest')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [filter, monthFilter, sortOption])

  const fetchOrders = async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .neq('status', 'pending_verification')

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    if (sortOption === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortOption === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sortOption === 'delivery_asc') {
      query = query.order('delivery_date', { ascending: true })
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching history:', error)
    } else {
      let filteredData = data || []
      if (monthFilter !== 'all') {
        filteredData = filteredData.filter(order => {
          const orderDate = new Date(order.delivery_date)
          const orderMonth = orderDate.toLocaleString('default', { month: 'long', year: 'numeric' })
          return orderMonth === monthFilter
        })
      }
      setOrders(filteredData)
    }
    setLoading(false)
  }

  const handleDelete = async (orderId) => {
    if (!window.confirm('Delete this order permanently?')) return
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    if (error) {
      console.error('Error deleting order:', error)
      alert('Error deleting order')
    } else {
      fetchOrders()
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('WARNING: This will delete ALL history orders permanently. Are you sure?')) return
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('status', 'pending_verification')
    if (error) {
      console.error('Error clearing history:', error)
      alert('Error clearing history')
    } else {
      fetchOrders()
    }
  }

  const exportToCSV = () => {
    const headers = ['#', 'Order Ref', 'Customer', 'Phone', 'Date', 'Items', 'Total', 'Status', 'Created At']
    const rows = orders.map((order, index) => [
      index + 1,
      order.order_reference,
      order.customer_name,
      order.phone,
      new Date(order.delivery_date).toLocaleDateString(),
      order.order_items?.map(item => `${item.products?.name} x${item.quantity}`).join(', ') || '',
      `RM${order.total_amount}`,
      order.status,
      new Date(order.created_at).toLocaleString()
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders_history_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getAvailableMonths = (allOrders) => {
    const months = new Set()
    allOrders.forEach(order => {
      const date = new Date(order.delivery_date)
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })
      months.add(monthYear)
    })
    return Array.from(months).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB - dateA
    })
  }

  const availableMonths = getAvailableMonths(orders.length > 0 ? orders : [])

  // Helper for status badge colors
  const getStatusStyles = (status) => {
    switch (status) {
      case 'payment_confirmed': return 'bg-green-100 text-green-700 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
      case 'expired': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-main">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-main">Order History</h1>
          <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* Top Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={orders.length === 0}
            className="flex-1 bg-white text-text-main border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-soft"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button
            onClick={handleClearAll}
            disabled={orders.length === 0}
            className="flex-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Clear All
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-2xl shadow-soft space-y-4">
          
          {/* Status Pills (Horizontal Scroll) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
            <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar">
              {[
                { value: 'all', label: 'All Orders' },
                { value: 'payment_confirmed', label: 'Confirmed' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'expired', label: 'Expired' }
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => setFilter(status.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filter === status.value
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-warm-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Month & Sort Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Month</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="input-field w-full text-sm"
              >
                <option value="all">All Months</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort By</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="input-field w-full text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="delivery_asc">Earliest Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Feed */}
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-soft text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-text-main mb-2">No History Orders</h2>
            <p className="text-gray-500 text-sm">Orders will appear here after approval, rejection, or expiry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-soft overflow-hidden">
                
                {/* Card Header */}
                <div className="bg-gradient-to-r from-gray-50 to-warm-100 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-text-main text-lg">{order.order_reference}</span>
                    <span className="text-xs text-gray-400 ml-2">#{index + 1}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(order.status)}`}>
                    {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-main truncate">{order.customer_name}</p>
                      <a
                        href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        {order.phone}
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Delivery</p>
                      <p className="text-sm font-medium text-text-main">{new Date(order.delivery_date).toLocaleDateString('en-MY')}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="space-y-1">
                      {order.order_items && order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.products?.name}</span>
                          <span className="font-medium text-text-main">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total & Delete Action */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="bg-warm-50 rounded-xl px-4 py-2">
                      <span className="text-xs text-gray-500 block">Total</span>
                      <span className="text-xl font-bold text-primary">RM{order.total_amount}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete Order"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-text-main px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/admin/history')}
              className="flex flex-col items-center gap-1 text-primary px-4 py-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs font-medium">History</span>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-text-main px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span className="text-xs font-medium">Inventory</span>
            </button>
            <button
              onClick={() => { supabase.auth.signOut(); navigate('/admin/login') }}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-600 px-4 py-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}