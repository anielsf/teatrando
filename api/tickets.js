process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
const { Pool } = pg;

function getPool() {
  const rawUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!rawUrl) throw new Error('No se encontró POSTGRES_URL.');
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]+/g, '');
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const { email } = req.query;
      if (!email) { await pool.end(); return res.status(200).json([]); }
      const emailNorm = email.trim().toLowerCase();

      const result = await pool.query(`
        SELECT ticket_id AS "ticketId", id_usuario AS "userId", nombre_cliente AS "nombreCliente",
          email_cliente AS "emailCliente", obra, funcion, sala, asiento,
          fecha_funcion AS "fechaFuncion", hora_funcion AS "horaFuncion",
          precio_usd AS "precioUSD", precio_ves AS "precioVES", tasa_bcv AS "tasaBCV",
          ref_pago AS "refPago", fecha_emision AS "fechaEmision", hora_emision AS "horaEmision"
        FROM tickets WHERE LOWER(email_cliente) = $1 ORDER BY created_at DESC;
      `, [emailNorm]);

      const tickets = result.rows.map((t) => ({
        ...t,
        precioUSD: parseFloat(t.precioUSD),
        precioVES: parseFloat(t.precioVES),
        tasaBCV: parseFloat(t.tasaBCV)
      }));

      await pool.end();
      return res.status(200).json(tickets);
    }

    if (req.method === 'POST') {
      const d = req.body || {};
      const now = new Date();
      const ticketId = 'TCK-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      const fechaStr = now.toISOString().split('T')[0];
      const horaStr = now.toTimeString().split(' ')[0];

      const precioUSD = parseFloat(d.precioUSD) || 0;
      const tasaBCV = parseFloat(d.tasaBCV) || 1;
      const precioVES = parseFloat((precioUSD * tasaBCV).toFixed(2));
      const emailNorm = (d.emailCliente || 'sin_correo@dominio.com').trim().toLowerCase();

      await pool.query(`
        INSERT INTO tickets (ticket_id, id_usuario, nombre_cliente, email_cliente, obra, funcion, sala, asiento,
          fecha_funcion, hora_funcion, precio_usd, precio_ves, tasa_bcv, ref_pago, fecha_emision, hora_emision)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16);
      `, [ticketId, d.userId||'INVITADO', d.nombreCliente||'Cliente', emailNorm,
          d.obra||'N/A', d.funcion||'N/A', d.sala||'N/A', d.asiento||'N/A',
          d.fecha||'', d.hora||'', precioUSD, precioVES, tasaBCV,
          d.refPago||'N/A', fechaStr, horaStr]);

      const ticket = {
        ticketId, userId: d.userId||'INVITADO', nombreCliente: d.nombreCliente||'Cliente',
        emailCliente: emailNorm, obra: d.obra, funcion: d.funcion, sala: d.sala, asiento: d.asiento,
        fechaFuncion: d.fecha, horaFuncion: d.hora, precioUSD, precioVES, tasaBCV,
        refPago: d.refPago||'N/A', fechaEmision: fechaStr, horaEmision: horaStr
      };

      await pool.end();
      return res.status(200).json(ticket);
    }

    await pool.end();
    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
}
