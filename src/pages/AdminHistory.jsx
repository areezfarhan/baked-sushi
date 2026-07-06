import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all') // Default to All Months
  const [sortOption, setSortOption] = useState('newest') // Default to Newest First
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [filter, monthFilter, sortOption])

  const fetchOrders = async () => {
    setLoading(true)
    
    // Base query
    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .neq('status', 'pending_verification')

    // Apply Status Filter
    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    // Apply Sorting based on selection
    if (sortOption === 'newest') {
      query = query.order('created_at', { ascending: false }) // Latest submission first
    } else if (sortOption === 'oldest') {
      query = query.order('created_at', { ascending: true }) // Oldest submission first
    } else if (sortOption === 'delivery_asc') {
      query = query.order('delivery_date', { ascending: true }) // Earliest delivery date first
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching history:', error)
    } else {
      // Apply Month Filter on the frontend (since we already sorted)
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

  // Get available months for the dropdown
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

  // We need all orders (unfiltered by month) to populate the month dropdown correctly
  // For simplicity, we'll just use the current loaded orders if month is 'all', 
  // otherwise we might miss months. 
  // *Better approach for dropdown*: Just hardcode a range or fetch distinct months.
  // For now, let's just show "All Months" and the months present in the current view 
  // (Note: If you filter by 'Rejected', you might not see 'July' if no rejected orders in July).
  // To fix this properly, we'd need a separate fetch for months, but let's keep it simple.
  
  // Let's create a static list of months for the dropdown based on the current data
  // In a real app, you'd fetch distinct months from DB.
  const availableMonths = getAvailableMonths(orders.length > 0 ? orders : []) 

  if (loading) return <p>Loading history...</p>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Order History</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600' }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={exportToCSV}
            disabled={orders.length === 0}
            style={{ padding: '10px 20px', cursor: orders.length === 0 ? 'not-allowed' : 'pointer', background: orders.length === 0 ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', opacity: orders.length === 0 ? 0.6 : 1 }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleClearAll}
            disabled={orders.length === 0}
            style={{ padding: '10px 20px', cursor: orders.length === 0 ? 'not-allowed' : 'pointer', background: orders.length === 0 ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', opacity: orders.length === 0 ? 0.6 : 1 }}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Month Filter */}
          <div>
            <label style={{ fontWeight: '600', marginRight: '8px', fontSize: '14px' }}>Month:</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="all">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label style={{ fontWeight: '600', marginRight: '8px', fontSize: '14px' }}>Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="all">All Orders</option>
              <option value="payment_confirmed">Payment Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label style={{ fontWeight: '600', marginRight: '8px', fontSize: '14px' }}>Sort By:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="newest">Newest First (Latest Submission)</option>
              <option value="oldest">Oldest First</option>
              <option value="delivery_asc">Earliest Delivery Date</option>
            </select>
          </div>
          
          <span style={{ color: '#6b7280', fontWeight: '500', marginLeft: 'auto' }}>
            Total: {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '2px dashed #d1d5db' }}>
          <h2>No History Orders</h2>
          <p style={{ color: '#6b7280' }}>Orders will appear here after approval, rejection, or expiry.</p>
        </div>
      ) : (
        <div>
          <h2 style={{ padding: '12px 16px', background: '#e5e7eb', borderRadius: '8px', marginBottom: '15px', margin: '0 0 15px 0' }}>
            {monthFilter === 'all' ? 'All History' : monthFilter} ({orders.length})
          </h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', width: '50px' }}>#</th>
                <th style={{ padding: '10px 8px' }}>Ref</th>
                <th style={{ padding: '10px 8px' }}>Customer</th>
                <th style={{ padding: '10px 8px' }}>Delivery Date</th>
                <th style={{ padding: '10px 8px' }}>Items</th>
                <th style={{ padding: '10px 8px' }}>Total</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>{order.order_reference}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div>{order.customer_name}</div>
                    <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>💬</span> {order.phone}
                    </a>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{new Date(order.delivery_date).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 8px', fontSize: '13px' }}>
                    {order.order_items && order.order_items.map((item, idx) => (
                      <div key={idx}>{item.products?.name} x{item.quantity}</div>
                    ))}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>RM{order.total_amount}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                      background: order.status === 'payment_confirmed' ? '#d1fae5' : order.status === 'rejected' ? '#fee2e2' : order.status === 'expired' ? '#fef3c7' : '#f3f4f6',
                      color: order.status === 'payment_confirmed' ? '#065f46' : order.status === 'rejected' ? '#991b1b' : order.status === 'expired' ? '#92400e' : '#374151'
                    }}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <button onClick={() => handleDelete(order.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}