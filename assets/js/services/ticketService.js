/**
 * Servicio de Procesamiento de Pagos y Emisión de Boletos
 * Traduce la función procesarPagoYGenerarTicket y obtenerComprasUsuario
 */
import { CONFIG } from '../config.js';

export const ticketService = {
  saveLastTicket(ticket) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_TICKET, JSON.stringify(ticket));
    } catch (e) {
      console.warn('Error al guardar el ticket localmente:', e);
    }
  },

  getLastTicket() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_TICKET);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  async processPayment(datosReserva) {
    if (!datosReserva) {
      throw new Error('Los datos de la reserva no fueron recibidos correctamente.');
    }

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((ticket) => {
            this.saveLastTicket(ticket);
            resolve(ticket);
          })
          .withFailureHandler((err) => reject(err))
          .procesarPagoYGenerarTicket(datosReserva);
      });
    }

    // Modo local / Base de datos persistente en localStorage
    const now = new Date();
    const ticketId = 'TCK-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    const fechaStr = now.toISOString().split('T')[0];
    const horaStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const precioUSD = parseFloat(datosReserva.precioUSD) || 0;
    const tasaBCV = parseFloat(datosReserva.tasaBCV) || 1;
    const precioVES = parseFloat((precioUSD * tasaBCV).toFixed(2));

    const ticket = {
      ticketId: ticketId,
      userId: datosReserva.userId || 'INVITADO',
      nombreCliente: datosReserva.nombreCliente || 'Cliente',
      emailCliente: (datosReserva.emailCliente || 'sin_correo@dominio.com').trim().toLowerCase(),
      obra: datosReserva.obra || 'N/A',
      funcion: datosReserva.funcion || 'N/A',
      sala: datosReserva.sala || 'N/A',
      asiento: datosReserva.asiento || 'N/A',
      fechaFuncion: datosReserva.fecha || '',
      horaFuncion: datosReserva.hora || '',
      precioUSD: precioUSD,
      precioVES: precioVES,
      tasaBCV: tasaBCV,
      refPago: datosReserva.refPago || 'N/A',
      fechaEmision: fechaStr,
      horaEmision: horaStr
    };

    try {
      const orders = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS) || '[]');
      orders.unshift(ticket);
      localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Error al persistir orden en localStorage:', e);
    }

    this.saveLastTicket(ticket);
    return ticket;
  }
};
