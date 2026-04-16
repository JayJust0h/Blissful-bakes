// pages/api/orders.js
// POST: customer creates order (items + contact details only, no fees)
// GET:  admin fetches all orders (requires x-admin-token)
import { createOrder, getAllOrders } from '../../lib/orders';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { customer, items, total } = req.body;

    if (!customer?.name || !customer?.phone || !customer?.address || !items?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // deliveryFee and depositAmount are NOT accepted from customer — admin sets them
    const order = createOrder({
      customer,
      items,
      total,
      deliveryFee: 0,
      depositAmount: 0,
    });
    return res.status(201).json({ order });
  }

  if (req.method === 'GET') {
    const token = req.headers['x-admin-token'];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ orders: getAllOrders() });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
