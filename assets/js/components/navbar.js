/**
 * Componente de barra de navegación dinámico según estado y roles
 */
import { store } from '../state/store.js';
import { authService } from '../services/authService.js';
import { currencyService } from '../services/currencyService.js';
import { ticketService } from '../services/ticketService.js';
import { showAlert } from './modal.js';
import { renderTicketModal } from './ticketBadge.js';

export function initNavbar(onNavigate) {
  const navElement = document.getElementById('navbar-principal');
  const tasaBadge = document.getElementById('indicador-tasa');
  const btnAdmin = document.getElementById('btn-nav-admin');

  // Actualizar tasa
  const updateRate = () => {
    const rate = currencyService.getRate();
    if (tasaBadge && rate > 0) {
      tasaBadge.innerText = `Tasa BCV: Bs. ${rate.toFixed(2)}`;
    }
  };

  // Reaccionar a cambios en el usuario
  store.subscribe((state) => {
    updateRate();
    if (navElement) {
      navElement.style.display = state.user ? 'block' : 'none';
    }

    if (btnAdmin) {
      btnAdmin.style.display = authService.isAdmin() ? 'inline-block' : 'none';
    }
  });

  // Botón Última Entrada
  const btnUltimaEntrada = document.getElementById('btn-nav-ultima-entrada');
  if (btnUltimaEntrada) {
    btnUltimaEntrada.onclick = () => {
      const ticket = ticketService.getLastTicket();
      if (!ticket) {
        showAlert('Aún no hay ninguna entrada comprada en este navegador. Puedes consultar tus entradas por correo en "Mi cuenta".');
        return;
      }
      renderTicketModal(ticket, onNavigate);
    };
  }

  updateRate();
}
