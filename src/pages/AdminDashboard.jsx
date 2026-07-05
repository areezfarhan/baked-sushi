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
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching orders:', error)
        } else {
            setOrders(data)
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
                <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                    }}
                >
                    Logout
                </button>
                <button
                    onClick={() => navigate('/admin/inventory')}
                    style={{
                        marginRight: '10px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                    }}
                >
                    Manage Inventory
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px' }}>Ref</th>
                        <th style={{ padding: '12px 8px' }}>Customer</th>
                        <th style={{ padding: '12px 8px' }}>Date</th>
                        <th style={{ padding: '12px 8px' }}>Items</th>
                        <th style={{ padding: '12px 8px' }}>Total</th>
                        <th style={{ padding: '12px 8px' }}>Status</th>
                        <th style={{ padding: '12px 8px' }}>Receipt</th>
                        <th style={{ padding: '12px 8px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px 8px' }}>{order.order_reference}</td>
                            <td style={{ padding: '12px 8px' }}>
                                <div>{order.customer_name}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.phone}</div>
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
                            <td style={{ padding: '12px 8px' }}>RM{order.total_amount}</td>
                            <td style={{ padding: '12px 8px' }}>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: order.status === 'payment_confirmed' ? '#d1fae5' :
                                        order.status === 'rejected' ? '#fee2e2' :
                                            order.status === 'expired' ? '#fef3c7' : '#fef3c7',
                                    color: order.status === 'payment_confirmed' ? '#065f46' :
                                        order.status === 'rejected' ? '#991b1b' :
                                            order.status === 'expired' ? '#92400e' : '#92400e'
                                }}>
                                    {order.status.replace(/_/g, ' ')}
                                </span>
                            </td>
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
                                {order.status === 'pending_verification' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleApprove(order.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#22c55e',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '13px'
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(order.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '13px'
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {order.status === 'payment_confirmed' && (
                                    <span style={{ color: '#22c55e', fontWeight: '600' }}>✓ Approved</span>
                                )}
                                {order.status === 'rejected' && (
                                    <span style={{ color: '#ef4444', fontWeight: '600' }}>✗ Rejected</span>
                                )}
                                {order.status === 'expired' && (
                                    <span style={{ color: '#f59e0b', fontWeight: '600' }}>⏱ Expired</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}