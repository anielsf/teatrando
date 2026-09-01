/**
 * Controlador de la Vista de Mi Cuenta (Auth, Perfil, Historial y Búsqueda de Invitado)
 */
import { store } from '../state/store.js';
import { authService } from '../services/authService.js';
import { apiService } from '../services/api.js';
import { showAlert } from '../components/modal.js';
import { formatUSD, formatVES } from '../utils/helpers.js';
import { isValidEmail } from '../utils/validators.js';
import { renderTicketModal } from '../components/ticketBadge.js';

export const accountView = {
  init(onNavigate) {
    this.onNavigate = onNavigate;
    this.bindEvents();
  },

  bindEvents() {
    // Formulario de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
      formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const res = await authService.login(email, password);
        if (res.success) {
          this.updateAccountUI();
          this.loadUserPurchases();
          this.onNavigate('vista-inicio');
        } else {
          showAlert(res.message, 'error');
        }
      };
    }

    // Formulario de Registro
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
      formRegistro.onsubmit = async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('reg-nombre').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        if (!isValidEmail(email)) {
          showAlert('Ingresa un correo electrónico válido.', 'error');
          return;
        }

        const res = await authService.register(nombre, email, password);
        if (res.success) {
          await showAlert('Cuenta creada exitosamente.', 'exito');
          this.updateAccountUI();
          this.loadUserPurchases();
          this.onNavigate('vista-inicio');
        } else {
          showAlert(res.message, 'error');
        }
      };
    }

    // Cerrar sesión
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
      btnCerrarSesion.onclick = () => {
        authService.logout();
        this.updateAccountUI();
        this.onNavigate('vista-mi-cuenta');
      };
    }

    // Búsqueda de tickets de invitado
    const btnBuscarInvitado = document.getElementById('btn-buscar-invitado');
    if (btnBuscarInvitado) {
      btnBuscarInvitado.onclick = () => this.searchGuestPurchases();
    }
  },

  updateAccountUI() {
    const user = authService.getCurrentUser();
    const bloqueAuth = document.getElementById('bloque-auth');
    const bloqueSesion = document.getElementById('bloque-sesion-usuario');
    const panelStats = document.getElementById('panel-estadisticas');
    const bloqueInvitado = document.getElementById('bloque-busqueda-invitado');

    if (user) {
      if (bloqueAuth) bloqueAuth.style.display = 'none';
      if (bloqueSesion) bloqueSesion.style.display = 'block';

      document.getElementById('user-display-name').innerText = user.nombre || 'Usuario';
      document.getElementById('user-display-email').innerText = `${user.email} | Rol: ${user.rol || 'Cliente'}`;

      if (panelStats) {
        panelStats.style.display = authService.isProducer() ? 'block' : 'none';
      }
      if (bloqueInvitado) {
        bloqueInvitado.style.display = authService.isAdmin() ? 'block' : 'none';
      }
    } else {
      if (bloqueAuth) bloqueAuth.style.display = 'block';
      if (bloqueSesion) bloqueSesion.style.display = 'none';
      if (panelStats) panelStats.style.display = 'none';
      if (bloqueInvitado) bloqueInvitado.style.display = 'none';
    }
  },

  async loadUserPurchases() {
    const user = authService.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('contenedor-historial-compras');
    if (!container) return;

    container.innerHTML = '<div class="spinner-border" style="color:var(--gold)"></div>';
    const purchases = await apiService.getPurchasesByEmail(user.email);
    container.innerHTML = this.buildPurchasesTable(purchases);
    this.bindViewTicketButtons(container, purchases);
  },

  async searchGuestPurchases() {
    const email = document.getElementById('lookup-email')?.value.trim();
    if (!isValidEmail(email)) {
      showAlert('Por favor ingresa un correo electrónico válido.');
      return;
    }

    const container = document.getElementById('contenedor-historial-invitado');
    if (!container) return;

    container.innerHTML = '<div class="spinner-border" style="color:var(--gold)"></div>';
    const purchases = await apiService.getPurchasesByEmail(email);
    container.innerHTML = this.buildPurchasesTable(purchases);
    this.bindViewTicketButtons(container, purchases);
  },

  buildPurchasesTable(purchases) {
    if (!purchases || purchases.length === 0) {
      return '<p class="text-muted">No se encontraron compras registradas para este correo.</p>';
    }

    let html = `
      <div class="table-responsive">
        <table class="table table-dark table-striped tabla-compras">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Obra / función</th>
              <th>Sala / butaca</th>
              <th>Fecha / hora</th>
              <th>Monto</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
    `;

    purchases.forEach((c, index) => {
      html += `
        <tr>
          <td><span class="compra-id">${c.ticketId}</span></td>
          <td><div class="compra-obra">${c.obra}</div><div class="compra-meta">${c.funcion}</div></td>
          <td><div>${c.sala}</div><div class="compra-meta">Butaca N.º ${c.asiento}</div></td>
          <td><div>${c.fechaFuncion}</div><div class="compra-meta">${c.horaFuncion}</div></td>
          <td><div class="compra-monto">${formatUSD(c.precioUSD)}</div><div class="compra-meta">Bs. ${c.precioVES.toFixed(2)}</div></td>
          <td><button class="btn btn-sm btn-outline-warning btn-rever-ticket" data-index="${index}">Ver boleto</button></td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    return html;
  },

  bindViewTicketButtons(container, purchases) {
    container.querySelectorAll('.btn-rever-ticket').forEach((btn) => {
      btn.onclick = () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        if (purchases[index]) {
          renderTicketModal(purchases[index], this.onNavigate);
        }
      };
    });
  }
};
