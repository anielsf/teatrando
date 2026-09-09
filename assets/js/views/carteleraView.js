/**
 * Vista de Cartelera: Catálogo, Filtros, Ficha de Detalle de Obra,
 * Información Institucional del Teatro, Estadísticas y Reseñas de Críticos VIP.
 */
import { store } from '../state/store.js';
import { apiService } from '../services/api.js';
import { authService } from '../services/authService.js';
import { formatUSD, formatVES } from '../utils/helpers.js';
import { currencyService } from '../services/currencyService.js';
import { showAlert } from '../components/modal.js';
import { openSubscriptionModal } from '../components/subscriptionModal.js';

export const carteleraView = {
  init(onNavigate, onSelectShow) {
    this.onNavigate = onNavigate;
    this.onSelectShow = onSelectShow;
    this.bindFilterEvents();
    this.renderTheaterInfoAndStats();
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
        (item.genero && item.genero.toLowerCase().includes(searchVal)) ||
        (item.sala && item.sala.toLowerCase().includes(searchVal)) ||
        (item.director && item.director.toLowerCase().includes(searchVal));

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
    this.renderTheaterInfoAndStats();
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

        // Contador de críticas oficiales
        const totalCriticas = (item.criticas || []).length;
        const badgeCriticas = totalCriticas > 0 
          ? `<span class="badge bg-warning text-dark me-2">🎖️ ${totalCriticas} Crítica${totalCriticas > 1 ? 's' : ''} Oficial</span>` 
          : '';

        return `
          <div class="col-md-4 mb-4">
            <div class="card h-100 card-obra-teatro">
              ${imgTag}
              <div class="cartelera-perforacion"></div>
              <div class="card-body d-flex flex-column">
                <div class="cartelera-cabecera mb-2">
                  <div class="cartelera-titulos">
                    <h5 class="card-title mb-1">${item.obra}</h5>
                    <h6 class="text-muted small">${item.funcion}</h6>
                  </div>
                  <div class="precio-ticket text-end">
                    <div class="precio-usd fw-bold">${precioUSD}</div>
                    <div class="precio-ves small text-warning">${precioVES}</div>
                  </div>
                </div>
                <div class="mb-2">
                  <span class="badge-genero">${item.genero} · ${item.sala}</span>
                  ${badgeCriticas}
                </div>
                <p class="card-text text-muted small mb-3 text-truncate-2">
                  ${item.sinopsis || 'Función estelar en el Teatro Municipal.'}
                </p>
                <div class="mt-auto d-flex gap-2">
                  <button class="btn btn-outline-primary w-50 btn-sm btn-detalle-cartelera" data-id="${item.id}">Ficha & Crítica</button>
                  <button class="btn btn-primary w-50 btn-sm btn-comprar-directo" data-id="${item.id}">Comprar</button>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Eventos de botones
    container.querySelectorAll('.btn-detalle-cartelera').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const show = shows.find((s) => s.id.toString() === id.toString());
        if (show) this.showDetail(show);
      };
    });

    container.querySelectorAll('.btn-comprar-directo').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const show = shows.find((s) => s.id.toString() === id.toString());
        if (show && this.onSelectShow) {
          this.onSelectShow(show);
        }
      };
    });
  },

  /**
   * Renderiza el apartado de Información del Teatro y Estadísticas
   */
  async renderTheaterInfoAndStats() {
    const container = document.getElementById('apartado-teatro-estadisticas');
    if (!container) return;

    const data = await apiService.getTeatroInfo();
    const t = data.teatro;
    const s = data.estadisticas;

    const serviciosList = Array.isArray(t.servicios) 
      ? t.servicios 
      : (t.servicios || '').split(',').map(item => item.trim()).filter(Boolean);

    const normasList = Array.isArray(t.normas) 
      ? t.normas 
      : (t.normas || '').split(',').map(item => item.trim()).filter(Boolean);

    container.innerHTML = `
      <div class="seccion-teatro-info my-4 p-4 rounded" style="background: #141414; border: 1px solid var(--line);">
        <div class="row align-items-center mb-4">
          <div class="col-md-8">
            <span class="badge bg-warning text-dark mb-2">🏛️ Sede Teatral Oficial</span>
            <h3 class="mb-1" style="color: var(--gold);">${t.nombre}</h3>
            <p class="text-muted mb-0"><i class="bi bi-geo-alt"></i> ${t.ubicacion} &nbsp;|&nbsp; 📞 ${t.telefono || '+58 212 555-8328'}</p>
          </div>
          <div class="col-md-4 text-md-end mt-3 mt-md-0">
            <button class="btn btn-outline-warning btn-sm" id="btn-ver-suscripciones-teatro">
              ⭐ Ver Membresías & Planes VIP
            </button>
          </div>
        </div>

        <!-- Dashboard de Estadísticas Teatrales -->
        <div class="row g-3 mb-4 text-center">
          <div class="col-6 col-md-3">
            <div class="p-3 rounded h-100" style="background: #1c1c1c; border: 1px solid #2a2a2a;">
              <div class="text-muted small text-uppercase">Aforo Oficial</div>
              <div class="fs-3 fw-bold text-light">${t.aforo} <span class="fs-6 text-muted">butacas</span></div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded h-100" style="background: #1c1c1c; border: 1px solid #2a2a2a;">
              <div class="text-muted small text-uppercase">Ocupación Promedio</div>
              <div class="fs-3 fw-bold text-success">${s.porcentajeOcupacion || 91.25}%</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded h-100" style="background: #1c1c1c; border: 1px solid #2a2a2a;">
              <div class="text-muted small text-uppercase">Entradas Vendidas</div>
              <div class="fs-3 fw-bold text-warning">${s.butacasVendidas || 5280}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 rounded h-100" style="background: #1c1c1c; border: 1px solid #2a2a2a;">
              <div class="text-muted small text-uppercase">Valoración Crítica</div>
              <div class="fs-3 fw-bold text-warning">⭐ ${s.calificacionCriticos || 4.94} / 5.0</div>
            </div>
          </div>
        </div>

        <!-- Pestañas de Historia, Servicios y Normas -->
        <div class="row g-4">
          <div class="col-md-6">
            <h5 class="titulo-seccion pb-2">Historia & Arquitectura</h5>
            <p class="text-muted small" style="line-height: 1.7;">
              ${t.historia || 'Templo de las artes escénicas de relevancia patrimonial.'}
            </p>
          </div>
          <div class="col-md-3">
            <h5 class="titulo-seccion pb-2">Servicios al Público</h5>
            <ul class="list-unstyled text-muted small">
              ${serviciosList.map(s => `<li class="mb-1">✓ ${s}</li>`).join('')}
            </ul>
          </div>
          <div class="col-md-3">
            <h5 class="titulo-seccion pb-2">Normas de Sala</h5>
            <ul class="list-unstyled text-muted small">
              ${normasList.map(n => `<li class="mb-1">⚠️ ${n}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    const btnSub = document.getElementById('btn-ver-suscripciones-teatro');
    if (btnSub) {
      btnSub.onclick = () => openSubscriptionModal();
    }
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

    // Ficha técnica extendida
    const fichaExtra = document.getElementById('detalle-ficha-tecnica');
    if (fichaExtra) {
      fichaExtra.innerHTML = `
        <div class="row g-2 p-2 rounded mb-3 small" style="background: #181818; border: 1px solid var(--line);">
          <div class="col-4"><strong>Dirección:</strong> ${show.director || 'Dirección General'}</div>
          <div class="col-4"><strong>Duración:</strong> ${show.duracionMin || 90} minutos</div>
          <div class="col-4"><strong>Clasificación:</strong> ${show.edadMinima || 'Todo público'}</div>
        </div>
      `;
    }

    // Renderizar críticas y comentarios
    this.renderCriticasDetalle(show);

    // Botón Comprar
    const btnComprar = document.getElementById('btn-iniciar-compra-detalle');
    if (btnComprar) {
      btnComprar.onclick = () => {
        if (this.onSelectShow) {
          this.onSelectShow(show);
        }
      };
    }

    if (this.onNavigate) this.onNavigate('vista-detalle-obra');
  },

  renderCriticasDetalle(show) {
    const contenedor = document.getElementById('contenedor-criticas-detalle');
    if (!contenedor) return;

    const criticas = show.criticas || [];
    const comentarios = show.comentarios || [];

    const user = store.getState().user;
    const isCritic = authService.isCritic();

    contenedor.innerHTML = `
      <div class="mt-4 pt-3 border-top" style="border-color: var(--line) !important;">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">Críticas y Reseñas Escénicas</h4>
          ${isCritic 
            ? '<span class="badge bg-warning text-dark">🎖️ Tienes credencial de Crítico Oficial</span>' 
            : ''}
        </div>

        <!-- Formulario de Reseña / Crítica -->
        <div class="card p-3 mb-4" style="background: #1a1a1a; border: 1px solid var(--line);">
          <label class="campo-label" for="input-texto-critica">
            ${isCritic ? 'Publicar Crítica Especializada (Pase de Prensa)' : 'Dejar un comentario o valoración'}
          </label>
          <div class="d-flex gap-2 mb-2 align-items-center">
            <span class="small text-muted">Puntuación:</span>
            <select id="select-estrellas-critica" class="form-select form-select-sm" style="width: 140px;">
              <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
              <option value="4">⭐⭐⭐⭐ (4/5)</option>
              <option value="3">⭐⭐⭐ (3/5)</option>
              <option value="2">⭐⭐ (2/5)</option>
              <option value="1">⭐ (1/5)</option>
            </select>
          </div>
          <textarea id="input-texto-critica" class="form-control mb-2" rows="2" placeholder="${
            isCritic ? 'Escribe tu crítica analítica de la obra…' : 'Comparte tu experiencia teatral…'
          }"></textarea>
          <div class="text-end">
            <button class="btn btn-sm ${isCritic ? 'btn-warning text-dark fw-bold' : 'btn-primary'}" id="btn-publicar-critica">
              ${isCritic ? '🎖️ Publicar Crítica Oficial' : 'Enviar Comentario'}
            </button>
          </div>
        </div>

        <!-- Listado de Críticas Oficiales Destacadas -->
        ${criticas.length > 0 ? `
          <h5 class="text-warning mb-3">🎖️ Críticas Oficiales y Prensa Teatral</h5>
          <div class="mb-4">
            ${criticas.map(c => `
              <div class="p-3 mb-3 rounded" style="background: rgba(212, 175, 55, 0.06); border-left: 4px solid var(--gold); border: 1px solid rgba(212, 175, 55, 0.2);">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <strong>${c.autor} <span class="badge bg-warning text-dark ms-1">Crítico VIP</span></strong>
                  <span class="text-warning">${'⭐'.repeat(c.estrellas || 5)}</span>
                </div>
                <p class="mb-1 text-light small" style="font-style: italic;">"${c.texto}"</p>
                <small class="text-muted">${c.fecha || ''}</small>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-muted small mb-4">Aún no hay críticas especializadas para esta obra.</p>'}

        <!-- Comentarios Generales -->
        ${comentarios.length > 0 ? `
          <h6 class="text-muted mb-3">Comentarios de Espectadores</h6>
          <div>
            ${comentarios.map(cm => `
              <div class="p-2 mb-2 rounded bg-dark border border-secondary small">
                <strong>${cm.autor || 'Espectador'}:</strong> ${typeof cm === 'string' ? cm : cm.texto}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Evento publicar reseña
    const btnPublicar = document.getElementById('btn-publicar-critica');
    if (btnPublicar) {
      btnPublicar.onclick = async () => {
        const texto = document.getElementById('input-texto-critica').value.trim();
        const estrellas = parseInt(document.getElementById('select-estrellas-critica').value, 10);

        if (!texto) {
          showAlert('Por favor ingresa un texto para tu reseña.', 'Texto requerido', '✍️');
          return;
        }

        if (!authService.isAuthenticated()) {
          showAlert('Para publicar una crítica o comentario, por favor inicia sesión o crea tu cuenta.', 'Acceso Requerido', '🔒');
          return;
        }

        const tipo = isCritic ? 'critica' : 'comentario';
        await apiService.addInteraccion(show.id, tipo, texto, estrellas);

        showAlert('¡Tu reseña ha sido registrada exitosamente!', 'Reseña Registrada', '🎭');
        
        // Recargar detalle con la nueva crítica
        const shows = store.getState().shows || [];
        const updatedShow = shows.find(s => s.id.toString() === show.id.toString()) || show;
        this.showDetail(updatedShow);
      };
    }
  }
};
