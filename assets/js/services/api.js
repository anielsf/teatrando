/**
 * Capa de Integración y Servicios de Base de Datos para Teatrando
 * Traduce y desacopla las funciones de Google Apps Script (Sheets/Drive)
 * para operar fluidamente tanto en modo local/SaaS como conectado a un backend.
 */
import { CONFIG } from '../config.js';
import { store } from '../state/store.js';

export const apiService = {
  /**
   * Normaliza URLs de Google Drive a URLs directas de alta velocidad (lh3.googleusercontent.com)
   */
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
   * Obtiene la lista de carteleras ordenadas por fecha/hora e incluye métricas de interacciones
   */
  async getCarteleras() {
    // 1. Integración con Google Apps Script si está embebido
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
          .withFailureHandler((err) => {
            console.error('Error al obtener carteleras de GAS:', err);
            resolve([]);
          })
          .obtenerCarteleras();
      });
    }

    // 2. Modo Local / SPA con persistencia en localStorage
    let saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SHOWS);
    if (!saved) {
      try {
        const res = await fetch('assets/data/mockData.json');
        const initialData = await res.json();
        localStorage.setItem(CONFIG.STORAGE_KEYS.SHOWS, JSON.stringify(initialData));
        saved = JSON.stringify(initialData);
      } catch (e) {
        console.warn('No se pudo cargar mockData.json:', e);
        saved = '[]';
      }
    }

    let shows = JSON.parse(saved || '[]');
    const interactions = this.getInteractions();

    // Agregar métricas calculadas (likes y comentarios)
    shows = shows.map((item) => {
      const itemInteractions = interactions[item.id] || { likes: 0, comentarios: [] };
      return {
        ...item,
        imagen: this.normalizeImageUrl(item.imagen),
        likes: itemInteractions.likes || 0,
        comentarios: itemInteractions.comentarios || []
      };
    });

    // Ordenar cronológicamente (Fecha + Hora)
    shows.sort((a, b) => (a.fecha + ' ' + a.hora).localeCompare(b.fecha + ' ' + b.hora));

    store.setState({ shows });
    return shows;
  },

  /**
   * Guarda o actualiza un espectáculo en el catálogo
   */
  async saveCartelera(obraData) {
    obraData.imagen = this.normalizeImageUrl(obraData.imagen || obraData.fotoURLActual || '');

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((res) => resolve(res))
          .withFailureHandler((err) => reject(err))
          .guardarCartelera(obraData);
      });
    }

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

  /**
   * Gestión de Interacciones (Likes y Comentarios)
   */
  getInteractions() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.INTERACTIONS) || '{}');
    } catch (e) {
      return {};
    }
  },

  async addInteraction(obraId, tipo, valor = '') {
    const interactions = this.getInteractions();
    if (!interactions[obraId]) {
      interactions[obraId] = { likes: 0, comentarios: [] };
    }

    if (tipo === 'like') {
      interactions[obraId].likes += 1;
    } else if (tipo === 'comentario' && valor) {
      interactions[obraId].comentarios.push(valor.toString());
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    return interactions[obraId];
  },

  /**
   * Obtiene el historial de compras filtrado por correo electrónico
   */
  async getPurchasesByEmail(email) {
    if (!email) return [];
    const emailNorm = email.trim().toLowerCase();

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((compras) => resolve(compras || []))
          .withFailureHandler((err) => reject(err))
          .obtenerComprasUsuario(emailNorm);
      });
    }

    try {
      const orders = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS) || '[]');
      const filtered = orders.filter((o) => o.emailCliente && o.emailCliente.toLowerCase() === emailNorm);
      
      // Ordenar por fecha y hora de emisión descendente
      filtered.sort((a, b) => (b.fechaEmision + ' ' + b.horaEmision).localeCompare(a.fechaEmision + ' ' + a.horaEmision));
      return filtered;
    } catch (e) {
      return [];
    }
  }
};
