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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const showsResult = await pool.query(`
        SELECT id, obra, funcion, fecha, hora, imagen,
          precio_usd AS "precioUSD", genero, sala, sinopsis, reparto
        FROM carteleras ORDER BY fecha ASC, hora ASC;
      `);

      const interResult = await pool.query('SELECT id_obra, tipo, valor FROM interacciones;');
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

      await pool.end();
      return res.status(200).json(shows);
    }

    if (req.method === 'POST') {
      const { id, obra, funcion, fecha, hora, imagen, precioUSD, genero, sala, sinopsis, reparto } = req.body || {};
      if (!obra || !funcion) {
        await pool.end();
        return res.status(400).json({ success: false, message: 'Nombre de obra y función son requeridos.' });
      }
      const showId = id || Date.now().toString();

      await pool.query(`
        INSERT INTO carteleras (id, obra, funcion, fecha, hora, imagen, precio_usd, genero, sala, sinopsis, reparto)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET
          obra=EXCLUDED.obra, funcion=EXCLUDED.funcion, fecha=EXCLUDED.fecha, hora=EXCLUDED.hora,
          imagen=EXCLUDED.imagen, precio_usd=EXCLUDED.precio_usd, genero=EXCLUDED.genero,
          sala=EXCLUDED.sala, sinopsis=EXCLUDED.sinopsis, reparto=EXCLUDED.reparto;
      `, [showId, obra, funcion, fecha, hora, imagen || '', precioUSD || 0, genero || 'General', sala || 'Sala Principal', sinopsis || '', reparto || '']);

      await pool.end();
      return res.status(200).json({ success: true, id: showId });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) { await pool.end(); return res.status(400).json({ success: false, message: 'ID requerido' }); }
      await pool.query('DELETE FROM carteleras WHERE id = $1;', [id]);
      await pool.end();
      return res.status(200).json({ success: true });
    }

    await pool.end();
    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
}
