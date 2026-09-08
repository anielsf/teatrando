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
  if (!rawUrl) throw new Error('No se encontró la variable POSTGRES_URL en Environment Variables.');
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
  const pool = getPool();

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carteleras (
        id VARCHAR(64) PRIMARY KEY,
        obra VARCHAR(255) NOT NULL,
        funcion VARCHAR(255) NOT NULL,
        fecha VARCHAR(32) NOT NULL,
        hora VARCHAR(32) NOT NULL,
        imagen TEXT,
        precio_usd NUMERIC(10, 2) NOT NULL,
        genero VARCHAR(100),
        sala VARCHAR(100),
        sinopsis TEXT,
        reparto TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS interacciones (
        id SERIAL PRIMARY KEY,
        id_obra VARCHAR(64) NOT NULL,
        tipo VARCHAR(32) NOT NULL,
        valor TEXT,
        fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(64) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol VARCHAR(64) DEFAULT 'Consumidor',
        plan VARCHAR(64) DEFAULT 'Gratuito',
        fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        ticket_id VARCHAR(64) PRIMARY KEY,
        id_usuario VARCHAR(64),
        nombre_cliente VARCHAR(255),
        email_cliente VARCHAR(255) NOT NULL,
        obra VARCHAR(255),
        funcion VARCHAR(255),
        sala VARCHAR(100),
        asiento VARCHAR(32),
        fecha_funcion VARCHAR(32),
        hora_funcion VARCHAR(32),
        precio_usd NUMERIC(10, 2),
        precio_ves NUMERIC(10, 2),
        tasa_bcv NUMERIC(10, 2),
        ref_pago VARCHAR(128),
        fecha_emision VARCHAR(32),
        hora_emision VARCHAR(32),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countResult = await pool.query('SELECT count(*) FROM carteleras;');
    if (parseInt(countResult.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO carteleras (id, obra, funcion, fecha, hora, imagen, precio_usd, genero, sala, sinopsis, reparto) VALUES
        ('1', 'Hamlet', 'Función de Gala', '2026-09-15', '19:30', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80', 25.00, 'Drama', 'Sala Rios Reyna', 'La clásica tragedia de William Shakespeare sobre la venganza y la traición.', 'Carlos Cruz, Marisa Román, Héctor Manrique'),
        ('2', 'El Fantasma de la Ópera', 'Viernes Estelar', '2026-09-18', '20:00', 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=600&q=80', 35.00, 'Musical', 'Teatro Municipal', 'Un misterioso prodigio musical habita en el laberinto debajo de la Ópera de París.', 'Giannina Pavone, Beto Baralt, Humberto Baralt'),
        ('3', 'TOC TOC', 'Domingo de Risas', '2026-09-20', '18:00', 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80', 15.00, 'Comedia', 'Teatro Trasnocho', 'Seis pacientes que padecen TOC se conocen en la sala de espera de un psiquiatra.', 'Sócrates Serrano, Sonia Villamizar, Laureano Olivarez');
      `);
    }

    await pool.end();
    return res.status(200).json({
      success: true,
      message: 'Base de datos de Teatrando inicializada exitosamente en Supabase Postgres.'
    });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
}
