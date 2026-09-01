import { sql } from '@vercel/postgres';

/**
 * Endpoint Serverless: CRUD de Carteleras en Vercel Postgres
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET: Obtener todas las carteleras con métricas de interacciones
    if (req.method === 'GET') {
      const showsResult = await sql`
        SELECT 
          id, obra, funcion, fecha, hora, imagen, 
          precio_usd AS "precioUSD", genero, sala, sinopsis, reparto
        FROM carteleras
        ORDER BY fecha ASC, hora ASC;
      `;

      const interResult = await sql`SELECT id_obra, tipo, valor FROM interacciones;`;
      const metrics = {};

      interResult.rows.forEach((row) => {
        if (!metrics[row.id_obra]) metrics[row.id_obra] = { likes: 0, comentarios: [] };
        if (row.tipo === 'like') metrics[row.id_obra].likes += 1;
        if (row.tipo === 'comentario' && row.valor) metrics[row.id_obra].comentarios.push(row.valor);
      });

      const shows = showsResult.rows.map((s) => ({
        ...s,
        precioUSD: parseFloat(s.precioUSD),
        likes: metrics[s.id]?.likes || 0,
        comentarios: metrics[s.id]?.comentarios || []
      }));

      return res.status(200).json(shows);
    }

    // POST: Guardar o actualizar una obra
    if (req.method === 'POST') {
      const body = req.body || {};
      const { id, obra, funcion, fecha, hora, imagen, precioUSD, genero, sala, sinopsis, reparto } = body;

      if (!obra || !funcion) {
        return res.status(400).json({ success: false, message: 'Nombre de obra y función son requeridos.' });
      }

      const showId = id || Date.now().toString();

      await sql`
        INSERT INTO carteleras (id, obra, funcion, fecha, hora, imagen, precio_usd, genero, sala, sinopsis, reparto)
        VALUES (${showId}, ${obra}, ${funcion}, ${fecha}, ${hora}, ${imagen || ''}, ${precioUSD || 0}, ${genero || 'General'}, ${sala || 'Sala Principal'}, ${sinopsis || ''}, ${reparto || ''})
        ON CONFLICT (id) DO UPDATE SET
          obra = EXCLUDED.obra,
          funcion = EXCLUDED.funcion,
          fecha = EXCLUDED.fecha,
          hora = EXCLUDED.hora,
          imagen = EXCLUDED.imagen,
          precio_usd = EXCLUDED.precio_usd,
          genero = EXCLUDED.genero,
          sala = EXCLUDED.sala,
          sinopsis = EXCLUDED.sinopsis,
          reparto = EXCLUDED.reparto;
      `;

      return res.status(200).json({ success: true, id: showId });
    }

    // DELETE: Eliminar una obra
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'ID es requerido' });

      await sql`DELETE FROM carteleras WHERE id = ${id};`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en carteleras handler:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
