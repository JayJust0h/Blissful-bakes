// admin.js (editable)
import { useState } from 'react';

export default function Admin(){
  const [token,setToken]=useState('');
  const [orders,setOrders]=useState([]);
  const [authed,setAuthed]=useState(false);

  const fetchOrders=async(t)=>{
    const res=await fetch('/api/orders',{headers:{'x-admin-token':t}});
    const data=await res.json();
    setOrders(data.orders);
    setAuthed(true);
  };

  if(!authed){
    return <div><input onChange={e=>setToken(e.target.value)}/><button onClick={()=>fetchOrders(token)}>Login</button></div>
  }

  return <div>
    {orders.map(o=>(
      <div key={o.id}>
        {o.id} - {o.customer?.name}
      </div>
    ))}
  </div>
}
