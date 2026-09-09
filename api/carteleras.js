const { query } = require('../lib/db');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { rows } = await query(`
        SELECT c.*,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object(
              'id', i.id, 'nombre_autor', i.nombre_autor, 'rol_autor', i.rol_autor,
              'texto', i.texto, 'estrellas', i.estrellas, 'fecha', i.fecha
            )) FILTER (WHERE i.id IS NOT NULL AND i.tipo = 'critica'), '[]'
          ) AS criticas,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object(
              'id', cm.id, 'nombre_autor', cm.nombre_autor, 'texto', cm.texto, 'fecha', cm.fecha
            )) FILTER (WHERE cm.id IS NOT NULL AND cm.tipo = 'comentario'), '[]'
          ) AS comentarios
        FROM carteleras c
        LEFT JOIN interacciones i ON i.id_cartelera = c.id
        LEFT JOIN interacciones cm ON cm.id_cartelera = c.id
        GROUP BY c.id
        ORDER BY c.fecha ASC, c.hora ASC
      `);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, obra, funcion, genero, sala, director, fecha, hora, precioUSD,
              sinopsis, reparto, imagen, duracionMin, edadMinima } = req.body;

      if (id) {
        await query(
          `UPDATE carteleras SET obra=$1, funcion=$2, genero=$3, sala=$4, director=$5,
           fecha=$6, hora=$7, precio_usd=$8, sinopsis=$9, reparto=$10, imagen=$11,
           duracion_min=$12, edad_minima=$13 WHERE id=$14`,
          [obra, funcion, genero, sala, director, fecha, hora, precioUSD,
           sinopsis, reparto, imagen, duracionMin || 90, edadMinima || 'Todo público', id]
        );
        return res.status(200).json({ success: true, id });
      } else {
        const { rows } = await query(
          `INSERT INTO carteleras (obra, funcion, genero, sala, director, fecha, hora, precio_usd,
           sinopsis, reparto, imagen, duracion_min, edad_minima)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
          [obra, funcion, genero, sala, director, fecha, hora, precioUSD,
           sinopsis, reparto, imagen, duracionMin || 90, edadMinima || 'Todo público']
        );
        return res.status(201).json({ success: true, id: rows[0].id });
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      await query('DELETE FROM carteleras WHERE id=$1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error carteleras:', err);
    return res.status(500).json({ error: err.message });
  }
};
