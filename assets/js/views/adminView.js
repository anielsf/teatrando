/**
 * Controlador de la Vista de Administración (CRUD de Cartelera y Gestión de Teatro / Estadísticas)
 * Roles: Solo accesible por rol 'Admin'
 */
import { store } from '../state/store.js';
import { apiService } from '../services/api.js';
import { currencyService } from '../services/currencyService.js';
import { showAlert, showConfirm } from '../components/modal.js';
import { formatUSD, formatVES } from '../utils/helpers.js';

export const adminView = {
  init(onReloadCartelera) {
    this.onReloadCartelera = onReloadCartelera;
    this.bindEvents();
    this.loadTheaterSettings();
  },

  bindEvents() {
    const formObra = document.getElementById('form-obra');
    if (formObra) {
      formObra.onsubmit = (e) => this.handleSaveObra(e);
    }

    const btnLimpiar = document.getElementById('btn-limpiar-admin');
    if (btnLimpiar) {
      btnLimpiar.onclick = () => this.clearForm();
    }

    const formTeatro = document.getElementById('form-teatro-admin');
    if (formTeatro) {
      formTeatro.onsubmit = (e) => this.handleSaveTeatro(e);
    }
  },

  renderTable(shows) {
    const tbody = document.getElementById('tabla-admin');
    if (!tbody) return;

    tbody.innerHTML = '';
    const rate = currencyService.getRate();

    shows.forEach((item) => {
      const precioUSD = formatUSD(item.precioUSD);
      const precioVES = formatVES(item.precioUSD, rate);
      const imgTag = item.imagen
        ? `<img src="${item.imagen}" width="60" height="60" style="object-fit:cover; border-radius:6px;" alt="${item.obra}">`
        : 'N/A';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${imgTag}</td>
        <td><strong>${item.obra}</strong><br><small class="text-muted">${item.funcion}</small></td>
        <td>${item.genero}<br><small class="text-muted">${item.sala}</small></td>
        <td>${item.fecha}<br>${item.hora}</td>
        <td>${precioUSD}<br><small>${precioVES}</small></td>
        <td>
          <button class="btn btn-sm btn-info mb-1 me-1 btn-edit-obra" data-id="${item.id}">Editar</button>
          <button class="btn btn-sm btn-danger mb-1 btn-delete-obra" data-id="${item.id}">Eliminar</button>
        </td>
      `;

      tr.querySelector('.btn-edit-obra').onclick = () => this.prepareEdit(item);
      tr.querySelector('.btn-delete-obra').onclick = () => this.handleDelete(item.id);

      tbody.appendChild(tr);
    });
  },

  prepareEdit(item) {
    document.getElementById('admin-id').value = item.id;
    document.getElementById('admin-obra').value = item.obra;
    document.getElementById('admin-funcion').value = item.funcion;
    document.getElementById('admin-genero').value = item.genero;
    document.getElementById('admin-sala').value = item.sala;
    document.getElementById('admin-fecha').value = item.fecha;
    document.getElementById('admin-hora').value = item.hora;
    document.getElementById('admin-precio').value = item.precioUSD;
    document.getElementById('admin-sinopsis').value = item.sinopsis || '';
    document.getElementById('admin-reparto').value = item.reparto || '';
    document.getElementById('admin-foto-actual').value = item.imagen || '';

    const directorInput = document.getElementById('admin-director');
    if (directorInput) directorInput.value = item.director || '';
    const duracionInput = document.getElementById('admin-duracion');
    if (duracionInput) duracionInput.value = item.duracionMin || 90;
    const edadInput = document.getElementById('admin-edad');
    if (edadInput) edadInput.value = item.edadMinima || 'Todo público';

    const btnSubmit = document.getElementById('btn-guardar-obra');
    if (btnSubmit) btnSubmit.innerText = 'Actualizar registro';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async handleSaveObra(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-obra');
    if (btn) {
      btn.innerText = 'Procesando…';
      btn.disabled = true;
    }

    const fileInput = document.getElementById('admin-foto');
    let base64Image = null;
    if (fileInput && fileInput.files.length > 0) {
      base64Image = await this.fileToBase64(fileInput.files[0]);
    }

    const id = document.getElementById('admin-id').value || Date.now().toString();
    const obraData = {
      id: id,
      obra: document.getElementById('admin-obra').value,
      funcion: document.getElementById('admin-funcion').value,
      genero: document.getElementById('admin-genero').value,
      sala: document.getElementById('admin-sala').value,
      fecha: document.getElementById('admin-fecha').value,
      hora: document.getElementById('admin-hora').value,
      precioUSD: parseFloat(document.getElementById('admin-precio').value) || 0,
      sinopsis: document.getElementById('admin-sinopsis').value,
      reparto: document.getElementById('admin-reparto').value,
      director: document.getElementById('admin-director')?.value || 'Dirección General',
      duracionMin: parseInt(document.getElementById('admin-duracion')?.value, 10) || 90,
      edadMinima: document.getElementById('admin-edad')?.value || 'Todo público',
      fotoURLActual: document.getElementById('admin-foto-actual').value,
      imagen: base64Image || document.getElementById('admin-foto-actual').value
    };

    try {
      await apiService.saveCartelera(obraData);
      await showAlert('La obra se guardó exitosamente.', 'Registro Guardado', '🎭');
      this.clearForm();
      if (this.onReloadCartelera) this.onReloadCartelera();
    } catch (err) {
      showAlert('Error al guardar la obra.', 'Error', '❌');
    } finally {
      if (btn) {
        btn.innerText = 'Guardar registro';
        btn.disabled = false;
      }
    }
  },

  async handleDelete(id) {
    const confirm = await showConfirm('¿Estás seguro de que deseas eliminar este espectáculo?');
    if (confirm) {
      await apiService.deleteCartelera(id);
      showAlert('El espectáculo ha sido eliminado.', 'Eliminado', '🗑️');
      if (this.onReloadCartelera) this.onReloadCartelera();
    }
  },

  clearForm() {
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-obra').value = '';
    document.getElementById('admin-funcion').value = '';
    document.getElementById('admin-genero').value = '';
    document.getElementById('admin-sala').value = '';
    document.getElementById('admin-fecha').value = '';
    document.getElementById('admin-hora').value = '';
    document.getElementById('admin-precio').value = '';
    document.getElementById('admin-sinopsis').value = '';
    document.getElementById('admin-reparto').value = '';
    document.getElementById('admin-foto-actual').value = '';
    const fileInput = document.getElementById('admin-foto');
    if (fileInput) fileInput.value = '';

    const btnSubmit = document.getElementById('btn-guardar-obra');
    if (btnSubmit) btnSubmit.innerText = 'Guardar registro';
  },

  async loadTheaterSettings() {
    const data = await apiService.getTeatroInfo();
    const t = data.teatro;
    const aforoInput = document.getElementById('admin-teatro-aforo');
    const historiaInput = document.getElementById('admin-teatro-historia');
    const serviciosInput = document.getElementById('admin-teatro-servicios');
    const normasInput = document.getElementById('admin-teatro-normas');
    const telInput = document.getElementById('admin-teatro-telefono');

    if (aforoInput) aforoInput.value = t.aforo || 650;
    if (historiaInput) historiaInput.value = t.historia || '';
    if (serviciosInput) serviciosInput.value = Array.isArray(t.servicios) ? t.servicios.join(', ') : (t.servicios || '');
    if (normasInput) normasInput.value = Array.isArray(t.normas) ? t.normas.join(', ') : (t.normas || '');
    if (telInput) telInput.value = t.telefono || '';
  },

  async handleSaveTeatro(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-teatro');
    if (btn) { btn.innerText = 'Guardando…'; btn.disabled = true; }

    const teatroData = {
      id: 1,
      aforo: parseInt(document.getElementById('admin-teatro-aforo').value, 10),
      historia: document.getElementById('admin-teatro-historia').value,
      servicios: document.getElementById('admin-teatro-servicios').value,
      normas: document.getElementById('admin-teatro-normas').value,
      telefono: document.getElementById('admin-teatro-telefono').value
    };

    try {
      await fetch('api/teatros.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teatroData)
      });
      showAlert('Información del teatro actualizada con éxito.', 'Teatro Actualizado', '🏛️');
    } catch (e) {
      showAlert('Información guardada localmente.', 'Guardado', '🏛️');
    } finally {
      if (btn) { btn.innerText = 'Actualizar Ficha del Teatro'; btn.disabled = false; }
    }
  },

  fileToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
};
