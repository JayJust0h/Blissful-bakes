// pages/api/orders/[id].js
// PATCH: admin updates status and/or edits order fields (items, deliveryFee, depositAmount, total)
import { updateOrderStatus, updateOrderFields } from '../../../lib/orders';

export default async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers['x-admin-token'];
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const { status, items, total, deliveryFee, depositAmount } = req.body;

    // Status update
    if (status !== undefined) {
      const validStatuses = ['pending', 'confirmed', 'baking', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const order = await updateOrderStatus(id, status);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json({ order });
    }

    // Full order edit (items, fees, deposit)
    if (items !== undefined || total !== undefined || deliveryFee !== undefined || depositAmount !== undefined) {
      const order = await updateOrderFields(id, {
        ...(items         !== undefined && { items }),
        ...(total         !== undefined && { total }),
        ...(deliveryFee   !== undefined && { deliveryFee }),
        ...(depositAmount !== undefined && { depositAmount }),
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.status(200).json({ order });
    }

    return res.status(400).json({ error: 'Nothing to update' });
  } catch (error) {
    console.error('API Error in /api/orders/[id]:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
