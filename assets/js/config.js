/**
 * Configuración global y esquema de base de datos de Teatrando
 * Adaptado para Supabase en Vercel, roles y planes de suscripción
 */

// 1. Configuración de Supabase para el Frontend
// (Como es Vanilla JS sin empaquetador, tus credenciales públicas van directamente aquí)
export const SUPABASE_URL = "https://muqhnbmaqprokczltdrj.supabase.co"; 
export const SUPABASE_ANON_KEY = "sb_publishable_BgxJ27gmu6KQk-8QH_6MIQ_OGVlg6TW";

// 2. Objeto de configuración global único (Unificado)
export const CONFIG = {
  APP_NAME: 'Teatrando',
  SLOGAN: 'Vive la escena',
  VERSION: '2.0.0',
  API_URL: '/api',
  DEFAULT_CURRENCY: 'VES',
  DEFAULT_BCV_RATE: 798.33,
  TOTAL_SEATS_PER_ROOM: 40,

  // Nuevos Roles del Sistema
  ROLES: {
    VISITOR: 'Visitante',
    USER: 'Usuario',
    CRITIC: 'Crítico',
    ADMIN: 'Admin'
  },

  // Nuevos Planes de Suscripción
  PLANS: {
    BASIC: 'Plan Básico (Gratis)',
    BAMBALINAS: 'Plan Bambalinas',
    CRITIC_VIP: 'Plan Crítico / VIP'
  },

  // Detalle de Precios y Beneficios de los Planes
  PLANS_CONFIG: {
    'Plan Básico (Gratis)': {
      id: 'basic',
      nombre: 'Plan Básico (Gratis)',
      precioUSD: 0.00,
      badge: 'Básico',
      color: '#a0a0a0',
      icono: '🎟️',
      beneficios: [
        'Compra estándar de entradas',
        'Acceso completo a la cartelera teatral',
        'Boletos digitales con código QR',
        'Soporte por correo electrónico'
      ]
    },
    'Plan Bambalinas': {
      id: 'bambalinas',
      nombre: 'Plan Bambalinas',
      precioUSD: 9.99,
      badge: 'Bambalinas',
      color: '#d4af37',
      icono: '⭐',
      beneficios: [
        'Cero comisiones de servicio en todas tus compras',
        'Acceso a pre-ventas exclusivas 48 horas antes',
        'Ubicaciones preferenciales garantizadas',
        'Descuentos en bebidas y programas de mano'
      ]
    },
    'Plan Crítico / VIP': {
      id: 'critico_vip',
      nombre: 'Plan Crítico / VIP',
      precioUSD: 19.99,
      badge: 'Crítico Oficial',
      color: '#c5a059',
      icono: '🎖️',
      beneficios: [
        'Distintivo oficial verificado en todas tus reseñas y críticas',
        'Pases exclusivos a conferencias y ruedas de prensa',
        'Acceso preferente al Foyer VIP y butacas de gala',
        'Votación anual para premios teatrales'
      ]
    }
  },

  // Teatro Municipal por Defecto
  TEATRO_DEFAULT: {
    nombre: 'Teatro Municipal de Caracas',
    ubicacion: 'Av. Lecuna, Esquina de Reducto a Municipal, Centro de Caracas',
    aforo: 650,
    historia: 'Inaugurado en 1881 bajo el gobierno de Antonio Guzmán Blanco, el Teatro Municipal de Caracas es una joya neoclásica de la arquitectura escénica venezolana con acústica de estándar europeo.',
    servicios: [
      'Estacionamiento techado y vigilado',
      'Cafetería gourmet en el foyer',
      'Acceso accesible para sillas de ruedas',
      'Guardarropa de cortesía',
      'Climatización integral de sala'
    ],
    normas: [
      'Silenciar teléfonos móviles durante la función',
      'Prohibido el uso de flash fotográfico',
      'Se ruega puntualidad (las puertas cierran a la tercera llamada)',
      'No se permite el ingreso con alimentos o bebidas a la platea'
    ],
    telefono: '+58 (212) 555-8328',
    estadisticas: {
      totalFunciones: 24,
      butacasVendidas: 5280,
      porcentajeOcupacion: 91.25,
      calificacionCriticos: 4.94,
      obraMasVista: 'El Fantasma de la Ópera'
    }
  },

  STORAGE_KEYS: {
    SESSION: 'teatrando_sesion',
    LAST_TICKET: 'teatrando_ultima_entrada',
    SHOWS: 'teatrando_carteleras',
    INTERACTIONS: 'teatrando_interacciones',
    USERS: 'teatrando_usuarios',
    ORDERS: 'teatrando_compras',
    SUBSCRIPTIONS: 'teatrando_suscripciones',
    CACHE_BCV: 'teatrando_cache_bcv'
  }
};
