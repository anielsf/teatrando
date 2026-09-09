import { supabase } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, password, nombre } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { nombre_completo: nombre, rol: 'Usuario' }
    }
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ usuario: data.user });
}