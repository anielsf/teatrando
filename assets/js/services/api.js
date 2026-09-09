/**
 * Capa de Integración y Servicios de Base de Datos para Teatrando
 * Conexión centralizada con MySQL (XAMPP / PHP) y fallback local.
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
   * Obtiene la lista de carteleras centralizada desde MySQL / Backend
   */
  async getCarteleras() {
    // 1. Intentar endpoint PHP / MySQL en XAMPP
    try {
      const res = await fetch('api/carteleras.php');
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

    // 2. Intentar endpoint serverless Vercel si existe
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

    // 3. Modo Local Fallback
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
      const itemInteractions = interactions[item.id] || { likes: 0, comentarios: [], criticas: [] };
      return {
        ...item,
        imagen: this.normalizeImageUrl(item.imagen),
        director: item.director || 'Dirección General',
        duracionMin: item.duracionMin || 90,
        edadMinima: item.edadMinima || 'Todo público',
        likes: itemInteractions.likes || item.likes || 0,
        comentarios: itemInteractions.comentarios || item.comentarios || [],
        criticas: itemInteractions.criticas || item.criticas || [
          {
            autor: 'Armando Reverón (Crítica Cultural)',
            rol: 'Crítico',
            texto: 'Una propuesta estética sobresaliente con actuaciones de alto impacto escénico.',
            estrellas: 5,
            esDestacada: true,
            fecha: '2026-09-01'
          }
        ]
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

    // 1. Enviar a backend PHP / MySQL (XAMPP)
    try {
      const res = await fetch('api/carteleras.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obraData)
      });
      if (res.ok) {
        await this.getCarteleras();
        return { success: true };
      }
    } catch (e) {}

    // 2. Local Storage fallback
    const shows = store.getState().shows || [];
    const index = shows.findIndex((s) => s.id.toString() === obraData.id.toString());
    if (index !== -1) {
      shows[index] = { ...shows[index], ...obraData };
    } else {
      shows.push({
        ...obraData,
        id: obraData.id || Date.now().toString(),
        likes: 0,
        comentarios: [],
        criticas: []
      });
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
      const res = await fetch(`api/carteleras.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await this.getCarteleras();
        return true;
      }
    } catch (e) {}

    let shows = store.getState().shows || [];
    shows = shows.filter((s) => s.id.toString() !== id.toString());
    localStorage.setItem(CONFIG.STORAGE_KEYS.SHOWS, JSON.stringify(shows));
    store.setState({ shows: [...shows] });
    return true;
  },

  /**
   * Obtiene la ficha informativa del teatro y sus estadísticas en vivo
   */
  async getTeatroInfo() {
    try {
      const res = await fetch('api/teatros.php');
      if (res.ok) {
        const data = await res.json();
        if (data && data.teatro) {
          return data;
        }
      }
    } catch (e) {}

    // Fallback local
    const orders = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS) || '[]');
    const totalVendidas = CONFIG.TEATRO_DEFAULT.estadisticas.butacasVendidas + orders.length;

    return {
      teatro: CONFIG.TEATRO_DEFAULT,
      estadisticas: {
        ...CONFIG.TEATRO_DEFAULT.estadisticas,
        butacasVendidas: totalVendidas,
        totalRecaudadoUSD: orders.reduce((sum, o) => sum + (parseFloat(o.precioUSD) || 0), 0)
      }
    };
  },

  /**
   * Registra like, comentario o crítica con distinción de roles
   */
  async addInteraccion(idObra, tipo, valor = '', estrellas = 5) {
    const user = store.getState().user;
    const nombreAutor = user ? user.nombre : 'Visitante';
    const rolAutor = user ? user.rol : CONFIG.ROLES.VISITOR;

    try {
      await fetch('api/interacciones.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_obra: idObra,
          id_usuario: user ? user.id : null,
          nombre_autor: nombreAutor,
          rol_autor: rolAutor,
          tipo,
          valor,
          estrellas
        })
      });
    } catch (e) {}

    // Actualizar local
    const interactions = this.getInteractions();
    if (!interactions[idObra]) {
      interactions[idObra] = { likes: 0, comentarios: [], criticas: [] };
    }

    if (tipo === 'like') {
      interactions[idObra].likes += 1;
    } else if (tipo === 'critica' || rolAutor === CONFIG.ROLES.CRITIC) {
      interactions[idObra].criticas.unshift({
        autor: nombreAutor,
        rol: rolAutor,
        texto: valor,
        estrellas,
        esDestacada: true,
        fecha: new Date().toISOString().split('T')[0]
      });
    } else if (tipo === 'comentario') {
      interactions[idObra].comentarios.unshift({
        autor: nombreAutor,
        texto: valor,
        fecha: new Date().toISOString().split('T')[0]
      });
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    await this.getCarteleras();
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
   * Obtiene el historial de compras por correo
   */
  async getPurchasesByEmail(email) {
    if (!email) return [];
    const emailNorm = email.trim().toLowerCase();

    try {
      const res = await fetch(`api/tickets.php?email=${encodeURIComponent(emailNorm)}`);
      if (res.ok) {
        const purchases = await res.json();
        if (Array.isArray(purchases) && purchases.length > 0) {
          return purchases;
        }
      }
    } catch (e) {}

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
