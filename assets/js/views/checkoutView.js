/**
 * Controlador del Flujo de Compra / Checkout Wizard (5 Pasos)
 */
import { store } from '../state/store.js';
import { currencyService } from '../services/currencyService.js';
import { ticketService } from '../services/ticketService.js';
import { renderSeatingMap } from '../components/seatingMap.js';
import { createTicketHTML } from '../components/ticketBadge.js';
import { showAlert } from '../components/modal.js';
import { isValidEmail } from '../utils/validators.js';
import { formatUSD, formatVES } from '../utils/helpers.js';

export const checkoutView = {
  init(onNavigate) {
    this.onNavigate = onNavigate;
    this.bindEvents();
  },

  startCheckout(show) {
    store.setState({ currentShow: show, selectedSeat: null });
    renderSeatingMap('matriz-asientos', (seatNumber) => {
      store.setState({ selectedSeat: seatNumber });
    });
    this.onNavigate('vista-checkout-asientos');
  },

  bindEvents() {
    // Botón avanzar a resumen (Paso 1 -> Paso 2)
    const btnAvanzarResumen = document.getElementById('btn-avanzar-resumen');
    if (btnAvanzarResumen) {
      btnAvanzarResumen.onclick = () => this.goToSummary();
    }

    // Botón continuar a identificación (Paso 2 -> Paso 3)
    const btnAvanzarRegistro = document.getElementById('btn-avanzar-registro');
    if (btnAvanzarRegistro) {
      btnAvanzarRegistro.onclick = () => this.goToIdentification();
    }

    // Botón validar identificación e ir a pago (Paso 3 -> Paso 4)
    const btnValidarIdentificacion = document.getElementById('btn-validar-identificacion');
    if (btnValidarIdentificacion) {
      btnValidarIdentificacion.onclick = () => this.validateAndGoToPayment();
    }

    // Botón procesar pago (Paso 4 -> Paso 5)
    const btnProcesarPago = document.getElementById('btn-pagar');
    if (btnProcesarPago) {
      btnProcesarPago.onclick = () => this.processPayment();
    }

    // Botón finalizar compra
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
    if (btnFinalizarCompra) {
      btnFinalizarCompra.onclick = () => this.finishCheckout();
    }
  },

  goToSummary() {
    const { currentShow, selectedSeat } = store.getState();
    if (!selectedSeat) {
      showAlert('Por favor, selecciona una butaca antes de continuar.');
      return;
    }

    const rate = currencyService.getRate();
    const totalUSD = formatUSD(currentShow.precioUSD);
    const totalVES = formatVES(currentShow.precioUSD, rate);

    document.getElementById('resumen-obra').innerText = `${currentShow.obra} - ${currentShow.funcion}`;
    document.getElementById('resumen-sala').innerText = currentShow.sala;
    document.getElementById('resumen-asiento').innerText = `# ${selectedSeat}`;
    document.getElementById('resumen-fecha').innerText = `${currentShow.fecha} a las ${currentShow.hora}`;
    document.getElementById('resumen-total').innerText = `${totalUSD} (${totalVES})`;

    const user = store.getState().user;
    if (user) {
      const inputName = document.getElementById('checkout-nombre');
      const inputEmail = document.getElementById('checkout-email');
      if (inputName) inputName.value = user.nombre || '';
      if (inputEmail) inputEmail.value = user.email || '';
    }

    this.onNavigate('vista-checkout-resumen');
  },

  goToIdentification() {
    this.onNavigate('vista-checkout-registro');
  },

  validateAndGoToPayment() {
    const nombre = document.getElementById('checkout-nombre')?.value.trim();
    const email = document.getElementById('checkout-email')?.value.trim();

    if (!nombre) {
      showAlert('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!isValidEmail(email)) {
      showAlert('Por favor ingresa un correo electrónico válido.');
      return;
    }

    const refInput = document.getElementById('checkout-ref-pago');
    if (refInput) refInput.value = '';

    this.onNavigate('vista-checkout-pago');
  },

  async processPayment() {
    const refPago = document.getElementById('checkout-ref-pago')?.value.trim();
    if (!refPago) {
      showAlert('Por favor ingresa el número de referencia del pago móvil o transferencia.');
      return;
    }

    const btn = document.getElementById('btn-pagar');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Validando transacción…';
    }

    const { currentShow, selectedSeat, user } = store.getState();
    const nombre = document.getElementById('checkout-nombre')?.value.trim() || 'Cliente';
    const email = document.getElementById('checkout-email')?.value.trim() || 'sin_correo@dominio.com';
    const tasa = currencyService.getRate();
    const precioUSD = parseFloat(currentShow.precioUSD) || 0;
    const precioVES = currencyService.calculateVES(precioUSD);

    const payload = {
      userId: user ? user.id : 'INVITADO',
      nombreCliente: nombre,
      emailCliente: email,
      obra: currentShow.obra,
      funcion: currentShow.funcion,
      sala: currentShow.sala,
      asiento: selectedSeat,
      fecha: currentShow.fecha,
      hora: currentShow.hora,
      precioUSD: precioUSD,
      precioVES: precioVES,
      tasaBCV: tasa,
      refPago: refPago
    };

    try {
      const ticket = await ticketService.processPayment(payload);
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Procesar pago';
      }

      document.getElementById('contenido-ticket').innerHTML = createTicketHTML(ticket);
      this.onNavigate('vista-checkout-confirmacion');
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Procesar pago';
      }
      showAlert(`No se pudo procesar el pago: ${err.message || err}`, 'error');
    }
  },

  finishCheckout() {
    store.setState({ currentShow: null, selectedSeat: null });
    const refInput = document.getElementById('checkout-ref-pago');
    if (refInput) refInput.value = '';
    this.onNavigate('vista-inicio');
  }
};
