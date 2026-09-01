import { sql } from '@vercel/postgres';

/**
 * Endpoint Serverless: Procesamiento de Boletos y Consulta en Vercel Postgres
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: Obtener tickets por correo
    if (req.method === 'GET') {
      const { email } = req.query;
      if (!email) return res.status(200).json([]);

      const emailNorm = email.trim().toLowerCase();
      const result = await sql`
        SELECT 
          ticket_id AS "ticketId", id_usuario AS "userId", nombre_cliente AS "nombreCliente",
          email_cliente AS "emailCliente", obra, funcion, sala, asiento,
          fecha_funcion AS "fechaFuncion", hora_funcion AS "horaFuncion",
          precio_usd AS "precioUSD", precio_ves AS "precioVES", tasa_bcv AS "tasaBCV",
          ref_pago AS "refPago", fecha_emision AS "fechaEmision", hora_emision AS "horaEmision"
        FROM tickets
        WHERE LOWER(email_cliente) = ${emailNorm}
        ORDER BY created_at DESC;
      `;

      const tickets = result.rows.map((t) => ({
        ...t,
        precioUSD: parseFloat(t.precioUSD),
        precioVES: parseFloat(t.precioVES),
        tasaBCV: parseFloat(tasaBCV)
      }));

      return res.status(200).json(tickets);
    }

    // POST: Emitir y registrar un nuevo boleto
    if (req.method === 'POST') {
      const d = req.body || {};
      const now = new Date();
      const ticketId = 'TCK-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      const fechaStr = now.toISOString().split('T')[0];
      const horaStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const precioUSD = parseFloat(d.precioUSD) || 0;
      const tasaBCV = parseFloat(d.tasaBCV) || 1;
      const precioVES = parseFloat((precioUSD * tasaBCV).toFixed(2));
      const emailNorm = (d.emailCliente || 'sin_correo@dominio.com').trim().toLowerCase();

      await sql`
        INSERT INTO tickets (
          ticket_id, id_usuario, nombre_cliente, email_cliente,
          obra, funcion, sala, asiento, fecha_funcion, hora_funcion,
          precio_usd, precio_ves, tasa_bcv, ref_pago, fecha_emision, hora_emision
        ) VALUES (
          ${ticketId}, ${d.userId || 'INVITADO'}, ${d.nombreCliente || 'Cliente'}, ${emailNorm},
          ${d.obra || 'N/A'}, ${d.funcion || 'N/A'}, ${d.sala || 'N/A'}, ${d.asiento || 'N/A'},
          ${d.fecha || ''}, ${d.hora || ''}, ${precioUSD}, ${precioVES}, ${tasaBCV},
          ${d.refPago || 'N/A'}, ${fechaStr}, ${horaStr}
        );
      `;

      const ticket = {
        ticketId,
        userId: d.userId || 'INVITADO',
        nombreCliente: d.nombreCliente || 'Cliente',
        emailCliente: emailNorm,
        obra: d.obra,
        funcion: d.funcion,
        sala: d.sala,
        asiento: d.asiento,
        fechaFuncion: d.fecha,
        horaFuncion: d.hora,
        precioUSD,
        precioVES,
        tasaBCV,
        refPago: d.refPago || 'N/A',
        fechaEmision: fechaStr,
        horaEmision: horaStr
      };

      return res.status(200).json(ticket);
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en tickets handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
