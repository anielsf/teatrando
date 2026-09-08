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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido' });

  const { action, nombre, email, password } = req.body || {};
  const emailNorm = (email || '').toString().trim().toLowerCase();
  const pool = getPool();

  try {
    if (action === 'register') {
      const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1;', [emailNorm]);
      if (existing.rowCount > 0) {
        await pool.end();
        return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
      }

      const userId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const rol = emailNorm.includes('admin') ? 'Administrador' : (emailNorm.includes('grupo') ? 'Grupo Teatral' : 'Consumidor');

      await pool.query(
        'INSERT INTO usuarios (id, nombre, email, password, rol, plan) VALUES ($1,$2,$3,$4,$5,$6);',
        [userId, nombre || 'Usuario', emailNorm, password, rol, 'Gratuito']
      );

      await pool.end();
      return res.status(200).json({
        success: true,
        usuario: { id: userId, nombre, email: emailNorm, rol, plan: 'Gratuito' }
      });
    }

    if (action === 'login') {
      const result = await pool.query(
        'SELECT id, nombre, email, rol, plan FROM usuarios WHERE email = $1 AND password = $2;',
        [emailNorm, password]
      );

      await pool.end();
      if (result.rowCount === 0) {
        return res.status(400).json({ success: false, message: 'Credenciales inválidas.' });
      }
      return res.status(200).json({ success: true, usuario: result.rows[0] });
    }

    await pool.end();
    return res.status(400).json({ success: false, message: 'Acción no válida' });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
}
