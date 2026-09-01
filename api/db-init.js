import pg from 'pg';
const { Pool } = pg;

function getPool() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new Error('No se encontró la variable POSTGRES_URL en Environment Variables.');
  return new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
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
      message: 'Base de datos de Teatrando inicializada exitosamente.'
    });
  } catch (error) {
    await pool.end().catch(() => {});
    return res.status(500).json({ success: false, error: error.message });
  }
}
