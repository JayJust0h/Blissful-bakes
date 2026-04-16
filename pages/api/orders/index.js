import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req,res){
  if(req.method==='POST'){
    const order=req.body;
    order.id='ORD-'+Date.now();
    await redis.set(order.id,order);
    return res.json({order});
  }

  if(req.method==='GET'){
    const token=req.headers['x-admin-token'];
    if(token!==process.env.ADMIN_TOKEN){
      return res.status(401).json({error:'Unauthorized'});
    }
    const keys=await redis.keys('ORD-*');
    const orders=await Promise.all(keys.map(k=>redis.get(k)));
    return res.json({orders});
  }
}
