import { query } from '../lib/db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const d = req.body || {};
    const userId = d.userId || 'INVITADO';
    const email = (d.email || '').toString().trim().toLowerCase();
    const plan = d.plan || 'Plan Bambalinas';
    const precioUSD = parseFloat(d.precioUSD) || 9.99;
    const tasaBCV = parseFloat(d.tasaBCV) || 798.33;
    const precioVES = d.precioVES !== undefined
      ? parseFloat(d.precioVES)
      : Math.round(precioUSD * tasaBCV * 100) / 100;
    const refPago = (d.refPago || ('REF-PLAN-' + Math.floor(100000 + Math.random() * 900000))).toString().trim();

    // Determinar nuevo rol según plan
    let nuevoRol = 'Usuario';
    if (plan === 'Plan Crítico / VIP') {
      nuevoRol = 'Crítico';
    }

    // 1. Guardar en historial de suscripciones
    await query(
      `INSERT INTO suscripciones (id_usuario, plan, precio_usd, precio_ves, tasa_bcv, ref_pago, estado)
       VALUES ($1,$2,$3,$4,$5,$6,'Activa')`,
      [userId, plan, precioUSD, precioVES, tasaBCV, refPago]
    );

    // 2. Actualizar usuario si existe
    if (userId !== 'INVITADO' || email) {
      await query(
        `UPDATE usuarios
         SET plan_suscripcion = $1,
             rol = CASE WHEN rol = 'Admin' THEN 'Admin' ELSE $2 END
         WHERE id = $3 OR email = $4`,
        [plan, nuevoRol, userId, email]
      );
    }

    return res.status(200).json({
      success: true,
      mensaje: `¡Suscripción activada con éxito al ${plan}!`,
      plan,
      rol: nuevoRol,
      precioUSD,
      precioVES,
      refPago,
      fecha: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error suscripciones:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}