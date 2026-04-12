import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', bg: '#dbeafe', icon: '✅' },
  baking:    { label: 'Baking',    color: '#8b5cf6', bg: '#ede9fe', icon: '🔥' },
  ready:     { label: 'Ready',     color: '#10b981', bg: '#d1fae5', icon: '📦' },
  delivered: { label: 'Delivered', color: '#059669', bg: '#a7f3d0', icon: '🚀' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
};

const NEXT_STATUSES = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['baking', 'cancelled'],
  baking:    ['ready', 'cancelled'],
  ready:     ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async (t) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', { headers: { 'x-admin-token': t } });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setOrders(data.orders);
      setAuthed(true);
    } catch {
      setError('Invalid admin token. Please try again.');
      setAuthed(false);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setToken(tokenInput);
    fetchOrders(tokenInput);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      fetchOrders(token);
    } catch {
      alert('Failed to update status');
    }
    setUpdating(null);
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (!authed) {
    return (
      <>
        <Head><title>Admin — Blissful Bakes</title></Head>
        <div style={{ minHeight: '100vh', background: 'var(--brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--brown)', marginBottom: 6 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>Blissful Bakes Order Management</p>

            {error && (
              <div style={{ background: '#fee2e2', color: '#c0392b', borderRadius: 10, padding: '10px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>
            )}

            <input
              type="password"
              placeholder="Enter admin token"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '2px solid var(--border)', fontSize: 15, outline: 'none', marginBottom: 14 }}
              onFocus={e => e.target.style.borderColor = 'var(--brown)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={handleLogin} disabled={loading || !tokenInput} style={{
              width: '100%', background: 'var(--brown)', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              {loading ? 'Logging in...' : 'Login →'}
            </button>
            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
              Set your <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>ADMIN_TOKEN</code> env variable in Vercel
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Admin — Blissful Bakes</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8f4ef' }}>
        {/* Admin Header */}
        <header style={{ background: 'var(--brown)', color: 'white', padding: '0 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div>
              <span style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold-light)', fontSize: 18, fontStyle: 'italic' }}>Blissful Bakes</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontSize: 13 }}>· Admin Panel</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={() => fetchOrders(token)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                🔄 Refresh
              </button>
              <a href="/" style={{ background: 'var(--gold)', color: 'var(--brown)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
                View Store
              </a>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { key: 'all', label: 'All Orders', count: orders.length, icon: '📋' },
              ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label, count: counts[key] || 0, icon: cfg.icon, color: cfg.color, bg: cfg.bg })),
            ].map(stat => (
              <button key={stat.key} onClick={() => setFilter(stat.key)} style={{
                background: filter === stat.key ? 'var(--brown)' : 'white',
                color: filter === stat.key ? 'white' : 'var(--text)',
                border: '1.5px solid',
                borderColor: filter === stat.key ? 'var(--brown)' : 'var(--border)',
                borderRadius: 12,
                padding: '14px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{stat.count}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{stat.label}</div>
              </button>
            ))}
          </div>

          {/* Orders */}
          {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading orders...</div>}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p>No orders {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status];
              const isExpanded = expanded === order.id;
              return (
                <div key={order.id} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  {/* Order Header */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flexWrap: 'wrap' }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--brown)', fontSize: 16, minWidth: 100 }}>{order.id}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{order.customer.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{order.customer.phone} · {formatDate(order.createdAt)}</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--gold)', fontSize: 16 }}>
                      Ksh {order.total.toLocaleString()}
                    </div>
                    <div style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: '#fdfaf7' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Customer</div>
                          <div style={{ fontSize: 14, color: 'var(--text)' }}>
                            <div>{order.customer.name}</div>
                            <div>{order.customer.phone}</div>
                            <div>{order.customer.address}</div>
                            {order.customer.notes && <div style={{ fontStyle: 'italic', marginTop: 4 }}>📝 {order.customer.notes}</div>}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>Items Ordered</div>
                          {order.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '2px 0', color: 'var(--text)' }}>
                              <span>{item.qty}× {item.name} ({item.size})</span>
                              <span style={{ color: 'var(--text-muted)' }}>Ksh {item.subtotal.toLocaleString()}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--gold)' }}>Ksh {order.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Actions */}
                      {NEXT_STATUSES[order.status]?.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Update Status:</span>
                          {NEXT_STATUSES[order.status].map(nextStatus => {
                            const ncfg = STATUS_CONFIG[nextStatus];
                            const isDanger = nextStatus === 'cancelled';
                            return (
                              <button
                                key={nextStatus}
                                onClick={() => handleStatusUpdate(order.id, nextStatus)}
                                disabled={updating === order.id}
                                style={{
                                  background: isDanger ? '#fee2e2' : ncfg.bg,
                                  color: isDanger ? '#c0392b' : ncfg.color,
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '7px 16px',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {updating === order.id ? '...' : `${ncfg.icon} Mark ${ncfg.label}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
