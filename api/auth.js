process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
const { Pool } = pg;

function getPool() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error('No se encontró POSTGRES_URL.');
  return new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' });

  const { action, nombre, email, password } = req.body || {};
  const emailNorm = (email || '').toString().trim().toLowerCase();
  const pool = getPool();

  try {
    if (action === 'register') {
      const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1;', [emailNorm]);
      if (existing.rowCount > 0) {
        await pool.end();
        return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
      }

      const userId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const rol = emailNorm.includes('admin') ? 'Administrador' : (emailNorm.includes('grupo') ? 'Grupo Teatral' : 'Consumidor');

      await pool.query(
        'INSERT INTO usuarios (id, nombre, email, password, rol, plan) VALUES ($1,$2,$3,$4,$5,$6);',
        [userId, nombre || 'Usuario', emailNorm, password, rol, 'Gratuito']
      );

      await pool.end();
      return res.status(200).json({
        success: true,
        usuario: { id: userId, nombre, email: emailNorm, rol, plan: 'Gratuito' }
      });
    }

    if (action === 'login') {
      const result = await pool.query(
        'SELECT id, nombre, email, rol, plan FROM usuarios WHERE email = $1 AND password = $2;',
        [emailNorm, password]
      );

      await pool.end();
      if (result.rowCount === 0) {
        return res.status(400).json({ success: false, message: 'Credenciales inválidas.' });
      }
      return res.status(200).json({ success: true, usuario: result.rows[0] });
    }

    await pool.end();
    return res.status(400).json({ success: false, message: 'Acción no válida' });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
}
