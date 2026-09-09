const { supabase } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { data, error } = await supabase.from('carteleras').select('*');
  
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
};