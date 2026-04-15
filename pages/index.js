// Blissful-bakes-main/pages/index.js
import { useState } from 'react';
import { menuItems, contact } from '../lib/menu';
import Head from 'next/head';

export default function Home() {
  const [step, setStep] = useState('menu');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [customerInfo, setCustomerInfo] = useState({ 
    name: '', phone: '', address: '', notes: '', dietaryNeeds: '' 
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [lightbox, setLightbox] = useState(null);

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);

  const getSelectedSize = (item) => selectedSizes[item.id] ?? 0;

  const addToCart = (item) => {
    const sizeIdx = getSelectedSize(item);
    const size = item.sizes[sizeIdx];
    const key = `${item.id}-${sizeIdx}`;
    const existing = cart.find(c => c.key === key);
    if (existing) {
      setCart(cart.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { key, item, sizeIdx, size, qty: 1 }]);
    }
  };

  const removeFromCart = (key) => setCart(cart.filter(c => c.key !== key));
  const updateQty = (key, delta) => {
    setCart(cart.map(c => c.key === key ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.size.price * c.qty, 0);
  const total = cartTotal + Number(deliveryFee || 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerInfo,
          items: cart.map(c => ({
            name: c.item.name,
            size: c.size.label,
            price: c.size.price,
            qty: c.qty,
            subtotal: c.size.price * c.qty,
          })),
          total,
          deliveryFee: Number(deliveryFee) || 0,
          depositAmount: Number(depositAmount) || 0,
        }),
      });
      const data = await res.json();
      setPlacedOrder(data.order);
      setStep('confirm');
      setCart([]);
    } catch {
      alert('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const whatsappMsg = placedOrder
    ? `Hello Blissful Bakes! 🎂 I just placed Order ${placedOrder.id}.\n\nName: ${placedOrder.customer.name}\nItems:\n${placedOrder.items.map(i => `• ${i.qty}x ${i.name} (${i.size}) - Ksh ${i.subtotal.toLocaleString()}`).join('\n')}\nTotal: Ksh ${placedOrder.total.toLocaleString()}\nDelivery Fee: Ksh ${placedOrder.deliveryFee || 0}\nDeposit: Ksh ${placedOrder.depositAmount || 0}\nDietary Needs: ${placedOrder.customer.dietaryNeeds || 'None'}\nNotes: ${placedOrder.customer.notes || 'None'}\n\nPlease confirm my order. Thank you!`
    : '';

  const isFormValid = customerInfo.name && customerInfo.phone && customerInfo.address;

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice — ${placedOrder.id}</title>
        <style>
          body { font-family: 'DM Sans', Arial, sans-serif; padding: 40px; max-width: 800px; margin: auto; line-height: 1.6; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo img { height: 140px; }
          h1 { text-align: center; color: #3d2314; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e8d5c0; padding: 10px; text-align: left; }
          th { background: #fdf8f0; }
          .total-row { font-weight: 700; font-size: 1.3em; background: #3d2314; color: white; }
          .footer { text-align: center; margin-top: 50px; color: #8a6a55; }
        </style>
      </head>
      <body>
        <div class="logo">
          <img src="/images/logo.png" alt="Blissful Bakes" />
        </div>
        <h1>INVOICE / RECEIPT</h1>
        <p><strong>Order ID:</strong> ${placedOrder.id} &nbsp;&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString('en-KE')}</p>
        <p><strong>Customer:</strong> ${placedOrder.customer.name}</p>
        <p><strong>Phone:</strong> ${placedOrder.customer.phone}</p>
        <p><strong>Delivery Address:</strong> ${placedOrder.customer.address}</p>
        ${placedOrder.customer.dietaryNeeds ? `<p><strong>Dietary Needs / Allergies:</strong> ${placedOrder.customer.dietaryNeeds}</p>` : ''}
        ${placedOrder.customer.notes ? `<p><strong>Special Instructions:</strong> ${placedOrder.customer.notes}</p>` : ''}
        
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${placedOrder.items.map(item => `
              <tr>
                <td>${item.name} (${item.size})</td>
                <td>${item.qty}</td>
                <td>Ksh ${item.price.toLocaleString()}</td>
                <td>Ksh ${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p><strong>Subtotal:</strong> Ksh ${cartTotal.toLocaleString()}</p>
        <p><strong>Delivery Fee:</strong> Ksh ${placedOrder.deliveryFee?.toLocaleString() || '0'}</p>
        <p><strong>Deposit Paid:</strong> Ksh ${placedOrder.depositAmount?.toLocaleString() || '0'}</p>
        <p class="total-row" style="padding:15px; text-align:right;">TOTAL: Ksh ${placedOrder.total.toLocaleString()}</p>
        
        <div class="footer">
          Thank you for ordering from Blissful Bakes!<br>
          📞 ${contact.phone} &nbsp;&nbsp; 🎂 Made with love in Kenya
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <Head>
        <title>Blissful Bakes — Freshly Baked Edition</title>
        <meta name="description" content="Order freshly baked cakes and cupcakes from Blissful Bakes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎂</text></svg>" />
      </Head>

      {/* Lightbox remains unchanged */}
      {lightbox && ( /* ... same lightbox code as before ... */ )}

      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        {/* HEADER WITH LOGO */}
        <header style={{ background: 'var(--brown)', color: 'white', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/images/logo.png" alt="Blissful Bakes" style={{ height: 52 }} />
            </div>
            {step === 'menu' && (
              <button onClick={() => cart.length && setStep('cart')} style={{ /* same cart button styles as before */ }}>
                🛒 Cart {cartCount > 0 && <span style={{ /* badge */ }}>{cartCount}</span>}
              </button>
            )}
          </div>
        </header>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          {/* MENU, CART, DETAILS steps remain almost identical – only details step updated below */}

          {/* ── DETAILS STEP (new fields added) ── */}
          {step === 'details' && (
            <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 560, margin: '0 auto', paddingTop: 40 }}>
              <button onClick={() => setStep('cart')} style={{ /* back button */ }}>← Back to Cart</button>
              <h2 style={{ fontSize: 28, color: 'var(--brown)', marginBottom: 6 }}>Your Details</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Name, Phone, Address fields – same as before */}
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Your name', type: 'text' },
                  { key: 'phone', label: 'Phone Number', placeholder: '+254...', type: 'tel' },
                  { key: 'address', label: 'Delivery Address', placeholder: 'Street, Estate, Town', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                      {field.label} <span style={{ color: 'var(--gold)' }}>*</span>
                    </label>
                    <input type={field.type} placeholder={field.placeholder} value={customerInfo[field.key]} onChange={e => setCustomerInfo(i => ({ ...i, [field.key]: e.target.value }))} style={{ /* input style */ }} />
                  </div>
                ))}

                {/* NEW: Dietary Needs */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>Dietary Needs / Allergies <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea placeholder="e.g. no nuts, gluten-free, vegan..." value={customerInfo.dietaryNeeds} onChange={e => setCustomerInfo(i => ({ ...i, dietaryNeeds: e.target.value }))} rows={2} style={{ /* textarea style */ }} />
                </div>

                {/* Special Notes (existing) */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>Special Instructions <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <textarea placeholder="Custom cake message, preferred delivery time..." value={customerInfo.notes} onChange={e => setCustomerInfo(i => ({ ...i, notes: e.target.value }))} rows={3} style={{ /* textarea style */ }} />
                </div>

                {/* NEW: Delivery Fee & Deposit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>Delivery Fee (Ksh)</label>
                    <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>Deposit Amount (Ksh)</label>
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)' }} />
                  </div>
                </div>
              </div>

              {/* Order Summary with new fields */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: 16, marginTop: 24, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 10 }}>Order Summary</div>
                {cart.map(c => (
                  <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span>{c.qty}× {c.item.name} ({c.size.label})</span>
                    <span>Ksh {(c.size.price * c.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>Ksh {cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Fee</span>
                  <span>Ksh {Number(deliveryFee).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Deposit</span>
                  <span>Ksh {Number(depositAmount).toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--brown)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Ksh {total.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading || !isFormValid} style={{ /* button style */ }}>
                {loading ? '⏳ Placing Order...' : '🎂 Place Order'}
              </button>
            </div>
          )}

          {/* ── CONFIRM STEP (now includes receipt button + logo) ── */}
          {step === 'confirm' && placedOrder && (
            <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: 560, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 32, color: 'var(--brown)' }}>Order Placed!</h2>
              <div style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--brown)', borderRadius: 30, padding: '6px 20px', fontWeight: 700, fontSize: 15, marginBottom: 32 }}>
                Order ID: {placedOrder.id}
              </div>

              {/* Invoice-style summary */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 24px', textAlign: 'left', marginBottom: 28 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img src="/images/logo.png" alt="Blissful Bakes" style={{ height: 90 }} />
                </div>
                {/* ... rest of order summary with delivery fee, deposit, dietary needs ... same as before but now includes new fields */}
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 12 }}>Your Order</div>
                {/* items, total, delivery fee, deposit, dietary, notes */}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`} target="_blank" rel="noopener noreferrer" style={{ /* WhatsApp button */ }}>
                  💬 WhatsApp Us
                </a>
                <button onClick={handlePrintReceipt} style={{ background: 'var(--brown)', color: 'white', borderRadius: 10, padding: '13px 24px', fontWeight: 700 }}>
                  🖨️ Print Invoice / Receipt
                </button>
              </div>

              <button onClick={() => { setStep('menu'); setCustomerInfo({ name: '', phone: '', address: '', notes: '', dietaryNeeds: '' }); setPlacedOrder(null); setDeliveryFee(0); setDepositAmount(0); }} style={{ /* Place another order button */ }}>
                Place Another Order
              </button>
            </div>
          )}
        </main>

        <footer style={{ /* same footer */ }}>
          © {new Date().getFullYear()} Blissful Bakes · Made with ❤️ · {contact.phone}
        </footer>
      </div>
    </>
  );
}
