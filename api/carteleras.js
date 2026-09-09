import { query } from '../lib/db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { rows } = await query(`
        SELECT c.*,
          t.nombre AS "teatroNombre", t.ubicacion AS "teatroUbicacion", t.aforo AS "teatroAforo",
          COALESCE(
            json_agg(DISTINCT jsonb_build_object(
              'id', i.id, 'nombre_autor', i.nombre_autor, 'rol_autor', i.rol_autor,
              'texto', i.valor, 'estrellas', i.estrellas, 'esDestacada', i.es_destacada, 'fecha', i.fecha_registro
            )) FILTER (WHERE i.id IS NOT NULL AND i.tipo = 'critica'), '[]'
          ) AS criticas,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object(
              'id', cm.id, 'nombre_autor', cm.nombre_autor, 'texto', cm.valor, 'fecha', cm.fecha_registro
            )) FILTER (WHERE cm.id IS NOT NULL AND cm.tipo = 'comentario'), '[]'
          ) AS comentarios,
          COUNT(DISTINCT lk.id) FILTER (WHERE lk.tipo = 'like') AS likes
        FROM carteleras c
        LEFT JOIN teatros t ON c.id_teatro = t.id
        LEFT JOIN interacciones i ON i.id_obra = c.id
        LEFT JOIN interacciones cm ON cm.id_obra = c.id
        LEFT JOIN interacciones lk ON lk.id_obra = c.id
        GROUP BY c.id, t.nombre, t.ubicacion, t.aforo
        ORDER BY c.fecha ASC, c.hora ASC
      `);
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { id, id_teatro, obra, funcion, genero, sala, director, fecha, hora, precioUSD,
              sinopsis, reparto, imagen, duracionMin, edadMinima } = req.body;

      if (!obra || !funcion) {
        return res.status(400).json({ success: false, error: 'Obra y función son requeridos' });
      }

      if (id) {
        await query(
          `UPDATE carteleras SET id_teatro=$1, obra=$2, funcion=$3, genero=$4, sala=$5, director=$6,
           fecha=$7, hora=$8, precio_usd=$9, sinopsis=$10, reparto=$11, imagen=$12,
           duracion_min=$13, edad_minima=$14 WHERE id=$15`,
          [id_teatro || 1, obra, funcion, genero, sala, director, fecha, hora, precioUSD,
           sinopsis, reparto, imagen, duracionMin || 90, edadMinima || 'Todo público', id]
        );
        return res.status(200).json({ success: true, id });
      } else {
        const newId = Date.now().toString();
        await query(
          `INSERT INTO carteleras (id, id_teatro, obra, funcion, genero, sala, director, fecha, hora, precio_usd,
           sinopsis, reparto, imagen, duracion_min, edad_minima)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [newId, id_teatro || 1, obra, funcion, genero, sala, director, fecha, hora, precioUSD,
           sinopsis, reparto, imagen, duracionMin || 90, edadMinima || 'Todo público']
        );
        return res.status(201).json({ success: true, id: newId });
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
}