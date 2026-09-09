import { supabase } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, carteleras(obra, fecha, hora)');
      
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { usuario_id, cartelera_id, asiento, precio_ves } = req.body;

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        { 
          usuario_id, 
          cartelera_id, 
          asiento, 
          precio_ves 
        }
      ])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, ticket: data[0] });
  }

  return res.status(405).json({ error: 'Método HTTP no permitido' });
}