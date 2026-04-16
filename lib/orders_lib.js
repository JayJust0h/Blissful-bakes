// lib/orders.js
// In-memory store. Replace with Vercel KV / Supabase for persistence across deploys.

let orders = [];
let nextId = 1000;

export function getAllOrders() {
  return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getOrderById(id) {
  return orders.find(o => o.id === id);
}

export function createOrder(orderData) {
  const order = {
    id: `BB-${nextId++}`,
    ...orderData,
    deliveryFee:   orderData.deliveryFee   ?? 0,
    depositAmount: orderData.depositAmount ?? 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

export function updateOrderStatus(id, status) {
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status    = status;
    order.updatedAt = new Date().toISOString();
  }
  return order;
}

// Admin-only: edit items, deliveryFee, depositAmount, total
export function updateOrderFields(id, fields) {
  const order = orders.find(o => o.id === id);
  if (!order) return null;

  if (fields.items         !== undefined) order.items         = fields.items;
  if (fields.total         !== undefined) order.total         = fields.total;
  if (fields.deliveryFee   !== undefined) order.deliveryFee   = fields.deliveryFee;
  if (fields.depositAmount !== undefined) order.depositAmount = fields.depositAmount;

  order.updatedAt = new Date().toISOString();
  return order;
}
