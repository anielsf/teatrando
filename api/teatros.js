const { query } = require('../lib/db');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const idTeatro = parseInt(req.query.id, 10) || 1;

      let { rows: teatroRows } = await query('SELECT * FROM teatros WHERE id = $1', [idTeatro]);
      if (teatroRows.length === 0) {
        const fallback = await query('SELECT * FROM teatros LIMIT 1');
        teatroRows = fallback.rows;
      }
      const teatro = teatroRows[0] || {
        id: 1,
        nombre: 'Teatro Municipal de Caracas',
        ubicacion: 'Centro de Caracas',
        aforo: 650,
        historia: 'Teatro histórico neoclásico venezolano.',
        servicios: 'Estacionamiento, Cafetería, Acceso para sillas de ruedas',
        normas: 'Puntualidad y teléfonos en silencio.',
        telefono: '+58 212 555-8328'
      };

      const { rows: statsRows } = await query(
        'SELECT * FROM estadisticas_teatro WHERE id_teatro = $1 LIMIT 1',
        [teatro.id]
      );
      const stats = statsRows[0] || {};

      const { rows: ticketRows } = await query(
        'SELECT count(*) AS "totalTickets", sum(precio_usd) AS "totalRecaudado" FROM tickets'
      );
      const ticketStats = ticketRows[0] || {};
      const realTickets = parseInt(ticketStats.totalTickets, 10) || 0;

      const { rows: criticaRows } = await query(
        `SELECT avg(estrellas) AS promedio, count(*) AS "totalCriticas" FROM interacciones WHERE tipo = 'critica'`
      );
      const criticaStats = criticaRows[0] || {};

      const respuesta = {
        teatro,
        estadisticas: {
          totalFunciones: parseInt(stats.total_funciones, 10) || 24,
          butacasVendidas: (parseInt(stats.butacas_vendidas, 10) || 5280) + realTickets,
          porcentajeOcupacion: parseFloat(stats.porcentaje_ocupacion) || 91.25,
          calificacionCriticos: Math.round((parseFloat(criticaStats.promedio) || 4.94) * 100) / 100,
          totalCriticasOficiales: parseInt(criticaStats.totalCriticas, 10) || 2,
          obraMasVista: stats.obra_mas_vista || 'El Fantasma de la Ópera',
          totalRecaudadoUSD: parseFloat(ticketStats.totalRecaudado) || 0.00
        }
      };

      return res.status(200).json(respuesta);
    }

    if (req.method === 'POST') {
      const data = req.body || {};
      const idTeatro = parseInt(data.id, 10) || 1;

      if (data.historia || data.servicios || data.normas) {
        await query(
          `UPDATE teatros SET aforo=$1, historia=$2, servicios=$3, normas=$4, telefono=$5 WHERE id=$6`,
          [
            parseInt(data.aforo, 10) || 650,
            data.historia || '',
            data.servicios || '',
            data.normas || '',
            data.telefono || '',
            idTeatro
          ]
        );
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error teatros:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
