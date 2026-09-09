import { supabase } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método HTTP no permitido' });

  const { email, password } = req.body;

  // Autenticación de usuario existente
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) return res.status(401).json({ error: error.message });
  
  // Retorna el token de sesión y los datos del usuario
  return res.status(200).json({ 
    usuario: data.user,
    sesion: data.session 
  });
}