import { Redis } from '@upstash/redis';

let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = Redis.fromEnv();
}

// Fallback in-memory store for local development without Redis
let ordersInMemory = [];
let nextIdInMemory = 1000;

export async function getAllOrders() {
  if (redis) {
    try {
      const ordersMap = await redis.hgetall('orders');
      if (!ordersMap) return [];
      return Object.values(ordersMap)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Redis error in getAllOrders:', error);
      return [];
    }
  }
  return [...ordersInMemory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOrderById(id) {
  if (!id) return null;
  if (redis) {
    try {
      return await redis.hget('orders', id);
    } catch (error) {
      console.error('Redis error in getOrderById:', error);
      return null;
    }
  }
  return ordersInMemory.find(o => o.id === id);
}

export async function createOrder(orderData) {
  // Basic validation
  if (!orderData.customer?.name || !orderData.customer?.phone || !orderData.items?.length) {
    throw new Error('Missing required order fields');
  }

  let id;
  if (redis) {
    try {
      const nextId = await redis.incr('next_order_id');
      id = `BB-${1000 + nextId}`;
    } catch (error) {
      console.error('Redis error in createOrder (incr):', error);
      id = `BB-${Date.now()}`;
    }
  } else {
    id = `BB-${nextIdInMemory++}`;
  }

  const order = {
    id,
    ...orderData,
    deliveryFee:   orderData.deliveryFee   ?? 0,
    depositAmount: orderData.depositAmount ?? 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (redis) {
    try {
      await redis.hset('orders', { [id]: order });
    } catch (error) {
      console.error('Redis error in createOrder (hset):', error);
      throw new Error('Failed to save order to database');
    }
  } else {
    ordersInMemory.push(order);
  }

  return order;
}

export async function updateOrderStatus(id, status) {
  if (!id || !status) return null;
  let order;
  if (redis) {
    try {
      order = await redis.hget('orders', id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        await redis.hset('orders', { [id]: order });
      }
    } catch (error) {
      console.error('Redis error in updateOrderStatus:', error);
      throw new Error('Failed to update order status');
    }
  } else {
    order = ordersInMemory.find(o => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }
  }
  return order;
}

export async function updateOrderFields(id, fields) {
  if (!id || !fields) return null;
  let order;
  if (redis) {
    try {
      order = await redis.hget('orders', id);
      if (order) {
        if (fields.items         !== undefined) order.items         = fields.items;
        if (fields.total         !== undefined) order.total         = fields.total;
        if (fields.deliveryFee   !== undefined) order.deliveryFee   = fields.deliveryFee;
        if (fields.depositAmount !== undefined) order.depositAmount = fields.depositAmount;

        order.updatedAt = new Date().toISOString();
        await redis.hset('orders', { [id]: order });
      }
    } catch (error) {
      console.error('Redis error in updateOrderFields:', error);
      throw new Error('Failed to update order fields');
    }
  } else {
    order = ordersInMemory.find(o => o.id === id);
    if (order) {
      if (fields.items         !== undefined) order.items         = fields.items;
      if (fields.total         !== undefined) order.total         = fields.total;
      if (fields.deliveryFee   !== undefined) order.deliveryFee   = fields.deliveryFee;
      if (fields.depositAmount !== undefined) order.depositAmount = fields.depositAmount;

      order.updatedAt = new Date().toISOString();
    }
  }
  return order;
}
