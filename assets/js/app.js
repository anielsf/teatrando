/**
 * Punto de entrada principal de la aplicación SPA Teatrando
 */
import { store } from './state/store.js';
import { authService } from './services/authService.js';
import { currencyService } from './services/currencyService.js';
import { apiService } from './services/api.js';

import { initNavbar } from './components/navbar.js';
import { renderHomeView } from './views/homeView.js';
import { carteleraView } from './views/carteleraView.js';
import { checkoutView } from './views/checkoutView.js';
import { accountView } from './views/accountView.js';
import { adminView } from './views/adminView.js';

class App {
  constructor() {
    this.navigate = this.navigate.bind(this);
    this.handleSelectShow = this.handleSelectShow.bind(this);
    this.reloadCartelera = this.reloadCartelera.bind(this);
  }

  async init() {
    // 1. Inicializar sesión de usuario guardada
    authService.initSession();

    // 2. Inicializar componentes de interfaz
    initNavbar(this.navigate);
    this.bindGlobalNavigation();

    // 3. Inicializar controladores de vistas
    carteleraView.init(this.navigate, this.handleSelectShow);
    checkoutView.init(this.navigate);
    accountView.init(this.navigate);
    adminView.init(this.reloadCartelera);

    // 4. Cargar tasa de cambio y catálogo de obras
    await currencyService.fetchExchangeRate();
    await this.reloadCartelera();

    // 5. Determinar vista inicial (Inicio como punto de partida para todos, incluidos Visitantes)
    if (currentUser) {
      accountView.updateAccountUI();
      accountView.loadUserPurchases();
    }
    this.navigate('vista-inicio');
  }

  navigate(viewId) {
    const vistas = document.querySelectorAll('.vista');
    vistas.forEach((v) => v.classList.remove('activa'));

    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('activa');
      store.setState({ activeView: viewId });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  handleSelectShow(show) {
    carteleraView.showDetail(show);
  }

  async reloadCartelera() {
    const shows = await apiService.getCarteleras();
    renderHomeView(this.navigate, this.handleSelectShow);
    carteleraView.renderCartelera(shows);
    adminView.renderTable(shows);
  }

  bindGlobalNavigation() {
    // Enlaces de navegación global
    document.querySelectorAll('[data-navigate]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = el.getAttribute('data-navigate');
        if (targetView) this.navigate(targetView);
      });
    });

    // Botón iniciar selección de butacas desde el detalle
    const btnComprarDetalle = document.getElementById('btn-iniciar-compra-detalle');
    if (btnComprarDetalle) {
      btnComprarDetalle.onclick = () => {
        const { currentShow } = store.getState();
        if (currentShow) {
          checkoutView.startCheckout(currentShow);
        }
      };
    }

    // Alternar sub-vistas de autenticación
    window.cambiarVistaAuth = (idVista) => {
      document.querySelectorAll('.vista-auth').forEach((el) => (el.style.display = 'none'));
      const target = document.getElementById(idVista);
      if (target) target.style.display = 'block';
    };

    // Funciones globales expuestas para interactividad
    window.cambiarVista = this.navigate;
  }
}

// Inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
