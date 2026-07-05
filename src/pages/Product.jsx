import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../context/CartContext'

export default function Product() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [selectedDate, setSelectedDate] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [remainingStock, setRemainingStock] = useState(0)
    const { addToCart } = useCart()

    useEffect(() => {
        // Fetch product details
        const fetchProduct = async () => {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()
            setProduct(data)
        }
        fetchProduct()
    }, [id])

    useEffect(() => {
        // Fetch stock for selected date
        if (selectedDate && product) {
            const checkStock = async () => {
                const { data } = await supabase
                    .from('stock_by_date')
                    .select('remaining_stock')
                    .eq('product_id', product.id)
                    .eq('date', selectedDate)
                    .single()

                setRemainingStock(data?.remaining_stock || 0)
            }
            checkStock()
        }
    }, [selectedDate, product, id])

    if (!product) return <div>Loading...</div>

    return (
        <div>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <p>Price: RM{product.price}</p>

            <h3>Select Date:</h3>
            <input
                type="date"
                value={selectedDate}
                min={(() => {
                    // Get current time in KL (UTC+8)
                    const now = new Date();
                    const klTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
                    const hours = klTime.getHours();

                    // If it's past 9 AM, set minimum date to tomorrow
                    if (hours >= 9) {
                        const tomorrow = new Date(klTime);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return tomorrow.toISOString().split('T')[0];
                    }
                    // Otherwise, allow today
                    return klTime.toISOString().split('T')[0];
                })()}
                onChange={(e) => setSelectedDate(e.target.value)}
            />

            {selectedDate && (
                <div>
                    <p>Remaining Stock: {remainingStock}</p>

                    {remainingStock > 0 && (
                        <>
                            <h3>Quantity:</h3>
                            <input
                                type="number"
                                min="1"
                                max={remainingStock}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                            />

                            <button onClick={() => addToCart(product, selectedDate, quantity)}>
                                Add to Cart
                            </button>
                        </>
                    )}

                    {remainingStock === 0 && (
                        <p style={{ color: 'red' }}>Sold Out</p>
                    )}
                </div>
            )}
        </div>
    )
}