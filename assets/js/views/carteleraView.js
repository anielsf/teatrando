/**
 * Vista de Cartelera: Catálogo, Filtros y Ficha de Detalle de Obra
 */
import { store } from '../state/store.js';
import { formatUSD, formatVES } from '../utils/helpers.js';
import { currencyService } from '../services/currencyService.js';

export const carteleraView = {
  init(onNavigate, onSelectShow) {
    this.onNavigate = onNavigate;
    this.onSelectShow = onSelectShow;
    this.bindFilterEvents();
  },

  bindFilterEvents() {
    const inputSearch = document.getElementById('input-busqueda-rapida');
    const fGenero = document.getElementById('filtro-genero');
    const fSala = document.getElementById('filtro-sala');
    const fFecha = document.getElementById('filtro-fecha');
    const fPrecio = document.getElementById('filtro-precio');

    const handleFilter = () => this.filterCartelera();

    if (inputSearch) inputSearch.addEventListener('keyup', handleFilter);
    if (fGenero) fGenero.addEventListener('change', handleFilter);
    if (fSala) fSala.addEventListener('change', handleFilter);
    if (fFecha) fFecha.addEventListener('change', handleFilter);
    if (fPrecio) fPrecio.addEventListener('change', handleFilter);
  },

  populateFilterSelectors(shows) {
    const generos = [...new Set(shows.map((s) => s.genero).filter(Boolean))];
    const salas = [...new Set(shows.map((s) => s.sala).filter(Boolean))];

    const selectGenero = document.getElementById('filtro-genero');
    if (selectGenero) {
      selectGenero.innerHTML = '<option value="">Todos los géneros</option>' +
        generos.map((g) => `<option value="${g}">${g}</option>`).join('');
    }

    const selectSala = document.getElementById('filtro-sala');
    if (selectSala) {
      selectSala.innerHTML = '<option value="">Todas las salas</option>' +
        salas.map((s) => `<option value="${s}">${s}</option>`).join('');
    }
  },

  filterCartelera() {
    const shows = store.getState().shows || [];
    const searchVal = (document.getElementById('input-busqueda-rapida')?.value || '').toLowerCase();
    const generoVal = document.getElementById('filtro-genero')?.value || '';
    const salaVal = document.getElementById('filtro-sala')?.value || '';
    const fechaVal = document.getElementById('filtro-fecha')?.value || '';
    const precioVal = document.getElementById('filtro-precio')?.value || '';

    const filtered = shows.filter((item) => {
      const matchSearch =
        !searchVal ||
        item.obra.toLowerCase().includes(searchVal) ||
        item.genero.toLowerCase().includes(searchVal) ||
        item.sala.toLowerCase().includes(searchVal);

      const matchGenero = !generoVal || item.genero === generoVal;
      const matchSala = !salaVal || item.sala === salaVal;
      const matchFecha = !fechaVal || item.fecha === fechaVal;

      let matchPrecio = true;
      if (precioVal) {
        const [min, max] = precioVal.split('-').map(parseFloat);
        matchPrecio = item.precioUSD >= min && item.precioUSD <= max;
      }

      return matchSearch && matchGenero && matchSala && matchFecha && matchPrecio;
    });

    this.renderCards(filtered);
  },

  renderCartelera(shows) {
    this.populateFilterSelectors(shows);
    this.renderCards(shows);
  },

  renderCards(shows) {
    const container = document.getElementById('contenedor-carteleras');
    if (!container) return;

    if (!shows || shows.length === 0) {
      container.innerHTML = '<div class="col-12 text-center mt-4"><h4>No se encontraron eventos con los filtros seleccionados.</h4></div>';
      return;
    }

    const rate = currencyService.getRate();

    container.innerHTML = shows
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
                <button class="btn btn-primary mt-auto w-100 btn-detalle-cartelera" data-id="${item.id}">Ver detalles</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.btn-detalle-cartelera').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const show = shows.find((s) => s.id.toString() === id.toString());
        if (show && this.onSelectShow) {
          this.onSelectShow(show);
        }
      };
    });
  },

  showDetail(show) {
    store.setState({ currentShow: show });
    const rate = currencyService.getRate();

    const imgEl = document.getElementById('detalle-img');
    if (imgEl) {
      imgEl.src = show.imagen || 'assets/img/placeholder-poster.svg';
    }

    document.getElementById('detalle-titulo').innerText = show.obra;
    document.getElementById('detalle-funcion').innerText = show.funcion;
    document.getElementById('detalle-genero').innerText = show.genero;
    document.getElementById('detalle-sala').innerText = show.sala;
    document.getElementById('detalle-sinopsis').innerText = show.sinopsis || 'Sin información registrada.';
    document.getElementById('detalle-reparto').innerText = show.reparto || 'Sin información registrada.';
    document.getElementById('detalle-fecha').innerText = show.fecha;
    document.getElementById('detalle-hora').innerText = show.hora;
    document.getElementById('detalle-precio').innerText = `${formatUSD(show.precioUSD)} / ${formatVES(show.precioUSD, rate)}`;

    if (this.onNavigate) this.onNavigate('vista-detalle-obra');
  }
};
