// Serverless function for leaderboard using Vercel KV
// Requires Vercel KV to be configured in the project (Environment Variables bound automatically)

import { kv } from '@vercel/kv';

const KEY = 'rainbow-words:leaderboard';

export default async function handler(req, res){
  try{
    if (req.method === 'GET'){
      const list = (await kv.get(KEY)) || [];
      const sorted = [...list].sort((a,b)=> (b.right - b.wrong) - (a.right - a.wrong) || b.right - a.right);
      return res.status(200).json({ top: sorted.slice(0, 10) });
    }
    if (req.method === 'POST'){
      const { name, right, wrong } = req.body || {};
      const entry = {
        name: String(name||'Anonymous').slice(0, 40),
        right: Math.max(0, parseInt(right||0,10)),
        wrong: Math.max(0, parseInt(wrong||0,10)),
        at: Date.now()
      };
      const list = (await kv.get(KEY)) || [];
      list.push(entry);
      await kv.set(KEY, list);
      return res.status(201).json({ ok:true });
    }
    return res.status(405).json({ error:'Method Not Allowed' });
  }catch(e){
    return res.status(500).json({ error: 'Server error' });
  }
}


