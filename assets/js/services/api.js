/**
 * Capa de integración con Supabase a través de funciones serverless de Vercel
 * Elimina toda dependencia de localStorage y PHP/XAMPP.
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

  async getCarteleras() {
    try {
      const res = await fetch('/api/carteleras');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          const processed = list.map((s) => ({
            ...s,
            precioUSD: parseFloat(s.precio_usd || s.precioUSD) || 0,
            imagen: this.normalizeImageUrl(s.imagen),
            director: s.director || 'Dirección General',
            duracionMin: s.duracion_min || s.duracionMin || 90,
            edadMinima: s.edad_minima || s.edadMinima || 'Todo público',
            likes: s.likes || 0,
            comentarios: Array.isArray(s.comentarios) ? s.comentarios.filter(c => c && c.id) : [],
            criticas: Array.isArray(s.criticas) ? s.criticas.filter(c => c && c.id).map(c => ({
              autor: c.nombre_autor || c.autor,
              texto: c.texto,
              estrellas: c.estrellas || 5,
              fecha: c.fecha ? String(c.fecha).split('T')[0] : ''
            })) : []
          }));
          store.setState({ shows: processed });
          return processed;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar carteleras desde API:', e.message);
    }
    const fallback = this._getFallbackShows();
    store.setState({ shows: fallback });
    return fallback;
  },

  async saveCartelera(obraData) {
    obraData.imagen = this.normalizeImageUrl(obraData.imagen || obraData.fotoURLActual || '');
    const res = await fetch('/api/carteleras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obraData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al guardar la obra');
    }
    await this.getCarteleras();
    return { success: true };
  },

  async deleteCartelera(id) {
    const res = await fetch(`/api/carteleras?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar la obra');
    }
    let shows = store.getState().shows || [];
    shows = shows.filter((s) => s.id.toString() !== id.toString());
    store.setState({ shows: [...shows] });
    return true;
  },

  async getTeatroInfo() {
    try {
      const res = await fetch('/api/teatros');
      if (res.ok) {
        const data = await res.json();
        if (data && data.teatro) return data;
      }
    } catch (e) {
      console.warn('No se pudo cargar info del teatro:', e.message);
    }
    return {
      teatro: CONFIG.TEATRO_DEFAULT,
      estadisticas: { ...CONFIG.TEATRO_DEFAULT.estadisticas }
    };
  },

  async addInteraccion(idObra, tipo, valor = '', estrellas = 5) {
    const user = store.getState().user;
    const nombreAutor = user ? user.nombre : 'Visitante';
    const rolAutor = user ? user.rol : CONFIG.ROLES.VISITOR;
    try {
      await fetch('/api/interacciones', {
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
    } catch (e) {
      console.warn('Error al guardar interacción:', e.message);
    }
    await this.getCarteleras();
    return true;
  },

  async getPurchasesByEmail(email) {
    if (!email) return [];
    const emailNorm = email.trim().toLowerCase();
    try {
      const res = await fetch(`/api/tickets?email=${encodeURIComponent(emailNorm)}`);
      if (res.ok) {
        const purchases = await res.json();
        if (Array.isArray(purchases)) {
          return purchases.map(t => ({
            ticketId: t.ticket_id,
            nombreCliente: t.nombre_cliente,
            emailCliente: t.email_cliente,
            obra: t.obra,
            funcion: t.funcion,
            sala: t.sala,
            asiento: t.asiento,
            fechaFuncion: t.fecha_funcion,
            horaFuncion: t.hora_funcion,
            precioUSD: parseFloat(t.precio_usd),
            precioVES: parseFloat(t.precio_ves),
            tasaBCV: parseFloat(t.tasa_bcv),
            refPago: t.ref_pago,
            fechaEmision: t.fecha_emision,
            horaEmision: t.hora_emision
          }));
        }
      }
    } catch (e) {
      console.warn('Error al cargar historial de compras:', e.message);
    }
    return [];
  },

  _getFallbackShows() {
    return [
      {
        id: 1, obra: 'Hamlet', funcion: 'Función de Gala', genero: 'Drama',
        sala: 'Sala Principal', director: 'Luis Arraiz', fecha: '2026-09-20',
        hora: '19:00', precioUSD: 15.00,
        sinopsis: 'La obra maestra de Shakespeare sobre venganza, traición y existencia humana.',
        reparto: 'Carlos Martínez, Ana González, Pedro Mora', imagen: '',
        duracionMin: 120, edadMinima: 'Todo público', likes: 0, comentarios: [],
        criticas: [{ autor: 'Armando Reverón (Crítica Cultural)',
          texto: 'Una propuesta estética sobresaliente con actuaciones de alto impacto escénico.',
          estrellas: 5, fecha: '2026-09-01' }]
      },
      {
        id: 2, obra: 'La Comedia de las Equivocaciones', funcion: 'Función Familiar',
        genero: 'Comedia', sala: 'Sala 7', director: 'María Escalona',
        fecha: '2026-09-21', hora: '17:00', precioUSD: 10.00,
        sinopsis: 'Una hilarante comedia de enredos con gemelos y confusiones imposibles.',
        reparto: 'Grupo Teatral Caracas', imagen: '', duracionMin: 90,
        edadMinima: 'Todo público', likes: 0, comentarios: [], criticas: []
      }
    ];
  }
};
