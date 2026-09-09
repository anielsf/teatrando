/**
 * Componente: Modal de Suscripciones y Pagos de Planes Teatrales
 * Planes: Plan Básico (Gratis), Plan Bambalinas, Plan Crítico / VIP
 */
import { CONFIG } from '../config.js';
import { store } from '../state/store.js';
import { authService } from '../services/authService.js';
import { currencyService } from '../services/currencyService.js';
import { showAlert } from './modal.js';

let modalContainer = null;

export function initSubscriptionModal() {
  if (document.getElementById('modal-suscripcion-container')) return;

  modalContainer = document.createElement('div');
  modalContainer.id = 'modal-suscripcion-container';
  modalContainer.innerHTML = `
    <div id="modal-sub-overlay" class="modal-sub-overlay" style="display: none;">
      <div class="modal-sub-content">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0 modal-sub-titulo">⭐ Planes de Suscripción Teatral</h3>
          <button type="button" class="btn-close-sub" id="btn-cerrar-modal-sub">&times;</button>
        </div>
        <p class="text-muted small">Elige tu membresía y disfruta de beneficios exclusivos, cero comisiones o credenciales oficiales de crítica escénica.</p>
        
        <!-- Tarjetas de Planes -->
        <div class="row g-3 my-2" id="grid-planes-sub"></div>

        <!-- Sección de Pago Dinámica -->
        <div id="seccion-pago-sub" class="mt-4 p-3 rounded" style="display: none; background: rgba(212, 175, 55, 0.08); border: 1px solid var(--gold);">
          <h5 class="mb-2" id="sub-pago-titulo">Confirmar Suscripción</h5>
          <p class="small text-muted mb-3" id="sub-pago-detalle"></p>

          <div class="row g-2 align-items-end">
            <div class="col-md-7">
              <label class="campo-label" for="sub-ref-pago">Referencia de Pago Móvil / Transferencia</label>
              <input type="text" id="sub-ref-pago" class="form-control" placeholder="Ej: 87654321" required>
            </div>
            <div class="col-md-5">
              <button class="btn btn-success w-100" id="btn-confirmar-pago-sub">Pagar y Activar Plan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  document.getElementById('btn-cerrar-modal-sub').onclick = closeSubscriptionModal;
  document.getElementById('modal-sub-overlay').onclick = (e) => {
    if (e.target.id === 'modal-sub-overlay') closeSubscriptionModal();
  };
}

export function openSubscriptionModal(preselectedPlan = null) {
  initSubscriptionModal();
  const overlay = document.getElementById('modal-sub-overlay');
  const grid = document.getElementById('grid-planes-sub');
  const seccionPago = document.getElementById('seccion-pago-sub');
  if (seccionPago) seccionPago.style.display = 'none';

  const user = store.getState().user;
  const currentPlan = user ? (user.plan || CONFIG.PLANS.BASIC) : null;
  const tasa = currencyService.getRate();

  grid.innerHTML = Object.entries(CONFIG.PLANS_CONFIG).map(([nombrePlan, info]) => {
    const isCurrent = currentPlan === nombrePlan;
    const precioVES = (info.precioUSD * tasa).toFixed(2);
    const precioTexto = info.precioUSD === 0 
      ? 'Gratis' 
      : `$${info.precioUSD.toFixed(2)} <span class="small text-muted">/mes</span> <div class="fs-6 text-warning mt-1">Bs. ${precioVES}</div>`;

    return `
      <div class="col-md-4">
        <div class="card-plan h-100 p-3 rounded d-flex flex-column justify-content-between ${isCurrent ? 'plan-actual' : ''}" style="border: 2px solid ${isCurrent ? 'var(--gold)' : 'var(--line)'}; background: #161616;">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fs-4">${info.icono}</span>
              ${isCurrent ? '<span class="badge bg-warning text-dark">Tu Plan Actual</span>' : ''}
            </div>
            <h5 class="mb-1" style="color: ${info.color};">${nombrePlan}</h5>
            <div class="fs-4 fw-bold mb-3">${precioTexto}</div>
            <ul class="list-unstyled small mb-3">
              ${info.beneficios.map(b => `<li class="mb-2">✓ ${b}</li>`).join('')}
            </ul>
          </div>
          <div>
            ${isCurrent 
              ? '<button class="btn btn-outline-secondary w-100 btn-sm" disabled>Activo</button>' 
              : `<button class="btn btn-primary w-100 btn-sm btn-elegir-plan" data-plan="${nombrePlan}" data-usd="${info.precioUSD}">
                  ${info.precioUSD === 0 ? 'Seleccionar Básico' : 'Suscribirme Ahora'}
                </button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Eventos de selección de plan
  grid.querySelectorAll('.btn-elegir-plan').forEach(btn => {
    btn.onclick = () => {
      const plan = btn.getAttribute('data-plan');
      const usd = parseFloat(btn.getAttribute('data-usd'));

      if (!authService.isAuthenticated()) {
        showAlert('Para suscribirte a un plan, por favor inicia sesión o crea tu cuenta.', 'Acceso Requerido', '🔒');
        closeSubscriptionModal();
        const tabCuenta = document.querySelector('[data-navigate="vista-mi-cuenta"]');
        if (tabCuenta) tabCuenta.click();
        return;
      }

      if (usd === 0) {
        authService.upgradePlan(plan, 'GRATIS-000', 0, 0, tasa).then(() => {
          showAlert(`¡Has seleccionado el ${plan}!`, 'Plan Actualizado', '🎟️');
          closeSubscriptionModal();
        });
        return;
      }

      // Mostrar pasarela de pago para planes de pago
      const precioVES = (usd * tasa).toFixed(2);
      document.getElementById('sub-pago-titulo').innerText = `Pago de ${plan}`;
      document.getElementById('sub-pago-detalle').innerHTML = `
        Monto a pagar: <strong>$${usd.toFixed(2)} USD</strong> (Tasa Oficial BCV: Bs. ${tasa.toFixed(2)}) = <strong class="text-warning">Bs. ${precioVES}</strong>.<br>
        Realiza tu pago móvil a: <strong>0102 · C.I. 12.345.678 · Tel: 0414-1234567</strong> e ingresa el número de referencia.
      `;
      seccionPago.style.display = 'block';

      document.getElementById('btn-confirmar-pago-sub').onclick = async () => {
        const ref = document.getElementById('sub-ref-pago').value.trim();
        if (!ref) {
          showAlert('Por favor ingresa el número de referencia del pago móvil.', 'Referencia Requerida', '⚠️');
          return;
        }

        const btnPagar = document.getElementById('btn-confirmar-pago-sub');
        btnPagar.disabled = true;
        btnPagar.innerText = 'Procesando suscripción…';

        await authService.upgradePlan(plan, ref, usd, parseFloat(precioVES), tasa);

        showAlert(
          `¡Felicidades! Tu ${plan} ha sido activado exitosamente.<br>Referencia registrada: <strong>${ref}</strong>.`,
          '¡Suscripción Exitosa!',
          '🎉'
        );

        btnPagar.disabled = false;
        btnPagar.innerText = 'Pagar y Activar Plan';
        closeSubscriptionModal();
      };
    };
  });

  overlay.style.display = 'flex';
}

export function closeSubscriptionModal() {
  const overlay = document.getElementById('modal-sub-overlay');
  if (overlay) overlay.style.display = 'none';
}
