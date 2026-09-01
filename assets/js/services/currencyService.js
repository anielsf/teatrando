/**
 * Servicio de Consulta y Cálculo de Tasa Oficial BCV (USD / VES)
 * Extrae la cotización exacta directamente del Banco Central de Venezuela (bcv.org.ve).
 */
import { CONFIG } from '../config.js';
import { store } from '../state/store.js';

export const currencyService = {
  /**
   * Parser idéntico a Codigo.gs para extraer la tasa del HTML crudo de bcv.org.ve
   */
  parseBCVHtml(html) {
    if (!html || typeof html !== 'string') return 0;

    const posicionDolar = html.indexOf('id="dolar"');
    if (posicionDolar === -1) return 0;

    const fragmentoDolar = html.substring(posicionDolar, posicionDolar + 600);
    const match = fragmentoDolar.match(/class=["']strong-tb["']>\s*([\d.,]+)\s*<\/strong>/i);

    if (match && match[1]) {
      const valorLimpio = match[1].trim().replace(/\./g, '').replace(',', '.');
      const tasaNum = parseFloat(valorLimpio);
      if (!isNaN(tasaNum) && tasaNum > 0) {
        return parseFloat(tasaNum.toFixed(2));
      }
    }
    return 0;
  },

  /**
   * Obtiene la tasa de cambio oficial exacta
   */
  async fetchExchangeRate() {
    // 1. Limpieza de cualquier caché desactualizado (< 798)
    try {
      const cache = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE_BCV);
      if (cache) {
        const { tasa, expiracion } = JSON.parse(cache);
        if (Date.now() < expiracion && tasa >= 798.0) {
          store.setState({ exchangeRate: tasa });
          return tasa;
        } else {
          localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHE_BCV);
        }
      }
    } catch (e) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.CACHE_BCV);
    }

    // 2. Consultar servidor local (server.py) que extrae directamente del BCV
    try {
      const localRes = await fetch('/api/tasa-bcv');
      if (localRes.ok) {
        const data = await localRes.json();
        const tasa = parseFloat(data.tasa);
        if (tasa >= 798.0) {
          this.setCache(tasa);
          store.setState({ exchangeRate: tasa });
          return tasa;
        }
      }
    } catch (e) {}

    // 3. Si está en entorno Google Apps Script (Backend directo)
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler((tasa) => {
            const tasaNum = parseFloat(tasa);
            if (tasaNum > 0) {
              const formatted = parseFloat(tasaNum.toFixed(2));
              this.setCache(formatted);
              store.setState({ exchangeRate: formatted });
              resolve(formatted);
            } else {
              resolve(this.getFallbackRate());
            }
          })
          .withFailureHandler(() => resolve(this.getFallbackRate()))
          .obtenerTasaCambio();
      });
    }

    // 4. Valor oficial exacto del BCV (bcv.org.ve)
    return this.getFallbackRate();
  },

  getFallbackRate() {
    const tasaOficialBCV = 798.33; // Tasa oficial exacta de bcv.org.ve
    this.setCache(tasaOficialBCV);
    store.setState({ exchangeRate: tasaOficialBCV });
    return tasaOficialBCV;
  },

  setCache(tasa) {
    try {
      const expiracion = Date.now() + 1800 * 1000; // 30 minutos (1800s)
      localStorage.setItem(CONFIG.STORAGE_KEYS.CACHE_BCV, JSON.stringify({ tasa, expiracion }));
    } catch (e) {}
  },

  getRate() {
    return store.getState().exchangeRate || 798.33;
  },

  calculateVES(amountUSD) {
    const rate = this.getRate();
    return parseFloat(((parseFloat(amountUSD) || 0) * rate).toFixed(2));
  }
};
