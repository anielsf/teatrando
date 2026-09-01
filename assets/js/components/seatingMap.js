/**
 * Componente generador y gestor de la matriz interactiva de butacas
 */
import { store } from '../state/store.js';
import { CONFIG } from '../config.js';

export function renderSeatingMap(containerId, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  store.setState({ selectedSeat: null });

  const totalSeats = CONFIG.TOTAL_SEATS_PER_ROOM;

  for (let i = 1; i <= totalSeats; i++) {
    const btn = document.createElement('button');
    btn.className = 'btn asiento';
    btn.innerText = i;
    btn.setAttribute('aria-label', `Butaca número ${i}`);

    btn.onclick = (e) => {
      const asientos = container.querySelectorAll('.asiento');
      asientos.forEach((a) => a.classList.remove('seleccionado'));
      e.target.classList.add('seleccionado');
      store.setState({ selectedSeat: i.toString() });
      if (onSelect) onSelect(i.toString());
    };

    container.appendChild(btn);
  }
}
