// index.js (cleaned)
import { useState } from 'react';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name:'', phone:'', address:'' });
  const [placedOrder, setPlacedOrder] = useState(null);

  const estimateDelivery = (address) => {
    const a = address.toLowerCase();
    if (a.includes('westlands')) return 200;
    if (a.includes('kilimani')) return 150;
    return 300;
  };

  const cartTotal = cart.reduce((s,c)=>s+c.price*c.qty,0);
  const estimatedDelivery = estimateDelivery(customerInfo.address||'');

  const handlePlaceOrder = async () => {
    const res = await fetch('/api/orders',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        customer:customerInfo,
        items:cart,
        total:cartTotal,
        estimatedDelivery,
        status:'pending_pricing'
      })
    });
    const data = await res.json();
    setPlacedOrder(data.order);
  };

  return (
    <div style={{padding:20}}>
      <h1>Order</h1>
      <input placeholder="Name" onChange={e=>setCustomerInfo({...customerInfo,name:e.target.value})}/>
      <input placeholder="Phone" onChange={e=>setCustomerInfo({...customerInfo,phone:e.target.value})}/>
      <input placeholder="Address" onChange={e=>setCustomerInfo({...customerInfo,address:e.target.value})}/>
      <p>Estimated delivery: {estimatedDelivery}</p>
      <p>Subtotal: {cartTotal}</p>
      <p>⚠️ Final price confirmed by admin</p>
      <button onClick={handlePlaceOrder}>Place Order</button>
      {placedOrder && <p>Order ID: {placedOrder.id}</p>}
    </div>
  );
}
