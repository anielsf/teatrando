/**
 * Capa de Integración y Servicios de Base de Datos para Teatrando
 * Conexión centralizada con Vercel Postgres, Google Apps Script o fallback local.
 */
import { CONFIG } from '../config.js';
import { store } from '../state/store.js';

export const apiService = {
  normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('drive.google.com/thumbnail?id=')) {
      const fileId = url.split('id=')[1].split('&')[0];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1].split('/')[0];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
  },

  /**
   * Obtiene la lista de carteleras centralizada desde Vercel Postgres / Backend
   */
  async getCarteleras() {
    // 1. Intentar endpoint en la nube de Vercel Postgres
    try {
      const res = await fetch('/api/carteleras');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const processed = list.map((s) => ({
            ...s,
            imagen: this.normalizeImageUrl(s.imagen)
          }));
          store.setState({ shows: processed });
          return processed;
        }
      }
    } catch (e) {}

    // 2. Integración con Google Apps Script si está embebido
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler((datos) => {
            const list = (datos || []).map((s) => ({
              ...s,
              imagen: this.normalizeImageUrl(s.imagen)
            }));
            store.setState({ shows: list });
            resolve(list);
          })
          .withFailureHandler(() => resolve([]))
          .obtenerCarteleras();
      });
    }

    // 3. Modo Local / Fallback con mockData
    let saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SHOWS);
    if (!saved) {
      try {
        const res = await fetch('assets/data/mockData.json');
        const initialData = await res.json();
        localStorage.setItem(CONFIG.STORAGE_KEYS.SHOWS, JSON.stringify(initialData));
        saved = JSON.stringify(initialData);
      } catch (e) {
        saved = '[]';
      }
    }

    let shows = JSON.parse(saved || '[]');
    const interactions = this.getInteractions();

    shows = shows.map((item) => {
      const itemInteractions = interactions[item.id] || { likes: 0, comentarios: [] };
      return {
        ...item,
        imagen: this.normalizeImageUrl(item.imagen),
        likes: itemInteractions.likes || item.likes || 0,
        comentarios: itemInteractions.comentarios || item.comentarios || []
      };
    });

    shows.sort((a, b) => (a.fecha + ' ' + a.hora).localeCompare(b.fecha + ' ' + b.hora));
    store.setState({ shows });
    return shows;
  },

  /**
   * Guarda o actualiza un espectáculo en la base de datos
   */
  async saveCartelera(obraData) {
    obraData.imagen = this.normalizeImageUrl(obraData.imagen || obraData.fotoURLActual || '');

    // 1. Enviar a Vercel Postgres
    try {
      const res = await fetch('/api/carteleras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obraData)
      });
      if (res.ok) {
        return { success: true };
      }
    } catch (e) {}

    // 2. Apps Script
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((res) => resolve(res))
          .withFailureHandler((err) => reject(err))
          .guardarCartelera(obraData);
      });
    }

    // 3. Local Storage fallback
    const shows = store.getState().shows || [];
    const index = shows.findIndex((s) => s.id.toString() === obraData.id.toString());
    if (index !== -1) {
      shows[index] = { ...shows[index], ...obraData };
    } else {
      shows.push({ ...obraData, id: obraData.id || Date.now().toString(), likes: 0, comentarios: [] });
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.SHOWS, JSON.stringify(shows));
    store.setState({ shows: [...shows] });
    return { success: true };
  },

  /**
   * Elimina un espectáculo por ID
   */
  async deleteCartelera(id) {
    try {
      const res = await fetch(`/api/carteleras?id=${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (e) {}

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler(() => resolve(true))
          .eliminarCartelera(id);
      });
    }

    let shows = store.getState().shows || [];
    shows = shows.filter((s) => s.id.toString() !== id.toString());
    localStorage.setItem(CONFIG.STORAGE_KEYS.SHOWS, JSON.stringify(shows));
    store.setState({ shows: [...shows] });
    return true;
  },

  getInteractions() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INTERACTIONS) || '{}');
    } catch (e) {
      return {};
    }
  },

  /**
   * Obtiene el historial de compras filtrado por correo
   */
  async getPurchasesByEmail(email) {
    if (!email) return [];
    const emailNorm = email.trim().toLowerCase();

    // 1. Vercel Postgres
    try {
      const res = await fetch(`/api/tickets?email=${encodeURIComponent(emailNorm)}`);
      if (res.ok) {
        const purchases = await res.json();
        if (Array.isArray(purchases) && purchases.length > 0) {
          return purchases;
        }
      }
    } catch (e) {}

    // 2. Apps Script
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((compras) => resolve(compras || []))
          .withFailureHandler((err) => reject(err))
          .obtenerComprasUsuario(emailNorm);
      });
    }

    // 3. Local Storage fallback
    try {
      const orders = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS) || '[]');
      const filtered = orders.filter((o) => o.emailCliente && o.emailCliente.toLowerCase() === emailNorm);
      filtered.sort((a, b) => (b.fechaEmision + ' ' + b.horaEmision).localeCompare(a.fechaEmision + ' ' + a.horaEmision));
      return filtered;
    } catch (e) {
      return [];
    }
  }
};
