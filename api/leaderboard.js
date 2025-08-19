// Serverless function for leaderboard using Supabase
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables in Vercel

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

export default async function handler(req, res){
  try{
    if (!supabase){
      return res.status(500).json({ error: 'Server error', message: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in Vercel.' });
    }
    if (req.method === 'GET'){
      const { data, error } = await supabase
        .from('scores')
        .select('name, "right", "wrong", created_at')
        .limit(200);
      if (error) return res.status(500).json({ error: 'DB error', message: error.message });
      const normalized = (data||[]).map(r=>({ name: r.name, right: r.right ?? r["right"], wrong: r.wrong ?? r["wrong"], at: r.created_at }));
      const sorted = normalized.sort((a,b)=> (b.right - b.wrong) - (a.right - a.wrong) || b.right - a.right);
      return res.status(200).json({ top: sorted.slice(0, 10) });
    }
    if (req.method === 'POST'){
      const { name, right, wrong } = req.body || {};
      const entry = {
        name: String(name||'Anonymous').slice(0, 40),
        right: Math.max(0, parseInt(right||0,10)),
        wrong: Math.max(0, parseInt(wrong||0,10))
      };
      const { error } = await supabase
        .from('scores')
        .insert([{ name: entry.name, "right": entry.right, "wrong": entry.wrong }]);
      if (error) return res.status(500).json({ error: 'DB error', message: error.message });
      return res.status(201).json({ ok:true });
    }
    return res.status(405).json({ error:'Method Not Allowed' });
  }catch(e){
    return res.status(500).json({ error: 'Server error', message: e?.message });
  }
}


