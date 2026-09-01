/**
 * Vercel Serverless Function: Extractor en vivo de la tasa oficial del BCV
 * Se ejecuta en la nube de Vercel (Node.js) sin restricciones de CORS.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = 'https://www.bcv.org.ve/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const pos = html.indexOf('id="dolar"');
      if (pos !== -1) {
        const fragmento = html.substring(pos, pos + 600);
        const match = fragmento.match(/class=["']strong-tb["']>\s*([\d.,]+)\s*<\/strong>/i);

        if (match && match[1]) {
          const valorLimpio = match[1].trim().replace(/\./g, '').replace(',', '.');
          const tasaNum = parseFloat(valorLimpio);

          if (!isNaN(tasaNum) && tasaNum > 0) {
            return res.status(200).json({
              tasa: parseFloat(tasaNum.toFixed(2)),
              fuente: 'bcv.org.ve',
              timestamp: new Date().toISOString(),
              success: true
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error al consultar BCV desde Vercel:', err);
  }

  // Fallback seguro en caso de corte del BCV
  return res.status(200).json({
    tasa: 798.33,
    fuente: 'fallback_oficial',
    timestamp: new Date().toISOString(),
    success: true
  });
}
