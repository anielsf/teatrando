import { query } from '../lib/db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { id_obra } = req.query;
      if (!id_obra) return res.status(200).json([]);

      const { rows } = await query(
        `SELECT id, id_obra AS "idObra", id_usuario AS "idUsuario", nombre_autor AS "nombreAutor",
         rol_autor AS "rolAutor", tipo, valor, estrellas, es_destacada AS "esDestacada", fecha_registro AS "fechaRegistro"
         FROM interacciones
         WHERE id_obra = $1 AND tipo IN ('critica', 'comentario')
         ORDER BY es_destacada DESC, fecha_registro DESC`,
        [id_obra]
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const d = req.body || {};
      const idObra = d.id_obra;
      const tipo = d.tipo || 'like'; // like, comentario, critica
      const idUsuario = d.id_usuario || null;
      const nombreAutor = (d.nombre_autor || 'Anónimo').toString().trim();
      const rolAutor = (d.rol_autor || 'Usuario').toString().trim();
      const valor = d.valor || '';
      const estrellas = d.estrellas !== undefined ? parseInt(d.estrellas, 10) : 5;

      if (!idObra) {
        return res.status(400).json({ success: false, error: 'id_obra es requerido' });
      }

      // Distintivo oficial para el rol Crítico
      const esDestacada = rolAutor === 'Crítico' || tipo === 'critica';

      const { rows } = await query(
        `INSERT INTO interacciones (id_obra, id_usuario, nombre_autor, rol_autor, tipo, valor, estrellas, es_destacada)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [idObra, idUsuario, nombreAutor, rolAutor, tipo, valor, estrellas, esDestacada]
      );

      return res.status(200).json({
        success: true,
        id: rows[0].id,
        esDestacada
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error interacciones:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}