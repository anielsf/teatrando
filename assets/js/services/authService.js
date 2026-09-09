/**
 * Servicio de Autenticación, Roles y Suscripciones de Teatrando
 * Conexión con MySQL (XAMPP / PHP) y fallback de almacenamiento local.
 * Roles: Visitante, Usuario, Crítico, Admin
 * Planes: Plan Básico (Gratis), Plan Bambalinas, Plan Crítico / VIP
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

    // 1. Intentar Backend PHP / MySQL (XAMPP)
    try {
      const res = await fetch('api/auth.php', {
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

    // 2. Modo Local Fallback
    const users = this.getLocalUsers();
    const found = users.find((u) => u.email === emailNorm && u.password === password);

    if (found) {
      const userSession = {
        id: found.id,
        nombre: found.nombre,
        email: found.email,
        rol: found.rol || CONFIG.ROLES.USER,
        plan: found.plan || CONFIG.PLANS.BASIC
      };
      this.setSession(userSession);
      return { success: true, user: userSession };
    }

    // Usuario demo inicial si coincide
    if (emailNorm === 'admin@teatrando.com' && password === 'admin123') {
      const adminUser = {
        id: 'USR-ADMIN-01',
        nombre: 'Administrador Principal',
        email: emailNorm,
        rol: CONFIG.ROLES.ADMIN,
        plan: CONFIG.PLANS.CRITIC_VIP
      };
      this.setSession(adminUser);
      return { success: true, user: adminUser };
    }

    if (emailNorm === 'critico@prensa.com' && password === 'critico123') {
      const criticUser = {
        id: 'USR-CRITIC-01',
        nombre: 'Armando Reverón (Crítico)',
        email: emailNorm,
        rol: CONFIG.ROLES.CRITIC,
        plan: CONFIG.PLANS.CRITIC_VIP
      };
      this.setSession(criticUser);
      return { success: true, user: criticUser };
    }

    return { success: false, message: 'Correo o contraseña incorrectos.' };
  },

  async register(nombre, email, password) {
    const emailNorm = this.normalizeEmail(email);
    const nombreLimpio = (nombre || '').toString().trim();

    // 1. Intentar Backend PHP / MySQL (XAMPP)
    try {
      const res = await fetch('api/auth.php', {
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

    // 2. Modo Local Fallback
    const users = this.getLocalUsers();
    if (users.some((u) => u.email === emailNorm)) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    let rol = CONFIG.ROLES.USER;
    let plan = CONFIG.PLANS.BASIC;

    if (emailNorm.includes('admin')) {
      rol = CONFIG.ROLES.ADMIN;
      plan = CONFIG.PLANS.CRITIC_VIP;
    } else if (emailNorm.includes('critico')) {
      rol = CONFIG.ROLES.CRITIC;
      plan = CONFIG.PLANS.CRITIC_VIP;
    }

    const userId = 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newUser = {
      id: userId,
      nombre: nombreLimpio,
      email: emailNorm,
      password: password,
      fechaRegistro: new Date().toISOString(),
      rol: rol,
      plan: plan
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

  /**
   * Actualizar plan de suscripción del usuario tras pago
   */
  async upgradePlan(nuevoPlan, refPago, precioUSD, precioVES, tasaBCV) {
    const user = this.getCurrentUser();
    const userId = user ? user.id : 'INVITADO';
    const email = user ? user.email : '';

    let nuevoRol = CONFIG.ROLES.USER;
    if (nuevoPlan === CONFIG.PLANS.CRITIC_VIP) {
      nuevoRol = CONFIG.ROLES.CRITIC;
    } else if (user && user.rol === CONFIG.ROLES.ADMIN) {
      nuevoRol = CONFIG.ROLES.ADMIN;
    }

    // 1. Enviar a backend PHP / MySQL (XAMPP)
    try {
      await fetch('api/suscripciones.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          plan: nuevoPlan,
          refPago,
          precioUSD,
          precioVES,
          tasaBCV
        })
      });
    } catch (e) {}

    // 2. Actualizar sesión local
    if (user) {
      const updatedUser = {
        ...user,
        plan: nuevoPlan,
        rol: nuevoRol
      };
      this.setSession(updatedUser);

      // Actualizar en listado local de usuarios
      const users = this.getLocalUsers();
      const idx = users.findIndex((u) => u.email === user.email);
      if (idx !== -1) {
        users[idx].plan = nuevoPlan;
        users[idx].rol = nuevoRol;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      return { success: true, user: updatedUser };
    }

    return { success: true, plan: nuevoPlan, rol: nuevoRol };
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

  isVisitor() {
    return !this.isAuthenticated();
  },

  isCritic() {
    const user = this.getCurrentUser();
    return user && (user.rol === CONFIG.ROLES.CRITIC || user.plan === CONFIG.PLANS.CRITIC_VIP);
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.rol === CONFIG.ROLES.ADMIN;
  },

  hasFreeFees() {
    const user = this.getCurrentUser();
    return user && (user.plan === CONFIG.PLANS.BAMBALINAS || user.plan === CONFIG.PLANS.CRITIC_VIP);
  }
};
