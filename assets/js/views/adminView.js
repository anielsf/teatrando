/**
 * Controlador de la Vista de Administración / Productor (CRUD de Obras y Funciones)
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
      imagen: base64Image || document.getElementById('admin-foto-actual').value || ''
    };

    try {
      await apiService.saveCartelera(obraData);
      this.clearForm();
      if (this.onReloadCartelera) await this.onReloadCartelera();
      showAlert('Registro guardado exitosamente.', 'exito');
    } catch (err) {
      showAlert(`Ocurrió un error al guardar: ${err.message || err}`, 'error');
    } finally {
      if (btn) {
        btn.innerText = 'Guardar registro';
        btn.disabled = false;
      }
    }
  },

  async handleDelete(id) {
    const confirmed = await showConfirm('¿Confirma la eliminación de este espectáculo del catálogo?');
    if (confirmed) {
      await apiService.deleteCartelera(id);
      if (this.onReloadCartelera) await this.onReloadCartelera();
      showAlert('Espectáculo eliminado correctamente.', 'exito');
    }
  },

  clearForm() {
    const form = document.getElementById('form-obra');
    if (form) form.reset();
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-foto-actual').value = '';
    const btn = document.getElementById('btn-guardar-obra');
    if (btn) {
      btn.innerText = 'Guardar registro';
      btn.disabled = false;
    }
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
};
