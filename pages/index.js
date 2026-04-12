import { useState } from 'react';
import { menuItems, contact } from '../lib/menu';
import Head from 'next/head';

export default function Home() {
  const [step, setStep] = useState('menu');
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', notes: '' });
  const [placedOrder, setPlacedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [lightbox, setLightbox] = useState(null); // item or null

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

  const total = cart.reduce((sum, c) => sum + c.size.price * c.qty, 0);
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
    ? `Hello Blissful Bakes! 🎂 I just placed Order ${placedOrder.id}.\n\nName: ${placedOrder.customer.name}\nItems:\n${placedOrder.items.map(i => `• ${i.qty}x ${i.name} (${i.size}) - Ksh ${i.subtotal.toLocaleString()}`).join('\n')}\nTotal: Ksh ${placedOrder.total.toLocaleString()}\n\nPlease confirm my order. Thank you!`
    : '';

  const isFormValid = customerInfo.name && customerInfo.phone && customerInfo.address;

  return (
    <>
      <Head>
        <title>Blissful Bakes — Freshly Baked Edition</title>
        <meta name="description" content="Order freshly baked cakes and cupcakes from Blissful Bakes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎂</text></svg>" />
      </Head>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(20,10,5,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 700, width: '100%', cursor: 'default' }}>
            <img
              src={lightbox.image}
              alt={lightbox.name}
              style={{
                width: '100%',
                borderRadius: 16,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                display: 'block',
                maxHeight: '75vh',
                objectFit: 'cover',
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'white', marginBottom: 4 }}>{lightbox.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 16 }}>{lightbox.description}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {lightbox.sizes.map((s, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--gold-light)', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600 }}>
                    {s.label} — Ksh {s.price.toLocaleString()}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setLightbox(null)}
                style={{ marginTop: 20, background: 'none', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, padding: '8px 22px', fontSize: 14, cursor: 'pointer' }}
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        {/* Header */}
        <header style={{
          background: 'var(--brown)', color: 'white', padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontStyle: 'italic', color: 'var(--gold-light)' }}>Blissful Bakes</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase' }}>Freshly Baked Edition</div>
            </div>
            {step === 'menu' && (
              <button
                onClick={() => cart.length && setStep('cart')}
                style={{
                  background: cart.length ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                  color: 'white', border: 'none', borderRadius: 30,
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: cart.length ? 'pointer' : 'default',
                }}
              >
                🛒 Cart
                {cartCount > 0 && (
                  <span style={{ background: 'var(--brown)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
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
              <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
                <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', color: 'var(--brown)', lineHeight: 1.2 }}>
                  Freshly Baked,<br />
                  <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Made with Love</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 10, fontSize: 15 }}>
                  Click any photo to enlarge · Pick your size · Add to order
                </p>
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    padding: '8px 22px', borderRadius: 30, border: '2px solid',
                    borderColor: activeCategory === cat ? 'var(--brown)' : 'var(--border)',
                    background: activeCategory === cat ? 'var(--brown)' : 'white',
                    color: activeCategory === cat ? 'white' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 22 }}>
                {filtered.map(item => {
                  const sizeIdx = getSelectedSize(item);
                  const inCart = cart.filter(c => c.item.id === item.id).reduce((s, c) => s + c.qty, 0);
                  return (
                    <div key={item.id} style={{
                      background: 'white', borderRadius: 18, overflow: 'hidden',
                      boxShadow: '0 2px 14px rgba(61,35,20,0.09)',
                      border: '1px solid var(--border)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(61,35,20,0.16)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 14px rgba(61,35,20,0.09)'; }}
                    >
                      {/* Photo — clickable */}
                      <div style={{ position: 'relative', overflow: 'hidden', height: 210, cursor: 'zoom-in' }} onClick={() => setLightbox(item)}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        {/* Zoom hint */}
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(0,0,0,0.45)', color: 'white',
                          borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                        }}>
                          🔍 Tap to zoom
                        </div>
                        {inCart > 0 && (
                          <div style={{
                            position: 'absolute', top: 10, left: 10,
                            background: 'var(--gold)', color: 'var(--brown)',
                            borderRadius: '50%', width: 26, height: 26, fontSize: 12,
                            fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {inCart}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '14px 16px 16px' }}>
                        <h3 style={{ fontSize: 17, color: 'var(--brown)', marginBottom: 3 }}>{item.name}</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{item.description}</p>

                        {/* Size Selector */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                          {item.sizes.map((size, idx) => (
                            <button key={idx} onClick={() => setSelectedSizes(s => ({ ...s, [item.id]: idx }))} style={{
                              padding: '5px 10px', borderRadius: 8, border: '1.5px solid',
                              borderColor: sizeIdx === idx ? 'var(--brown)' : 'var(--border)',
                              background: sizeIdx === idx ? 'var(--brown)' : 'transparent',
                              color: sizeIdx === idx ? 'white' : 'var(--text-muted)',
                              fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                              {size.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--gold)', fontWeight: 700 }}>
                            Ksh {item.sizes[sizeIdx].price.toLocaleString()}
                          </div>
                          <button
                            onClick={() => addToCart(item)}
                            style={{
                              background: 'var(--brown)', color: 'white', border: 'none',
                              borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--brown-mid)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--brown)'}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticky cart bar */}
              {cartCount > 0 && (
                <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 200, animation: 'slideUp 0.3s ease' }}>
                  <button onClick={() => setStep('cart')} style={{
                    background: 'var(--brown)', color: 'white', border: 'none', borderRadius: 50,
                    padding: '16px 32px', fontSize: 16, fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(61,35,20,0.45)',
                    display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', cursor: 'pointer',
                  }}>
                    <span>🛒 View Order ({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
                    <span style={{ background: 'var(--gold)', borderRadius: 30, padding: '3px 12px', fontSize: 14, color: 'var(--brown)', fontWeight: 800 }}>
                      Ksh {total.toLocaleString()}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── CART ── */}
          {step === 'cart' && (
            <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 620, margin: '0 auto', paddingTop: 40 }}>
              <button onClick={() => setStep('menu')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← Back to Menu
              </button>
              <h2 style={{ fontSize: 28, color: 'var(--brown)', marginBottom: 6 }}>Your Order</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Review before proceeding</p>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <p>Your cart is empty</p>
                  <button onClick={() => setStep('menu')} style={{ marginTop: 16, background: 'var(--brown)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>Browse Menu</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {cart.map(c => (
                      <div key={c.key} style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={c.item.image} alt={c.item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--brown)', fontSize: 15 }}>{c.item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.size.label}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateQty(c.key, -1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{c.qty}</span>
                          <button onClick={() => updateQty(c.key, 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', minWidth: 80, textAlign: 'right', fontFamily: "'Playfair Display', serif", fontSize: 16 }}>
                          Ksh {(c.size.price * c.qty).toLocaleString()}
                        </div>
                        <button onClick={() => removeFromCart(c.key)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'var(--brown)', color: 'white', borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>Total Amount</span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--gold-light)' }}>Ksh {total.toLocaleString()}</span>
                  </div>

                  <button onClick={() => setStep('details')} style={{ width: '100%', background: 'var(--gold)', color: 'var(--brown)', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                    Proceed to Checkout →
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── DETAILS ── */}
          {step === 'details' && (
            <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 560, margin: '0 auto', paddingTop: 40 }}>
              <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← Back to Cart
              </button>
              <h2 style={{ fontSize: 28, color: 'var(--brown)', marginBottom: 6 }}>Your Details</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>So we know where to deliver 🎂</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'Your name', type: 'text' },
                  { key: 'phone', label: 'Phone Number', placeholder: '+254...', type: 'tel' },
                  { key: 'address', label: 'Delivery Address', placeholder: 'Street, Estate, Town', type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                      {field.label} <span style={{ color: 'var(--gold)' }}>*</span>
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={customerInfo[field.key]}
                      onChange={e => setCustomerInfo(i => ({ ...i, [field.key]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', fontSize: 15, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--brown)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                    Special Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder="Custom cake message, allergies, preferred delivery time..."
                    value={customerInfo.notes}
                    onChange={e => setCustomerInfo(i => ({ ...i, notes: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', fontSize: 15, outline: 'none', resize: 'vertical' }}
                    onFocus={e => e.target.style.borderColor = 'var(--brown)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: 16, marginTop: 24, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 10, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Order Summary</div>
                {cart.map(c => (
                  <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)', padding: '3px 0' }}>
                    <span>{c.qty}× {c.item.name} ({c.size.label})</span>
                    <span>Ksh {(c.size.price * c.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--brown)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Ksh {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || !isFormValid}
                style={{
                  width: '100%',
                  background: !isFormValid ? 'var(--border)' : 'var(--brown)',
                  color: !isFormValid ? 'var(--text-muted)' : 'white',
                  border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700,
                  cursor: !isFormValid ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                }}
              >
                {loading ? '⏳ Placing Order...' : '🎂 Place Order'}
              </button>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {step === 'confirm' && placedOrder && (
            <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: 560, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 72, marginBottom: 16, animation: 'pulse 1s ease 0.5s 2' }}>🎉</div>
              <h2 style={{ fontSize: 32, color: 'var(--brown)', marginBottom: 8 }}>Order Placed!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 8 }}>Thank you, {placedOrder.customer.name}!</p>
              <div style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--brown)', borderRadius: 30, padding: '6px 20px', fontWeight: 700, fontSize: 15, marginBottom: 32 }}>
                Order ID: {placedOrder.id}
              </div>

              <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 24px', textAlign: 'left', marginBottom: 28 }}>
                <div style={{ fontWeight: 700, color: 'var(--brown)', marginBottom: 12, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Your Order</div>
                {placedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 14, padding: '4px 0', borderBottom: i < placedOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span>{item.qty}× {item.name} ({item.size})</span>
                    <span>Ksh {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--brown)', paddingTop: 12, marginTop: 4 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Ksh {placedOrder.total.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  <div>📍 {placedOrder.customer.address}</div>
                  <div>📞 {placedOrder.customer.phone}</div>
                  {placedOrder.customer.notes && <div>📝 {placedOrder.customer.notes}</div>}
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, var(--brown), var(--brown-mid))', borderRadius: 16, padding: 24, color: 'white', marginBottom: 20 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 6, color: 'var(--gold-light)' }}>Contact Us to Confirm</div>
                <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 20 }}>
                  Reach out on WhatsApp or call to confirm your order, arrange payment &amp; delivery.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ background: '#25D366', color: 'white', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                  >
                    💬 WhatsApp Us
                  </a>
                  <a
                    href={`tel:${contact.phone}`}
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    📞 {contact.phone}
                  </a>
                </div>
              </div>

              <button
                onClick={() => { setStep('menu'); setCustomerInfo({ name: '', phone: '', address: '', notes: '' }); setPlacedOrder(null); }}
                style={{ background: 'none', border: '2px solid var(--brown)', color: 'var(--brown)', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Place Another Order
              </button>
            </div>
          )}
        </main>

        <footer style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13, borderTop: '1px solid var(--border)' }}>
          © {new Date().getFullYear()} Blissful Bakes · Made with ❤️ · {contact.phone}
        </footer>
      </div>
    </>
  );
}
