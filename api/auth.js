import { sql } from '@vercel/postgres';

/**
 * Endpoint Serverless: Registro y Autenticación en Vercel Postgres
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { action, nombre, email, password } = req.body || {};
  const emailNorm = (email || '').toString().trim().toLowerCase();

  try {
    // 1. Registro de usuario
    if (action === 'register') {
      const existing = await sql`SELECT id FROM usuarios WHERE email = ${emailNorm};`;
      if (existing.rowCount > 0) {
        return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
      }

      const userId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const rol = emailNorm.includes('admin') ? 'Administrador' : (emailNorm.includes('grupo') ? 'Grupo Teatral' : 'Consumidor');
      const plan = 'Gratuito';

      await sql`
        INSERT INTO usuarios (id, nombre, email, password, rol, plan)
        VALUES (${userId}, ${nombre || 'Usuario'}, ${emailNorm}, ${password}, ${rol}, ${plan});
      `;

      return res.status(200).json({
        success: true,
        usuario: { id: userId, nombre, email: emailNorm, rol, plan }
      });
    }

    // 2. Inicio de sesión (Login)
    if (action === 'login') {
      const result = await sql`
        SELECT id, nombre, email, rol, plan 
        FROM usuarios 
        WHERE email = ${emailNorm} AND password = ${password};
      `;

      if (result.rowCount === 0) {
        return res.status(400).json({ success: false, message: 'Credenciales inválidas.' });
      }

      return res.status(200).json({
        success: true,
        usuario: result.rows[0]
      });
    }

    return res.status(400).json({ success: false, message: 'Acción no válida' });
  } catch (error) {
    console.error('Error en auth handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
