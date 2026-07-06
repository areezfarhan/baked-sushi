import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    // Only fetch pending verification orders
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('status', 'pending_verification')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

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

  const handleReject = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this order? Stock will be restored.')) return

    // First, restore the stock
    const { error: rpcError } = await supabase.rpc('restore_stock', { p_order_id: orderId })
    if (rpcError) {
      console.error('Error restoring stock:', rpcError)
      alert('Error restoring stock')
      return
    }

    // Then update order status
    const { error } = await supabase
      .from('orders')
      .update({ status: 'rejected' })
      .eq('id', orderId)
    
    if (error) {
      console.error('Error rejecting order:', error)
      alert('Error rejecting order')
    } else {
      fetchOrders()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (loading) return <p>Loading orders...</p>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard - Pending Orders</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/admin/history')}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            View History
          </button>
          <button
            onClick={() => navigate('/admin/inventory')}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600'
            }}
          >
            Manage Inventory
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #d1d5db'
        }}>
          <h2>No Pending Orders</h2>
          <p style={{ color: '#6b7280' }}>All caught up! Check back later for new orders.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px' }}>Ref</th>
              <th style={{ padding: '12px 8px' }}>Customer</th>
              <th style={{ padding: '12px 8px' }}>Date</th>
              <th style={{ padding: '12px 8px' }}>Items</th>
              <th style={{ padding: '12px 8px' }}>Total</th>
              <th style={{ padding: '12px 8px' }}>Receipt</th>
              <th style={{ padding: '12px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 8px', fontWeight: '600' }}>{order.order_reference}</td>
                <td style={{ padding: '12px 8px' }}>
                  <div>{order.customer_name}</div>
                  <a 
                    href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '12px', 
                      color: '#2563eb',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💬</span> {order.phone}
                  </a>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {new Date(order.delivery_date).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {order.order_items && order.order_items.map((item, idx) => (
                    <div key={idx}>
                      {item.products?.name} x{item.quantity}
                    </div>
                  ))}
                </td>
                <td style={{ padding: '12px 8px', fontWeight: '600' }}>RM{order.total_amount}</td>
                <td style={{ padding: '12px 8px' }}>
                  {order.receipt_url ? (
                    <a
                      href={order.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'underline' }}
                    >
                      View Receipt
                    </a>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>No receipt</span>
                  )}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApprove(order.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}