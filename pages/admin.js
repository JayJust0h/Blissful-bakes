// pages/admin.js — Enhanced Blissful Bakes Admin Panel
// Features: Revenue Reports (daily/weekly/monthly), Receipt generation with logo,
// Customizable invoice with delivery, full order management
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

// ─── Inline logo as data URL (replace with actual base64 in production) ───────
// In your Next.js project, place logo at /public/images/logo.png and use that path.
// For the receipt/invoice, we reference /images/logo.png which resolves at runtime.
const LOGO_PATH = '/images/logo.png';
const CONTACT = { phone: '+254714391314', whatsapp: '254714391314' };

// ─── Revenue helpers ──────────────────────────────────────────────────────────
function startOf(unit) {
  const now = new Date();
  if (unit === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (unit === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (unit === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(0);
}

function revenueStats(orders, unit) {
  const since = startOf(unit);
  const inPeriod = orders.filter(o =>
    o.status !== 'cancelled' && new Date(o.createdAt) >= since
  );
  const revenue = inPeriod.reduce((s, o) => s + (o.total || 0), 0);
  const count = inPeriod.length;
  const avgOrder = count ? Math.round(revenue / count) : 0;

  // Build chart buckets
  let buckets = [];
  const now = new Date();
  if (unit === 'day') {
    for (let h = 0; h < 24; h += 3) {
      const label = `${String(h).padStart(2, '0')}:00`;
      const bucket = inPeriod.filter(o => {
        const oh = new Date(o.createdAt).getHours();
        return oh >= h && oh < h + 3;
      });
      buckets.push({ label, value: bucket.reduce((s, o) => s + o.total, 0) });
    }
  } else if (unit === 'week') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 0; d < 7; d++) {
      const day = new Date(since);
      day.setDate(day.getDate() + d);
      const label = days[day.getDay()];
      const bucket = inPeriod.filter(o => {
        const od = new Date(o.createdAt);
        return od >= day && od < new Date(day.getTime() + 86400000);
      });
      buckets.push({ label, value: bucket.reduce((s, o) => s + o.total, 0) });
    }
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += 3) {
      const label = `${d}`;
      const start = new Date(now.getFullYear(), now.getMonth(), d);
      const end = new Date(now.getFullYear(), now.getMonth(), d + 3);
      const bucket = inPeriod.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) < end);
      buckets.push({ label, value: bucket.reduce((s, o) => s + o.total, 0) });
    }
  }

  // Top items
  const itemMap = {};
  inPeriod.forEach(o => {
    o.items?.forEach(item => {
      const key = `${item.name} (${item.size})`;
      itemMap[key] = (itemMap[key] || 0) + item.qty;
    });
  });
  const topItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return { revenue, count, avgOrder, buckets, topItems };
}

// ─── Print Receipt ────────────────────────────────────────────────────────────
function printReceipt(order, invoiceSettings = {}) {
  const {
    showLogo = true,
    showDeliveryFee = true,
    showDeposit = true,
    showDietaryNeeds = true,
    footerNote = 'Thank you for choosing Blissful Bakes! Made with love in Kenya 🎂',
    primaryColor = '#3d2314',
    accentColor = '#c9973a',
  } = invoiceSettings;

  const subtotal = order.items.reduce((s, i) => s + i.subtotal, 0);
  const deliveryFee = order.deliveryFee || 0;
  const deposit = order.depositAmount || 0;
  const balanceDue = order.total - deposit;

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice — ${order.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', Arial, sans-serif;
      background: #fff;
      color: #1a1a1a;
      padding: 0;
    }
    .page {
      max-width: 680px;
      margin: 0 auto;
      padding: 48px 48px 60px;
    }
    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 28px;
      margin-bottom: 32px;
    }
    .logo-block img { height: 100px; }
    .logo-block .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: ${primaryColor};
      font-style: italic;
      margin-top: 6px;
    }
    .invoice-meta { text-align: right; }
    .invoice-meta .invoice-title {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: ${primaryColor};
      letter-spacing: -1px;
      line-height: 1;
    }
    .invoice-meta .order-id {
      font-size: 15px;
      color: ${accentColor};
      font-weight: 700;
      margin-top: 6px;
    }
    .invoice-meta .date {
      font-size: 13px;
      color: #777;
      margin-top: 4px;
    }
    /* Parties */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
    }
    .party-block .party-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #999;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .party-block .party-name {
      font-size: 17px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 4px;
    }
    .party-block .party-info {
      font-size: 13px;
      color: #555;
      line-height: 1.7;
    }
    /* Items table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead tr {
      background: ${primaryColor};
      color: white;
    }
    thead th {
      padding: 11px 14px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      text-align: left;
    }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f0e8d8; }
    tbody tr:nth-child(even) { background: #fdf8f0; }
    tbody td {
      padding: 11px 14px;
      font-size: 13px;
      color: #333;
    }
    tbody td:last-child { text-align: right; font-weight: 600; }
    /* Totals */
    .totals {
      margin-left: auto;
      width: 280px;
      margin-bottom: 32px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      font-size: 13px;
      border-bottom: 1px solid #f0e8d8;
      color: #555;
    }
    .totals-row.grand {
      background: ${primaryColor};
      color: white;
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 700;
      border-bottom: none;
      margin-top: 4px;
    }
    .totals-row.balance {
      color: ${accentColor};
      font-weight: 700;
      font-size: 14px;
      border-bottom: none;
    }
    /* Notes */
    .notes-section {
      background: #fdf8f0;
      border-left: 4px solid ${accentColor};
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 32px;
      font-size: 13px;
      color: #555;
      line-height: 1.7;
    }
    .notes-section strong { color: ${primaryColor}; display: block; margin-bottom: 4px; }
    /* Status badge */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #d1fae5;
      color: #059669;
      margin-top: 8px;
    }
    /* Footer */
    .footer {
      text-align: center;
      padding-top: 28px;
      border-top: 2px solid #f0e8d8;
      color: #999;
      font-size: 12px;
      line-height: 1.8;
    }
    .footer .brand {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      color: ${primaryColor};
      font-style: italic;
      margin-bottom: 4px;
    }
    .footer .contact {
      color: ${accentColor};
      font-weight: 600;
      font-size: 13px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-block">
      ${showLogo ? `<img src="${window.location.origin}${LOGO_PATH}" alt="Blissful Bakes" onerror="this.style.display='none'" />` : ''}
      ${!showLogo ? `<div class="brand-name">Blissful Bakes</div>` : ''}
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div class="order-id"># ${order.id}</div>
      <div class="date">${new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="status-badge">Status: ${order.status?.toUpperCase() || 'PENDING'}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-block">
      <div class="party-label">From</div>
      <div class="party-name">Blissful Bakes</div>
      <div class="party-info">
        Nairobi, Kenya<br>
        ${CONTACT.phone}<br>
        wa.me/${CONTACT.whatsapp}
      </div>
    </div>
    <div class="party-block">
      <div class="party-label">Bill To</div>
      <div class="party-name">${order.customer?.name || ''}</div>
      <div class="party-info">
        ${order.customer?.phone || ''}<br>
        ${order.customer?.address || ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Size / Variant</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${order.items?.map(item => `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td style="text-align:center;color:#777">${item.size}</td>
          <td style="text-align:center">${item.qty}</td>
          <td style="text-align:right">Ksh ${item.price?.toLocaleString()}</td>
          <td>Ksh ${item.subtotal?.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>Ksh ${subtotal.toLocaleString()}</span>
    </div>
    ${showDeliveryFee ? `<div class="totals-row">
      <span>Delivery Fee</span>
      <span>Ksh ${deliveryFee.toLocaleString()}</span>
    </div>` : ''}
    <div class="totals-row grand">
      <span>TOTAL</span>
      <span>Ksh ${order.total?.toLocaleString()}</span>
    </div>
    ${showDeposit && deposit > 0 ? `
    <div class="totals-row" style="margin-top:8px;color:#059669">
      <span>Deposit Paid</span>
      <span>– Ksh ${deposit.toLocaleString()}</span>
    </div>
    <div class="totals-row balance">
      <span>Balance Due</span>
      <span>Ksh ${balanceDue.toLocaleString()}</span>
    </div>` : ''}
  </div>

  ${(order.customer?.notes || (showDietaryNeeds && order.customer?.dietaryNeeds)) ? `
  <div class="notes-section">
    ${showDietaryNeeds && order.customer?.dietaryNeeds ? `<strong>Dietary Needs / Allergies</strong>${order.customer.dietaryNeeds}<br><br>` : ''}
    ${order.customer?.notes ? `<strong>Special Instructions</strong>${order.customer.notes}` : ''}
  </div>` : ''}

  <div class="footer">
    <div class="brand">Blissful Bakes</div>
    <div class="contact">${CONTACT.phone}</div>
    <p style="margin-top:8px">${footerNote}</p>
  </div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
  win.document.close();
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ buckets, color }) {
  const max = Math.max(...buckets.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, padding: '0 4px' }}>
      {buckets.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: '100%',
              height: `${Math.max((b.value / max) * 84, b.value > 0 ? 4 : 0)}px`,
              background: b.value > 0
                ? `linear-gradient(180deg, ${color}ee, ${color}88)`
                : 'rgba(0,0,0,0.06)',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.6s ease',
              minHeight: 2,
              position: 'relative',
            }}
            title={`Ksh ${b.value.toLocaleString()}`}
          />
          <span style={{ fontSize: 9, color: '#999', whiteSpace: 'nowrap' }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Revenue Dashboard ────────────────────────────────────────────────────────
function RevenueDashboard({ orders }) {
  const [period, setPeriod] = useState('week');
  const stats = revenueStats(orders, period);

  const tabs = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#3d2314' }}>Revenue Reports</h2>
        <div style={{ display: 'flex', gap: 6, background: 'white', padding: 4, borderRadius: 10, border: '1px solid #e8d5c0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setPeriod(t.key)} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: period === t.key ? '#3d2314' : 'transparent',
              color: period === t.key ? 'white' : '#8a6a55',
              transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Revenue', value: `Ksh ${stats.revenue.toLocaleString()}`, icon: '💰', accent: '#c9973a' },
          { label: 'Orders', value: stats.count, icon: '📋', accent: '#3b82f6' },
          { label: 'Avg. Order Value', value: `Ksh ${stats.avgOrder.toLocaleString()}`, icon: '📊', accent: '#8b5cf6' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'white', borderRadius: 14, padding: '18px 20px',
            border: '1px solid #e8d5c0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: kpi.accent }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: '#8a6a55', marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Top Items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        <div style={{ background: 'white', borderRadius: 14, padding: '20px 20px 12px', border: '1px solid #e8d5c0' }}>
          <div style={{ fontSize: 12, color: '#8a6a55', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Revenue Breakdown
          </div>
          <BarChart buckets={stats.buckets} color="#c9973a" />
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #e8d5c0' }}>
          <div style={{ fontSize: 12, color: '#8a6a55', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Top Items
          </div>
          {stats.topItems.length === 0 ? (
            <div style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No orders yet</div>
          ) : (
            stats.topItems.map(([name, qty], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < stats.topItems.length - 1 ? '1px solid #f5ece0' : 'none' }}>
                <div style={{ fontSize: 13, color: '#3d2314', flex: 1, marginRight: 8 }}>{name}</div>
                <div style={{ background: '#fef3c7', color: '#c9973a', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>×{qty}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Settings Modal ───────────────────────────────────────────────────
function InvoiceSettingsModal({ settings, onChange, onClose }) {
  const [local, setLocal] = useState(settings);
  const update = (key, val) => setLocal(s => ({ ...s, [key]: val }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#3d2314' }}>Invoice Settings</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { key: 'showLogo', label: 'Show company logo' },
            { key: 'showDeliveryFee', label: 'Show delivery fee line' },
            { key: 'showDeposit', label: 'Show deposit & balance due' },
            { key: 'showDietaryNeeds', label: 'Show dietary needs / allergies' },
          ].map(opt => (
            <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14 }}>
              <div
                onClick={() => update(opt.key, !local[opt.key])}
                style={{
                  width: 44, height: 24, borderRadius: 12, position: 'relative',
                  background: local[opt.key] ? '#3d2314' : '#ddd',
                  transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                }}>
                <div style={{
                  position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                  background: 'white', top: 3, left: local[opt.key] ? 23 : 3,
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ color: '#3d2314' }}>{opt.label}</span>
            </label>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a6a55', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Footer Note
            </label>
            <textarea
              value={local.footerNote}
              onChange={e => update('footerNote', e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e8d5c0', fontSize: 13, resize: 'vertical', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ key: 'primaryColor', label: 'Primary Color' }, { key: 'accentColor', label: 'Accent Color' }].map(c => (
              <div key={c.key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a6a55', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{c.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={local[c.key]} onChange={e => update(c.key, e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                  <span style={{ fontSize: 13, color: '#555' }}>{local[c.key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e8d5c0', background: 'white', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { onChange(local); onClose(); }} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#3d2314', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'revenue'
  const [showInvoiceSettings, setShowInvoiceSettings] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({
    showLogo: true,
    showDeliveryFee: true,
    showDeposit: true,
    showDietaryNeeds: true,
    footerNote: 'Thank you for choosing Blissful Bakes! Made with love in Kenya 🎂',
    primaryColor: '#3d2314',
    accentColor: '#c9973a',
  });

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

  const handleLogin = () => { setToken(tokenInput); fetchOrders(tokenInput); };

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
    } catch { alert('Failed to update status'); }
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

  // ── Login screen ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <>
        <Head>
          <title>Admin — Blissful Bakes</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
        </Head>
        <div style={{ minHeight: '100vh', background: 'var(--brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
            <img src={LOGO_PATH} alt="Blissful Bakes" style={{ height: 100, marginBottom: 16 }} onError={e => e.target.style.display = 'none'} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--brown)', marginBottom: 4 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Blissful Bakes Order Management</p>

            {error && <div style={{ background: '#fee2e2', color: '#c0392b', borderRadius: 10, padding: '10px 16px', fontSize: 14, marginBottom: 16 }}>{error}</div>}

            <input
              type="password"
              placeholder="Enter admin token"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '2px solid var(--border)', fontSize: 15, outline: 'none', marginBottom: 14, fontFamily: 'DM Sans, sans-serif' }}
            />
            <button onClick={handleLogin} disabled={loading || !tokenInput} style={{
              width: '100%', background: 'var(--brown)', color: 'white', border: 'none',
              borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              opacity: loading || !tokenInput ? 0.6 : 1,
            }}>
              {loading ? 'Verifying...' : 'Enter Admin Panel →'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Authenticated admin ───────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Admin — Blissful Bakes</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
      </Head>

      {showInvoiceSettings && (
        <InvoiceSettingsModal
          settings={invoiceSettings}
          onChange={setInvoiceSettings}
          onClose={() => setShowInvoiceSettings(false)}
        />
      )}

      <div style={{ minHeight: '100vh', background: '#f8f4ef' }}>
        {/* Header */}
        <header style={{ background: 'var(--brown)', color: 'white', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src={LOGO_PATH} alt="" style={{ height: 46 }} onError={e => e.target.style.display = 'none'} />
              <div>
                <span style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold-light)', fontSize: 17, fontStyle: 'italic' }}>Blissful Bakes</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontSize: 12 }}>· Admin</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowInvoiceSettings(true)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                ⚙️ Invoice Settings
              </button>
              <button onClick={() => fetchOrders(token)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                🔄 Refresh
              </button>
              <a href="/" style={{ background: 'var(--gold)', color: 'var(--brown)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View Store
              </a>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, background: 'white', borderRadius: 12, padding: 4, border: '1px solid #e8d5c0', width: 'fit-content', marginBottom: 28 }}>
            {[{ key: 'orders', label: '📋 Orders' }, { key: 'revenue', label: '📊 Revenue Reports' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '9px 22px', borderRadius: 9, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: activeTab === tab.key ? '#3d2314' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#8a6a55',
                transition: 'all 0.2s',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Revenue Tab */}
          {activeTab === 'revenue' && <RevenueDashboard orders={orders} />}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {/* Status filter pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                  { key: 'all', label: 'All Orders', count: orders.length, icon: '📋' },
                  ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label, count: counts[key] || 0, icon: cfg.icon })),
                ].map(stat => (
                  <button key={stat.key} onClick={() => setFilter(stat.key)} style={{
                    background: filter === stat.key ? '#3d2314' : 'white',
                    color: filter === stat.key ? 'white' : '#3d2314',
                    border: '1.5px solid',
                    borderColor: filter === stat.key ? '#3d2314' : '#e8d5c0',
                    borderRadius: 12, padding: '12px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{stat.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>{stat.count}</div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{stat.label}</div>
                  </button>
                ))}
              </div>

              {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8a6a55' }}>Loading orders...</div>}

              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: '#8a6a55', background: 'white', borderRadius: 16, border: '1px solid #e8d5c0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                  <p>No {filter !== 'all' ? `"${filter}" ` : ''}orders yet</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const isExpanded = expanded === order.id;
                  return (
                    <div key={order.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e8d5c0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      {/* Order row */}
                      <div onClick={() => setExpanded(isExpanded ? null : order.id)}
                        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, color: '#3d2314', fontSize: 15, minWidth: 100 }}>{order.id}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{order.customer?.name}</div>
                          <div style={{ fontSize: 12, color: '#8a6a55' }}>{order.customer?.phone} · {formatDate(order.createdAt)}</div>
                        </div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#c9973a', fontSize: 16 }}>
                          Ksh {order.total?.toLocaleString()}
                        </div>
                        <div style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {cfg.icon} {cfg.label}
                        </div>
                        <div style={{ color: '#bbb', fontSize: 16 }}>{isExpanded ? '▲' : '▼'}</div>
                      </div>

                      {/* Expanded */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #e8d5c0', padding: '20px 20px', background: '#fdfaf7' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 18 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#8a6a55', marginBottom: 8 }}>Customer</div>
                              <div style={{ fontSize: 14, color: '#3d2314', lineHeight: 1.8 }}>
                                <div>{order.customer?.name}</div>
                                <div>{order.customer?.phone}</div>
                                <div>{order.customer?.address}</div>
                                {order.customer?.dietaryNeeds && <div style={{ fontSize: 13, color: '#8a6a55', marginTop: 4 }}>🥗 {order.customer.dietaryNeeds}</div>}
                                {order.customer?.notes && <div style={{ fontStyle: 'italic', fontSize: 13, color: '#8a6a55', marginTop: 4 }}>📝 {order.customer.notes}</div>}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#8a6a55', marginBottom: 8 }}>Items</div>
                              {order.items?.map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: '#3d2314' }}>
                                  <span>{item.qty}× {item.name} ({item.size})</span>
                                  <span style={{ color: '#8a6a55' }}>Ksh {item.subtotal?.toLocaleString()}</span>
                                </div>
                              ))}
                              <div style={{ borderTop: '1px solid #e8d5c0', marginTop: 8, paddingTop: 8 }}>
                                {order.deliveryFee > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8a6a55' }}>
                                    <span>Delivery</span><span>Ksh {order.deliveryFee?.toLocaleString()}</span>
                                  </div>
                                )}
                                {order.depositAmount > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}>
                                    <span>Deposit Paid</span><span>Ksh {order.depositAmount?.toLocaleString()}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4, color: '#3d2314' }}>
                                  <span>Total</span>
                                  <span style={{ color: '#c9973a' }}>Ksh {order.total?.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #e8d5c0' }}>
                            <button
                              onClick={() => printReceipt(order, invoiceSettings)}
                              style={{ background: '#fef3c7', color: '#c9973a', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              🖨️ Print Invoice
                            </button>

                            {NEXT_STATUSES[order.status]?.length > 0 && (
                              <>
                                <span style={{ fontSize: 13, color: '#8a6a55', marginLeft: 4 }}>Update Status:</span>
                                {NEXT_STATUSES[order.status].map(ns => {
                                  const ncfg = STATUS_CONFIG[ns];
                                  const isDanger = ns === 'cancelled';
                                  return (
                                    <button key={ns}
                                      onClick={() => handleStatusUpdate(order.id, ns)}
                                      disabled={updating === order.id}
                                      style={{
                                        background: isDanger ? '#fee2e2' : ncfg.bg,
                                        color: isDanger ? '#c0392b' : ncfg.color,
                                        border: 'none', borderRadius: 8, padding: '8px 16px',
                                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                      }}>
                                      {updating === order.id ? '...' : `${ncfg.icon} Mark ${ncfg.label}`}
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
