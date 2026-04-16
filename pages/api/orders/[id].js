import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req,res){
  const {id}=req.query;
  const token=req.headers['x-admin-token'];
  if(token!==process.env.ADMIN_TOKEN){
    return res.status(401).json({error:'Unauthorized'});
  }

  if(req.method==='PATCH'){
    const existing=await redis.get(id);
    const updated={...existing,...req.body};
    await redis.set(id,updated);
    return res.json({order:updated});
  }
}
