import pg from 'pg';
const { Pool } = pg;

const SUPABASE_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----`;

function getPool() {
  const rawUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!rawUrl) throw new Error('No se encontró POSTGRES_URL.');
  const connectionString = rawUrl.replace(/[?&]sslmode=[^&]+/g, '');
  return new Pool({
    connectionString,
    ssl: {
      ca: SUPABASE_CA,
      rejectUnauthorized: false
    }
  });
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
