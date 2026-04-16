// pages/index.js — Blissful Bakes Customer Storefront
// Updated: delivery fee, deposit, dietary needs, receipt with logo, lightbox
import { useState } from 'react';
import { menuItems, contact } from '../lib/menu';
import Head from 'next/head';

const LOGO_PATH = '/images/logo.png';

export default function Home() {
  const [step, setStep] = useState('menu');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [customerInfo, setCustomerInfo] = useState({
    name: '', phone: '', address: '', notes: '', dietaryNeeds: '',
  });
  const [deliveryFee, setDeliveryFee] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
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
  const updateQty = (key, delta) =>
    setCart(cart.map(c => c.key === key ? { ...c, qty: Math.max(1, c.qty + delta) } : c));

  const cartTotal = cart.reduce((sum, c) => sum + c.size.price * c.qty, 0);
  const deliveryNum = Number(deliveryFee) || 0;
  const depositNum = Number(depositAmount) || 0;
  const total = cartTotal + deliveryNum;
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
          deliveryFee: deliveryNum,
          depositAmount: depositNum,
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
    ? `Hello Blissful Bakes! 🎂 I just placed Order ${placedOrder.id}.\n\nName: ${placedOrder.customer.name}\nPhone: ${placedOrder.customer.phone}\nAddress: ${placedOrder.customer.address}\n\nItems:\n${placedOrder.items.map(i => `• ${i.qty}× ${i.name} (${i.size}) — Ksh ${i.subtotal.toLocaleString()}`).join('\n')}\n\nSubtotal: Ksh ${cartTotal.toLocaleString()}\nDelivery: Ksh ${placedOrder.deliveryFee || 0}\nDeposit Paid: Ksh ${placedOrder.depositAmount || 0}\nTotal: Ksh ${placedOrder.total.toLocaleString()}${placedOrder.customer.dietaryNeeds ? `\n\nDietary Needs: ${placedOrder.customer.dietaryNeeds}` : ''}${placedOrder.customer.notes ? `\nNotes: ${placedOrder.customer.notes}` : ''}\n\nPlease confirm. Thank you!`
    : '';

  const handlePrintReceipt = () => {
    if (!placedOrder) return;
    const subtotal = placedOrder.items.reduce((s, i) => s + i.subtotal, 0);
    const deposit = placedOrder.depositAmount || 0;
    const balanceDue = placedOrder.total - deposit;

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt — ${placedOrder.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #fff; color: #1a1a1a; }
    .page { max-width: 680px; margin: 0 auto; padding: 48px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3d2314; padding-bottom: 28px; margin-bottom: 32px; }
    .logo-block img { height: 100px; }
    .invoice-meta { text-align: right; }
    .invoice-title { font-family: 'Playfair Display', serif; font-size: 36px; color: #3d2314; }
    .order-id { font-size: 15px; color: #c9973a; font-weight: 700; margin-top: 6px; }
    .date { font-size: 13px; color: #777; margin-top: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; font-weight: 700; margin-bottom: 8px; }
    .party-name { font-size: 17px; font-weight: 700; color: #3d2314; margin-bottom: 4px; }
    .party-info { font-size: 13px; color: #555; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #3d2314; color: white; }
    thead th { padding: 11px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f0e8d8; }
    tbody tr:nth-child(even) { background: #fdf8f0; }
    tbody td { padding: 11px 14px; font-size: 13px; color: #333; }
    tbody td:last-child { text-align: right; font-weight: 600; }
    .totals { margin-left: auto; width: 280px; margin-bottom: 32px; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid #f0e8d8; color: #555; }
    .totals-row.grand { background: #3d2314; color: white; padding: 12px 14px; border-radius: 6px; font-size: 16px; font-weight: 700; border-bottom: none; margin-top: 4px; }
    .totals-row.balance { color: #c9973a; font-weight: 700; font-size: 14px; border-bottom: none; margin-top: 4px; }
    .notes-section { background: #fdf8f0; border-left: 4px solid #c9973a; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 32px; font-size: 13px; color: #555; line-height: 1.7; }
    .notes-section strong { color: #3d2314; display: block; margin-bottom: 4px; }
    .footer { text-align: center; padding-top: 28px; border-top: 2px solid #f0e8d8; color: #999; font-size: 12px; line-height: 1.8; }
    .footer .brand { font-family: 'Playfair Display', serif; font-size: 16px; color: #3d2314; font-style: italic; margin-bottom: 4px; }
    .footer .contact { color: #c9973a; font-weight: 600; font-size: 13px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 24px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-block">
      <img src="${window.location.origin}${LOGO_PATH}" alt="Blissful Bakes" onerror="this.style.display='none'" />
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">RECEIPT</div>
      <div class="order-id"># ${placedOrder.id}</div>
      <div class="date">${new Date(placedOrder.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>
  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">Blissful Bakes</div>
      <div class="party-info">Nairobi, Kenya<br>${contact.phone}</div>
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${placedOrder.customer.name}</div>
      <div class="party-info">${placedOrder.customer.phone}<br>${placedOrder.customer.address}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Size</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${placedOrder.items.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td style="text-align:center;color:#777">${item.size}</td>
          <td style="text-align:center">${item.qty}</td>
          <td style="text-align:right">Ksh ${item.price.toLocaleString()}</td>
          <td>Ksh ${item.subtotal.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>Ksh ${subtotal.toLocaleString()}</span></div>
    ${placedOrder.deliveryFee > 0 ? `<div class="totals-row"><span>Delivery Fee</span><span>Ksh ${placedOrder.deliveryFee.toLocaleString()}</span></div>` : ''}
    <div class="totals-row grand"><span>TOTAL</span><span>Ksh ${placedOrder.total.toLocaleString()}</span></div>
    ${deposit > 0 ? `
    <div class="totals-row" style="color:#059669;margin-top:8px"><span>Deposit Paid</span><span>– Ksh ${deposit.toLocaleString()}</span></div>
    <div class="totals-row balance"><span>Balance Due</span><span>Ksh ${balanceDue.toLocaleString()}</span></div>` : ''}
  </div>
  ${(placedOrder.customer.dietaryNeeds || placedOrder.customer.notes) ? `
  <div class="notes-section">
    ${placedOrder.customer.dietaryNeeds ? `<strong>Dietary Needs / Allergies</strong>${placedOrder.customer.dietaryNeeds}<br><br>` : ''}
    ${placedOrder.customer.notes ? `<strong>Special Instructions</strong>${placedOrder.customer.notes}` : ''}
  </div>` : ''}
  <div class="footer">
    <div class="brand">Blissful Bakes</div>
    <div class="contact">${contact.phone}</div>
    <p style="margin-top:8px">Thank you for your order! Made with love in Kenya 🎂</p>
  </div>
</div>
<script>window.onload = () => window.print();<\/script>
</body>
</html>`);
    win.document.close();
  };

  const isFormValid = customerInfo.name && customerInfo.phone && customerInfo.address;

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid var(--border)', fontSize: 14,
    outline: 'none', fontFamily: 'DM Sans, sans-serif',
    background: 'white', color: 'var(--text)',
  };

  return (
    <>
      <Head>
        <title>Blissful Bakes — Order Fresh Cakes & Cupcakes</title>
        <meta name="description" content="Order freshly baked cakes and cupcakes from Blissful Bakes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎂</text></svg>" />
      </Head>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ position: 'relative', maxWidth: 600, width: '100%' }}>
            <img src={lightbox.image} alt={lightbox.name} style={{ width: '100%', borderRadius: 16, maxHeight: '70vh', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 20px 20px', borderRadius: '0 0 16px 16px', color: 'white' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>{lightbox.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{lightbox.description}</div>
            </div>
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -14, right: -14, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>×</button>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        {/* Header */}
        <header style={{ background: 'var(--brown)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <img src={LOGO_PATH} alt="Blissful Bakes" style={{ height: 52 }} onError={e => { e.target.style.display = 'none'; }} />
            {step === 'menu' && (
              <button
                onClick={() => cart.length && setStep('cart')}
                disabled={!cart.length}
                style={{
                  background: cart.length ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
                  color: cart.length ? 'var(--brown)' : 'rgba(255,255,255,0.5)',
                  border: 'none', borderRadius: 24, padding: '10px 20px',
                  fontSize: 14, fontWeight: 700, cursor: cart.length ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.3s',
                }}>
                🛒 Cart
                {cartCount > 0 && (
                  <span style={{ background: 'var(--brown)', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

          {/* ── MENU ── */}
          {step === 'menu' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              {/* Hero */}
              <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
                <div style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--brown)', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                  Freshly Baked Daily
                </div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 52px)', color: 'var(--brown)', lineHeight: 1.2, marginBottom: 12 }}>
                  Blissful Bakes
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
                  Handcrafted cakes & cupcakes made with love in Nairobi
                </p>
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    padding: '8px 20px', borderRadius: 24, border: '1.5px solid',
                    borderColor: activeCategory === cat ? 'var(--brown)' : 'var(--border)',
                    background: activeCategory === cat ? 'var(--brown)' : 'white',
                    color: activeCategory === cat ? 'white' : 'var(--text-muted)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}>{cat}</button>
                ))}
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {filtered.map(item => {
                  const sizeIdx = getSelectedSize(item);
                  const selectedSize = item.sizes[sizeIdx];
                  return (
                    <div key={item.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Image */}
                      <div
                        onClick={() => setLightbox(item)}
                        style={{ height: 200, background: 'linear-gradient(135deg, #f5e6d0, #e8c99a)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                      >
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 11, backdropFilter: 'blur(4px)' }}>
                          {item.category}
                        </div>
                      </div>
                      <div style={{ padding: '16px 16px 18px' }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--brown)', marginBottom: 4 }}>{item.name}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>{item.description}</p>

                        {/* Size selector */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {item.sizes.map((s, idx) => (
                            <button key={idx}
                              onClick={() => setSelectedSizes(prev => ({ ...prev, [item.id]: idx }))}
                              style={{
                                padding: '6px 12px', borderRadius: 8, border: '1.5px solid',
                                borderColor: sizeIdx === idx ? 'var(--brown)' : 'var(--border)',
                                background: sizeIdx === idx ? 'var(--brown)' : 'white',
                                color: sizeIdx === idx ? 'white' : 'var(--text-muted)',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              }}>
                              {s.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                            Ksh {selectedSize.price.toLocaleString()}
                          </span>
                          <button onClick={() => addToCart(item)} style={{
                            background: 'var(--brown)', color: 'white', border: 'none',
                            borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          }}>
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CART ── */}
          {step === 'cart' && (
            <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 600, margin: '0 auto', paddingTop: 40 }}>
              <button onClick={() => setStep('menu')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>← Back to Menu</button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--brown)', marginBottom: 24 }}>Your Cart</h2>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <p>Your cart is empty</p>
                  <button onClick={() => setStep('menu')} style={{ marginTop: 16, background: 'var(--brown)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Browse Menu
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {cart.map(c => (
                      <div key={c.key} style={{ background: 'white', borderRadius: 14, padding: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{c.item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.size.label}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateQty(c.key, -1)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'var(--brown)' }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{c.qty}</span>
                          <button onClick={() => updateQty(c.key, 1)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'var(--brown)' }}>+</button>
                        </div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--gold)', fontSize: 16, minWidth: 90, textAlign: 'right' }}>
                          Ksh {(c.size.price * c.qty).toLocaleString()}
                        </div>
                        <button onClick={() => removeFromCart(c.key)} style={{ background: '#fee2e2', color: '#c0392b', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                      <span>Subtotal ({cartCount} items)</span>
                      <span>Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: 'var(--brown)' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif" }}>Ksh {cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <button onClick={() => setStep('details')} style={{ width: '100%', background: 'var(--brown)', color: 'white', border: 'none', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                    Continue to Details →
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── DETAILS ── */}
          {step === 'details' && (
            <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 560, margin: '0 auto', paddingTop: 40 }}>
              <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
                ← Back to Cart
              </button>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--brown)', marginBottom: 6 }}>Your Details</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>Fields marked * are required</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Your full name', type: 'text', required: true },
                  { key: 'phone', label: 'Phone Number', placeholder: '+254...', type: 'tel', required: true },
                  { key: 'address', label: 'Delivery Address', placeholder: 'Street, Estate, Town', type: 'text', required: true },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                      {field.label} {field.required && <span style={{ color: 'var(--gold)' }}>*</span>}
                    </label>
                    <input type={field.type} placeholder={field.placeholder} value={customerInfo[field.key]}
                      onChange={e => setCustomerInfo(i => ({ ...i, [field.key]: e.target.value }))}
                      style={inputStyle} />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                    Dietary Needs / Allergies <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(optional)</span>
                  </label>
                  <textarea placeholder="e.g. nut-free, gluten-free, vegan, diabetic-friendly..." value={customerInfo.dietaryNeeds}
                    onChange={e => setCustomerInfo(i => ({ ...i, dietaryNeeds: e.target.value }))}
                    rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                    Special Instructions <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(optional)</span>
                  </label>
                  <textarea placeholder="Custom cake message, preferred delivery time, preferred colours..." value={customerInfo.notes}
                    onChange={e => setCustomerInfo(i => ({ ...i, notes: e.target.value }))}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>Delivery Fee (Ksh)</label>
                    <input type="number" min="0" value={deliveryFee}
                      onChange={e => setDeliveryFee(e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>Deposit Paid (Ksh)</label>
                    <input type="number" min="0" value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '18px 20px', marginTop: 28, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 12 }}>Order Summary</div>
                {cart.map(c => (
                  <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                    <span>{c.qty}× {c.item.name} ({c.size.label})</span>
                    <span>Ksh {(c.size.price * c.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Subtotal</span><span>Ksh {cartTotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Delivery Fee</span><span>Ksh {deliveryNum.toLocaleString()}</span>
                  </div>
                  {depositNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#059669', marginBottom: 4 }}>
                      <span>Deposit Paid</span><span>Ksh {depositNum.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 8, color: 'var(--brown)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif" }}>Ksh {total.toLocaleString()}</span>
                  </div>
                  {depositNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#c9973a', marginTop: 4 }}>
                      <span>Balance Due</span><span>Ksh {(total - depositNum).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || !isFormValid}
                style={{
                  width: '100%', background: isFormValid ? 'var(--brown)' : '#ccc',
                  color: 'white', border: 'none', borderRadius: 12, padding: 16,
                  fontSize: 16, fontWeight: 700, cursor: isFormValid ? 'pointer' : 'not-allowed',
                }}>
                {loading ? '⏳ Placing Order...' : '🎂 Place Order'}
              </button>
            </div>
          )}

          {/* ── CONFIRMATION ── */}
          {step === 'confirm' && placedOrder && (
            <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: 560, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--brown)', marginBottom: 8 }}>Order Placed!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 20 }}>We'll confirm your order soon via WhatsApp.</p>
              <div style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--brown)', borderRadius: 30, padding: '8px 24px', fontWeight: 800, fontSize: 16, marginBottom: 32 }}>
                Order ID: {placedOrder.id}
              </div>

              {/* Invoice summary card */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '24px', textAlign: 'left', marginBottom: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <img src={LOGO_PATH} alt="Blissful Bakes" style={{ height: 80 }} onError={e => e.target.style.display = 'none'} />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 12, fontFamily: "'Playfair Display', serif", fontSize: 18, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  Receipt — {placedOrder.id}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {new Date(placedOrder.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {placedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span>{item.qty}× {item.name} ({item.size})</span>
                    <span>Ksh {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                  {placedOrder.deliveryFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>Delivery</span><span>Ksh {placedOrder.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--brown)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif" }}>Ksh {placedOrder.total.toLocaleString()}</span>
                  </div>
                  {placedOrder.depositAmount > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#059669', marginTop: 6 }}>
                        <span>Deposit Paid</span><span>Ksh {placedOrder.depositAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#c9973a', fontWeight: 700 }}>
                        <span>Balance Due</span><span>Ksh {(placedOrder.total - placedOrder.depositAmount).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
                {(placedOrder.customer.dietaryNeeds || placedOrder.customer.notes) && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#fdf8f0', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {placedOrder.customer.dietaryNeeds && <div>🥗 <strong>Dietary:</strong> {placedOrder.customer.dietaryNeeds}</div>}
                    {placedOrder.customer.notes && <div>📝 <strong>Notes:</strong> {placedOrder.customer.notes}</div>}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <a
                  href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#25D366', color: 'white', borderRadius: 12, padding: '13px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  💬 WhatsApp Us
                </a>
                <button onClick={handlePrintReceipt} style={{ background: 'var(--brown)', color: 'white', border: 'none', borderRadius: 12, padding: '13px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🖨️ Print Receipt
                </button>
                <a href={`tel:${contact.phone}`} style={{ background: 'white', color: 'var(--brown)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '13px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  📞 Call Us
                </a>
              </div>

              <button onClick={() => {
                setStep('menu');
                setCustomerInfo({ name: '', phone: '', address: '', notes: '', dietaryNeeds: '' });
                setPlacedOrder(null);
                setDeliveryFee('');
                setDepositAmount('');
              }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: '8px 16px' }}>
                ← Place Another Order
              </button>
            </div>
          )}
        </main>

        <footer style={{ background: 'var(--brown)', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px 24px', fontSize: 13 }}>
          © {new Date().getFullYear()} Blissful Bakes · Made with ❤️ in Nairobi · {contact.phone}
        </footer>
      </div>
    </>
  );
}
