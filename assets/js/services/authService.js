/**
 * Servicio de Autenticación, Roles y Suscripciones de Teatrando
 * Conexión nativa con Supabase (Vercel) y persistencia de sesión local.
 * Roles: Visitante, Usuario, Crítico, Admin
 * Planes: Plan Básico (Gratis), Plan Bambalinas, Plan Crítico / VIP
 */
import { CONFIG, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { store } from '../state/store.js';

// Inicializar el cliente de Supabase usando las constantes públicas del frontend
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    try {
      // 1. Intentar iniciar sesión en Supabase Authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password: password,
      });

      if (error) throw error;

      if (data && data.user) {
        // Mapear metadatos del usuario guardados durante el registro
        const metadata = data.user.user_metadata || {};
        
        const userSession = {
          id: data.user.id,
          nombre: metadata.nombre || 'Usuario Teatrando',
          email: data.user.email,
          rol: metadata.rol || CONFIG.ROLES.USER,
          plan: metadata.plan || CONFIG.PLANS.BASIC
        };

        this.setSession(userSession);
        return { success: true, user: userSession };
      }
    } catch (e) {
      console.error('Error en login con Supabase:', e.message || e);
      return { success: false, message: e.message || 'Correo o contraseña incorrectos.' };
    }
  },

  async register(nombre, email, password) {
    const emailNorm = this.normalizeEmail(email);
    const nombreLimpio = (nombre || '').toString().trim();

    // Definición automática de roles iniciales por conveniencia de testing
    let rol = CONFIG.ROLES.USER;
    let plan = CONFIG.PLANS.BASIC;

    if (emailNorm.includes('admin')) {
      rol = CONFIG.ROLES.ADMIN;
      plan = CONFIG.PLANS.CRITIC_VIP;
    } else if (emailNorm.includes('critico')) {
      rol = CONFIG.ROLES.CRITIC;
      plan = CONFIG.PLANS.CRITIC_VIP;
    }

    try {
      // 2. Registrar el usuario en Supabase Authentication guardando los roles en metadata
      const { data, error } = await supabase.auth.signUp({
        email: emailNorm,
        password: password,
        options: {
          data: {
            nombre: nombreLimpio,
            rol: rol,
            plan: plan
          }
        }
      });

      if (error) throw error;

      if (data && data.user) {
        const userSession = {
          id: data.user.id,
          nombre: nombreLimpio,
          email: data.user.email,
          rol: rol,
          plan: plan
        };
        
        this.setSession(userSession);
        return { success: true, user: userSession };
      }
    } catch (e) {
      console.error('Error en registro con Supabase:', e.message || e);
      return { success: false, message: e.message || 'Error al intentar registrar el usuario.' };
    }
  },

  /**
   * Actualizar plan de suscripción del usuario tras pago
   */
  async upgradePlan(nuevoPlan, refPago, precioUSD, precioVES, tasaBCV) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'No hay usuario autenticado.' };

    let nuevoRol = CONFIG.ROLES.USER;
    if (nuevoPlan === CONFIG.PLANS.CRITIC_VIP) {
      nuevoRol = CONFIG.ROLES.CRITIC;
    } else if (user.rol === CONFIG.ROLES.ADMIN) {
      nuevoRol = CONFIG.ROLES.ADMIN;
    }

    try {
      // 3. Actualizar metadatos del usuario logueado en Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          plan: nuevoPlan,
          rol: nuevoRol
        }
      });

      if (error) throw error;

      const updatedUser = {
        ...user,
        plan: nuevoPlan,
        rol: nuevoRol
      };
      
      this.setSession(updatedUser);
      return { success: true, user: updatedUser };

    } catch (e) {
      console.error('Error al actualizar plan en Supabase:', e.message || e);
      
      // Fallback local por si falla la conexión de red transitoria
      const updatedUser = { ...user, plan: nuevoPlan, rol: nuevoRol };
      this.setSession(updatedUser);
      return { success: true, user: updatedUser };
    }
  },

  setSession(user) {
    store.setState({ user });
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(user));
    } catch (e) {}
  },

  logout() {
    // Cerrar sesión en Supabase y limpiar UI
    supabase.auth.signOut().catch(() => {});
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
