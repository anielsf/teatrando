/**
 * Componente de barra de navegación dinámico según estado, roles y suscripciones
 * Roles: Visitante, Usuario, Crítico, Admin
 */
import { store } from '../state/store.js';
import { authService } from '../services/authService.js';
import { currencyService } from '../services/currencyService.js';
import { ticketService } from '../services/ticketService.js';
import { showAlert } from './modal.js';
import { renderTicketModal } from './ticketBadge.js';
import { openSubscriptionModal } from './subscriptionModal.js';

export function initNavbar(onNavigate) {
  const navElement = document.getElementById('navbar-principal');
  const tasaBadge = document.getElementById('indicador-tasa');
  const btnAdmin = document.getElementById('btn-nav-admin');
  const badgeUsuario = document.getElementById('badge-usuario-rol');
  const btnSub = document.getElementById('btn-nav-suscripcion');

  // Actualizar tasa
  const updateRate = () => {
    const rate = currencyService.getRate();
    if (tasaBadge && rate > 0) {
      tasaBadge.innerText = `Tasa BCV: Bs. ${rate.toFixed(2)}`;
    }
  };

  // Reaccionar a cambios en el usuario y estado
  store.subscribe((state) => {
    updateRate();
    if (navElement) {
      navElement.style.display = 'block'; // Siempre visible para navegación de visitantes
    }

    if (btnAdmin) {
      btnAdmin.style.display = authService.isAdmin() ? 'inline-block' : 'none';
    }

    if (badgeUsuario) {
      if (state.user) {
        const rol = state.user.rol || 'Usuario';
        const plan = state.user.plan || 'Plan Básico (Gratis)';
        badgeUsuario.innerHTML = `
          <span class="badge ${rol === 'Admin' ? 'bg-danger' : (rol === 'Crítico' ? 'bg-warning text-dark' : 'bg-secondary')}">
            ${rol === 'Crítico' ? '🎖️ ' : ''}${rol} · ${plan.replace('Plan ', '')}
          </span>
        `;
        badgeUsuario.style.display = 'inline-block';
      } else {
        badgeUsuario.innerHTML = `<span class="badge bg-dark border text-muted">Visitante</span>`;
        badgeUsuario.style.display = 'inline-block';
      }
    }
  });

  // Botón Suscripciones
  if (btnSub) {
    btnSub.onclick = () => openSubscriptionModal();
  }

  // Botón Última Entrada
  const btnUltimaEntrada = document.getElementById('btn-nav-ultima-entrada');
  if (btnUltimaEntrada) {
    btnUltimaEntrada.onclick = () => {
      const ticket = ticketService.getLastTicket();
      if (!ticket) {
        showAlert('Aún no hay ninguna entrada comprada en este navegador. Puedes consultar tus entradas por correo en "Mi cuenta".', 'Sin boletos', '🎟️');
        return;
      }
      renderTicketModal(ticket, onNavigate);
    };
  }

  updateRate();
}
