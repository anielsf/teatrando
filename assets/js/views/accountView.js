/**
 * Controlador de la Vista de Mi Cuenta (Auth, Perfil, Historial y Gestión de Suscripciones)
 * Roles: Visitante, Usuario, Crítico, Admin
 * Planes: Plan Básico (Gratis), Plan Bambalinas, Plan Crítico / VIP
 */
import { store } from '../state/store.js';
import { authService } from '../services/authService.js';
import { apiService } from '../services/api.js';
import { showAlert } from '../components/modal.js';
import { formatUSD, formatVES } from '../utils/helpers.js';
import { isValidEmail } from '../utils/validators.js';
import { renderTicketModal } from '../components/ticketBadge.js';
import { openSubscriptionModal } from '../components/subscriptionModal.js';
import { CONFIG } from '../config.js';

export const accountView = {
  init(onNavigate) {
    this.onNavigate = onNavigate;
    this.bindEvents();
    this.updateAccountUI();
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
          showAlert(`¡Bienvenido de vuelta, ${res.user.nombre}!`, 'Sesión Iniciada', '🎭');
          this.onNavigate('vista-inicio');
        } else {
          showAlert(res.message, 'Error de Acceso', '❌');
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
          showAlert('Ingresa un correo electrónico válido.', 'Correo Inválido', '⚠️');
          return;
        }

        const res = await authService.register(nombre, email, password);
        if (res.success) {
          await showAlert(`¡Cuenta creada con éxito! Rol asignado: ${res.user.rol}.`, 'Registro Exitoso', '🎟️');
          this.updateAccountUI();
          this.loadUserPurchases();
          this.onNavigate('vista-inicio');
        } else {
          showAlert(res.message, 'Error de Registro', '❌');
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

    // Botón Cambiar o Mejorar Plan
    const btnMejorarPlan = document.getElementById('btn-mejorar-plan-cuenta');
    if (btnMejorarPlan) {
      btnMejorarPlan.onclick = () => openSubscriptionModal();
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

      const rol = user.rol || CONFIG.ROLES.USER;
      const plan = user.plan || CONFIG.PLANS.BASIC;

      document.getElementById('user-display-name').innerHTML = `
        ${user.nombre || 'Usuario'} 
        <span class="badge ${rol === 'Admin' ? 'bg-danger' : (rol === 'Crítico' ? 'bg-warning text-dark' : 'bg-secondary')} ms-2">
          ${rol === 'Crítico' ? '🎖️ ' : ''}${rol}
        </span>
      `;

      document.getElementById('user-display-email').innerText = `${user.email}`;

      // Mostrar tarjeta de plan actual
      const planContainer = document.getElementById('user-display-plan-card');
      if (planContainer) {
        const planInfo = CONFIG.PLANS_CONFIG[plan] || CONFIG.PLANS_CONFIG['Plan Básico (Gratis)'];
        planContainer.innerHTML = `
          <div class="p-3 rounded mb-3 d-flex justify-content-between align-items-center" style="background: #181818; border: 1px solid var(--gold);">
            <div>
              <div class="small text-muted">Tu Membresía Actual:</div>
              <h5 class="mb-1" style="color: var(--gold);">${planInfo.icono} ${plan}</h5>
              <div class="small text-muted">${planInfo.beneficios[0]}</div>
            </div>
            <div>
              <button class="btn btn-outline-warning btn-sm" id="btn-cambiar-plan-directo">
                ⭐ Cambiar Plan
              </button>
            </div>
          </div>
        `;
        const btnChange = document.getElementById('btn-cambiar-plan-directo');
        if (btnChange) btnChange.onclick = () => openSubscriptionModal();
      }

      if (panelStats) {
        panelStats.style.display = authService.isAdmin() ? 'block' : 'none';
      }
      if (bloqueInvitado) {
        bloqueInvitado.style.display = authService.isAdmin() ? 'block' : 'none';
      }

      this.loadUserPurchases();
    } else {
      if (bloqueAuth) bloqueAuth.style.display = 'block';
      if (bloqueSesion) bloqueSesion.style.display = 'none';
      if (bloqueInvitado) bloqueInvitado.style.display = 'none';
    }
  },

  async loadUserPurchases() {
    const user = authService.getCurrentUser();
    if (!user) return;

    const container = document.getElementById('contenedor-historial-compras');
    if (!container) return;

    container.innerHTML = '<div class="spinner-border spinner-border-sm text-warning"></div> Buscando tus entradas…';

    const purchases = await apiService.getPurchasesByEmail(user.email);
    if (!purchases || purchases.length === 0) {
      container.innerHTML = '<p class="text-muted small">No se registran compras asociadas a esta cuenta.</p>';
      return;
    }

    container.innerHTML = `
      <div class="list-group">
        ${purchases.map(p => `
          <div class="list-group-item list-group-item-dark d-flex justify-content-between align-items-center mb-2 rounded border border-secondary">
            <div>
              <h6 class="mb-1">${p.obra}</h6>
              <small class="text-muted">${p.funcion} | Sala: ${p.sala} | Asiento: <strong>${p.asiento}</strong></small><br>
              <small class="text-muted">Fecha: ${p.fechaFuncion} ${p.horaFuncion} | Ref: ${p.refPago || 'N/A'}</small>
            </div>
            <div class="text-end">
              <span class="badge bg-success mb-1">$${parseFloat(p.precioUSD).toFixed(2)}</span><br>
              <button class="btn btn-outline-primary btn-sm btn-ver-ticket-historial" data-ticket='${JSON.stringify(p)}'>Ver Entrada</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-ver-ticket-historial').forEach(btn => {
      btn.onclick = () => {
        const ticketData = JSON.parse(btn.getAttribute('data-ticket'));
        renderTicketModal(ticketData, this.onNavigate);
      };
    });
  },

  async searchGuestPurchases() {
    const email = (document.getElementById('lookup-email')?.value || '').trim();
    const container = document.getElementById('contenedor-historial-invitado');
    if (!container) return;

    if (!email) {
      showAlert('Ingresa un correo para buscar boletos.', 'Correo Requerido', '⚠️');
      return;
    }

    container.innerHTML = '<div class="spinner-border spinner-border-sm text-warning"></div> Buscando registros…';

    const purchases = await apiService.getPurchasesByEmail(email);
    if (!purchases || purchases.length === 0) {
      container.innerHTML = `<p class="text-muted small">No se encontraron boletos para <strong>${email}</strong>.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="list-group">
        ${purchases.map(p => `
          <div class="list-group-item list-group-item-dark d-flex justify-content-between align-items-center mb-2 rounded border border-secondary">
            <div>
              <h6 class="mb-1">${p.obra} (${p.nombreCliente})</h6>
              <small class="text-muted">${p.funcion} | Asiento: <strong>${p.asiento}</strong></small><br>
              <small class="text-muted">Fecha: ${p.fechaFuncion} | Boleto: ${p.ticketId}</small>
            </div>
            <div>
              <button class="btn btn-outline-success btn-sm btn-ver-ticket-historial" data-ticket='${JSON.stringify(p)}'>Abrir Boleto</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-ver-ticket-historial').forEach(btn => {
      btn.onclick = () => {
        const ticketData = JSON.parse(btn.getAttribute('data-ticket'));
        renderTicketModal(ticketData, this.onNavigate);
      };
    });
  }
};
