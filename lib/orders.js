// Simple in-memory store for demo purposes
// For production, replace with a real database (e.g., Vercel KV, PlanetScale, Supabase)

let orders = [];
let nextId = 1000;

export function getAllOrders() {
  return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createOrder(orderData) {
  const order = {
    id: `BB-${nextId++}`,
    ...orderData,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

export function updateOrderStatus(id, status) {
  const order = orders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
  }
  return order;
}

export function getOrderById(id) {
  return orders.find((o) => o.id === id);
}
