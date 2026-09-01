/**
 * Vista de Inicio (Hero y Próximos Eventos Destacados)
 */
import { store } from '../state/store.js';
import { formatUSD, formatVES } from '../utils/helpers.js';
import { currencyService } from '../services/currencyService.js';

export function renderHomeView(onNavigate, onSelectShow) {
  const container = document.getElementById('contenedor-inicio-eventos');
  if (!container) return;

  const shows = store.getState().shows || [];
  const rate = currencyService.getRate();

  if (shows.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted">No hay eventos próximos registrados.</div>';
    return;
  }

  const featured = shows.slice(0, 3);
  container.innerHTML = featured
    .map((item) => {
      const precioUSD = formatUSD(item.precioUSD);
      const precioVES = formatVES(item.precioUSD, rate);
      const imgTag = item.imagen
        ? `<img src="${item.imagen}" class="img-cartelera" alt="${item.obra}">`
        : `<img src="assets/img/placeholder-poster.svg" class="img-cartelera" alt="${item.obra}">`;

      return `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            ${imgTag}
            <div class="cartelera-perforacion"></div>
            <div class="card-body d-flex flex-column">
              <div class="cartelera-cabecera mb-2">
                <div class="cartelera-titulos">
                  <h5 class="card-title">${item.obra}</h5>
                  <h6 class="text-muted">${item.funcion}</h6>
                </div>
                <div class="precio-ticket">
                  <div class="precio-usd">${precioUSD}</div>
                  <div class="precio-ves">${precioVES}</div>
                </div>
              </div>
              <span class="badge-genero mb-3">${item.genero} · ${item.sala}</span>
              <button class="btn btn-primary mt-auto w-100 btn-ver-detalle" data-id="${item.id}">Ver detalles</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Vincular eventos a botones
  container.querySelectorAll('.btn-ver-detalle').forEach((btn) => {
    btn.onclick = () => {
      const showId = btn.getAttribute('data-id');
      const show = shows.find((s) => s.id.toString() === showId.toString());
      if (show && onSelectShow) {
        onSelectShow(show);
      }
    };
  });
}
