/**
 * Componente para modales de aviso y confirmaciones teatrales
 */

export function showAlert(mensaje, tipo = 'info') {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-teatro-overlay');
    const modal = document.getElementById('modal-teatro');
    const icono = document.getElementById('modal-teatro-icono');
    const titulo = document.getElementById('modal-teatro-titulo');
    const msj = document.getElementById('modal-teatro-mensaje');
    const botones = document.getElementById('modal-teatro-botones');

    modal.className = 'modal-teatro' + (tipo === 'error' ? ' modal-error' : tipo === 'exito' ? ' modal-exito' : '');
    icono.innerText = tipo === 'error' ? '⚠️' : tipo === 'exito' ? '✅' : '🎭';
    titulo.innerText = tipo === 'error' ? 'Ocurrió un problema' : tipo === 'exito' ? 'Listo' : 'Aviso';
    msj.innerText = mensaje;
    botones.innerHTML = '<button class="btn btn-primary" id="modal-teatro-btn-ok">Aceptar</button>';

    overlay.classList.add('activo');

    document.getElementById('modal-teatro-btn-ok').onclick = () => {
      overlay.classList.remove('activo');
      resolve(true);
    };
  });
}

export function showConfirm(mensaje) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-teatro-overlay');
    const modal = document.getElementById('modal-teatro');
    const icono = document.getElementById('modal-teatro-icono');
    const titulo = document.getElementById('modal-teatro-titulo');
    const msj = document.getElementById('modal-teatro-mensaje');
    const botones = document.getElementById('modal-teatro-botones');

    modal.className = 'modal-teatro';
    icono.innerText = '❓';
    titulo.innerText = 'Confirmación';
    msj.innerText = mensaje;
    botones.innerHTML =
      '<button class="btn btn-secondary" id="modal-teatro-btn-cancelar">Cancelar</button>' +
      '<button class="btn btn-danger" id="modal-teatro-btn-confirmar">Confirmar</button>';

    overlay.classList.add('activo');

    document.getElementById('modal-teatro-btn-cancelar').onclick = () => {
      overlay.classList.remove('activo');
      resolve(false);
    };
    document.getElementById('modal-teatro-btn-confirmar').onclick = () => {
      overlay.classList.remove('activo');
      resolve(true);
    };
  });
}
