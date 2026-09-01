/**
 * Configuración global y esquema de base de datos de Teatrando
 */
export const CONFIG = {
  APP_NAME: 'Teatrando',
  SLOGAN: 'Vive la escena',
  VERSION: '1.0.0',
  DEFAULT_BCV_RATE: 798.33,
  TOTAL_SEATS_PER_ROOM: 40,
  
  // Esquema de Base de Datos (Paridad con Google Sheets / Backend SQL / NoSQL)
  DB_SCHEMA: {
    CARTELERAS: {
      nombre: 'Carteleras',
      columnas: ['ID', 'Obra', 'Funcion', 'Fecha', 'Hora', 'URL_Imagen', 'Precio_USD', 'Genero', 'Sala', 'Sinopsis', 'Reparto']
    },
    INTERACCIONES: {
      nombre: 'Interacciones',
      columnas: ['ID_Obra', 'Tipo', 'Valor', 'Fecha_Registro']
    },
    USUARIOS: {
      nombre: 'Usuarios',
      columnas: ['ID_Usuario', 'Nombre', 'Email', 'Password', 'Fecha_Registro', 'Rol', 'Plan_Suscripcion']
    },
    TICKETS: {
      nombre: 'Tickets',
      columnas: [
        'Ticket_ID', 'ID_Usuario', 'Nombre_Cliente', 'Email_Cliente',
        'Obra', 'Funcion', 'Sala', 'Asiento', 'Fecha_Funcion', 'Hora_Funcion',
        'Precio_USD', 'Precio_VES', 'Tasa_BCV', 'Ref_Pago', 'Fecha_Emision', 'Hora_Emision'
      ]
    }
  },

  STORAGE_KEYS: {
    SESSION: 'teatrando_sesion',
    LAST_TICKET: 'teatrando_ultima_entrada',
    SHOWS: 'teatrando_carteleras',
    INTERACTIONS: 'teatrando_interacciones',
    USERS: 'teatrando_usuarios',
    ORDERS: 'teatrando_compras',
    CACHE_BCV: 'teatrando_cache_bcv'
  },

  ROLES: {
    ADMIN: 'Administrador',
    PRODUCER: 'Grupo Teatral',
    CONSUMER: 'Consumidor'
  },

  PLANS: {
    FREE: 'Gratuito',
    PRO: 'Pro',
    ENTERPRISE: 'Empresarial'
  }
};
