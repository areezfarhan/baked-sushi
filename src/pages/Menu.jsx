   import { useEffect, useState } from 'react'
   import { supabase } from '../lib/supabaseClient'
   import { Link } from 'react-router-dom'

   export default function Menu() {
     const [products, setProducts] = useState([])

     useEffect(() => {
       const fetchProducts = async () => {
         const { data, error } = await supabase
           .from('products')
           .select('*')
           .eq('active', true)
         
         if (error) console.error('Error:', error)
         else setProducts(data)
       }
       fetchProducts()
     }, [])

     return (
       <div>
        <Link to="/cart">View Cart</Link>
         <h1>Ugly Menu Page</h1>
         <ul>
           {products.map(p => (
             <li key={p.id}>
               {/* This makes the text a clickable link */}
               <Link to={`/product/${p.id}`}>
                 {p.name} - RM{p.price}
               </Link>
             </li>
           ))}
         </ul>
       </div>
     )
   }