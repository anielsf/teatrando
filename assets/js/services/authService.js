/**
 * Servicio de Autenticación, Gestión de Sesiones, Roles y Planes
 * Conecta con Vercel Postgres (/api/auth) o almacenamiento local.
 */
import { CONFIG } from '../config.js';
import { store } from '../state/store.js';

export const authService = {
  normalizeEmail(email) {
    return (email || '').toString().trim().toLowerCase();
  },

  initSession() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION);
      if (saved) {
        const user = JSON.parse(saved);
        store.setState({ user });
        return user;
      }
    } catch (e) {
      console.error('Error al recuperar sesión:', e);
      this.logout();
    }
    return null;
  },

  async login(email, password) {
    const emailNorm = this.normalizeEmail(email);

    // 1. Intentar Vercel Postgres API
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: emailNorm, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.usuario) {
          this.setSession(data.usuario);
          return { success: true, user: data.usuario };
        }
      }
    } catch (e) {}

    // 2. Intentar Apps Script
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler((res) => {
            if (res.success && res.usuario) {
              this.setSession(res.usuario);
              resolve({ success: true, user: res.usuario });
            } else {
              resolve({ success: false, message: res.mensaje || 'Credenciales inválidas.' });
            }
          })
          .withFailureHandler((err) => resolve({ success: false, message: err.message }))
          .autenticarUsuario(emailNorm, password);
      });
    }

    // 3. Modo Local fallback
    const users = this.getLocalUsers();
    const found = users.find((u) => u.email === emailNorm && u.password === password);

    if (found) {
      const userSession = {
        id: found.id,
        nombre: found.nombre,
        email: found.email,
        rol: found.rol || CONFIG.ROLES.CONSUMER,
        plan: found.plan || CONFIG.PLANS.FREE
      };
      this.setSession(userSession);
      return { success: true, user: userSession };
    }

    return { success: false, message: 'Credenciales inválidas.' };
  },

  async register(nombre, email, password) {
    const emailNorm = this.normalizeEmail(email);
    const nombreLimpio = (nombre || '').toString().trim();

    // 1. Intentar Vercel Postgres API
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', nombre: nombreLimpio, email: emailNorm, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.usuario) {
          this.setSession(data.usuario);
          return { success: true, user: data.usuario };
        } else {
          return { success: false, message: data.message || 'Error en registro' };
        }
      }
    } catch (e) {}

    // 2. Apps Script
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve) => {
        google.script.run
          .withSuccessHandler((res) => {
            if (res.success && res.usuario) {
              this.setSession(res.usuario);
              resolve({ success: true, user: res.usuario });
            } else {
              resolve({ success: false, message: res.mensaje || 'El correo ya se encuentra registrado.' });
            }
          })
          .withFailureHandler((err) => resolve({ success: false, message: err.message }))
          .registrarUsuario({ nombre: nombreLimpio, email: emailNorm, password });
      });
    }

    // 3. Local fallback
    const users = this.getLocalUsers();
    if (users.some((u) => u.email === emailNorm)) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    const userId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newUser = {
      id: userId,
      nombre: nombreLimpio,
      email: emailNorm,
      password: password,
      fechaRegistro: new Date().toISOString(),
      rol: emailNorm.includes('admin') ? CONFIG.ROLES.ADMIN : (emailNorm.includes('grupo') ? CONFIG.ROLES.PRODUCER : CONFIG.ROLES.CONSUMER),
      plan: CONFIG.PLANS.FREE
    };

    users.push(newUser);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));

    const userSession = {
      id: newUser.id,
      nombre: newUser.nombre,
      email: newUser.email,
      rol: newUser.rol,
      plan: newUser.plan
    };
    this.setSession(userSession);
    return { success: true, user: userSession };
  },

  handleSSOLogin(payload) {
    const emailNorm = this.normalizeEmail(payload.email);
    const nombre = (payload.name || payload.nombre || 'Usuario Google').toString().trim();

    const user = {
      id: 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      nombre: nombre,
      email: emailNorm,
      rol: CONFIG.ROLES.CONSUMER,
      plan: CONFIG.PLANS.FREE
    };

    this.setSession(user);
    return user;
  },

  getLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USERS) || '[]');
    } catch (e) {
      return [];
    }
  },

  setSession(user) {
    store.setState({ user });
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(user));
    } catch (e) {}
  },

  logout() {
    store.setState({ user: null, userPurchases: [] });
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION);
    } catch (e) {}
  },

  getCurrentUser() {
    return store.getState().user;
  },

  isAuthenticated() {
    return !!store.getState().user;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.rol === CONFIG.ROLES.ADMIN || user.rol === 'admin' || user.rol === 'Administrador');
  },

  isProducer() {
    const user = this.getCurrentUser();
    return user && (user.rol === CONFIG.ROLES.PRODUCER || user.rol === 'grupo_teatral' || user.rol === 'estadistico' || this.isAdmin());
  }
};
