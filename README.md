# 🎭 Teatrando · Plataforma SaaS de Boletería y Gestión Teatral

**Teatrando** es una solución SaaS diseñada para salas, productores y aficionados del teatro. Permite explorar carteleras en tiempo real, seleccionar butacas interactivamente, procesar pagos multimoneda (USD / VES con conversión oficial BCV) y generar boletos digitales con códigos QR.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está estructurado como una **Single Page Application (SPA)** modular en **HTML5, CSS3 y JavaScript ES6**:

```text
teatrando/
├── index.html                     # Contenedor SPA semántico y montaje de vistas
├── assets/
│   ├── css/
│   │   ├── variables.css          # Tokens de diseño (paleta oro/vino, tipografía)
│   │   ├── base.css               # Reset y tipografía global
│   │   ├── layout.css             # Navbar, hero, contenedores y transiciones
│   │   ├── components.css         # Botones, formularios, modales y tarjetas
│   │   └── views/                 # Hojas de estilo por cada vista del flujo
│   │       ├── cartelera.css      # Tarjetas de obras y perforación de tickets
│   │       ├── checkout.css       # Matriz de asientos y boleto coleccionable
│   │       ├── admin.css          # Tablas administrativas y formularios
│   │       └── auth.css           # Cajas de login y registro
│   ├── js/
│   │   ├── app.js                 # Punto de entrada y enrutador SPA
│   │   ├── config.js              # Parámetros globales y configuración
│   │   ├── state/
│   │   │   └── store.js           # Estado centralizado reactivo
│   │   ├── services/              # Capa de servicios y comunicación
│   │   │   ├── api.js             # Adaptador de cartelera y compras
│   │   │   ├── authService.js     # Autenticación y control de roles (RBAC)
│   │   │   ├── currencyService.js # Tasa de cambio BCV y conversiones USD/VES
│   │   │   └── ticketService.js   # Procesamiento y emisión de boletos QR
│   │   ├── components/            # Componentes reutilizables de UI
│   │   │   ├── modal.js           # Cuadros de diálogo y confirmación temáticos
│   │   │   ├── navbar.js          # Navegación reactiva al rol de usuario
│   │   │   ├── seatingMap.js      # Matriz interactiva de butacas
│   │   │   └── ticketBadge.js     # Renderizador del boleto digital
│   │   ├── views/                 # Controladores de cada pantalla
│   │   │   ├── homeView.js        # Inicio y obras destacadas
│   │   │   ├── carteleraView.js   # Catálogo con filtros dinámicos
│   │   │   ├── checkoutView.js    # Flujo de compra en 5 pasos
│   │   │   ├── accountView.js     # Área de cliente e historial
│   │   │   └── adminView.js       # Panel CRUD administrativo
│   │   └── utils/
│   │       ├── helpers.js         # Formateadores de moneda, fecha y UUID
│   │       └── validators.js      # Validadores de formularios
│   ├── data/
│   │   └── mockData.json          # Datos semilla para pruebas offline
│   └── img/
│       └── placeholder-poster.svg # Imagen de reserva para obras
└── README.md
```

---

## 🚀 Características Principales

1. **Catálogo Teatral y Búsqueda:**
   - Filtros en tiempo real por texto libre, género, sala, fecha y rango de precios.
2. **Selección de Butacas Interactiva:**
   - Mapa de sala con identificación visual de butacas disponibles, ocupadas y seleccionadas.
3. **Checkout Multimoneda (USD / VES):**
   - Integración de tasa de cambio oficial (BCV) en tiempo real con cálculo automático del monto en Bolívares.
4. **Boleto Digital con Código QR:**
   - Diseño estilo entrada teatral clásica con código QR único para validación en taquilla.
5. **Control de Acceso Basado en Roles (RBAC):**
   - `Cliente`: Compra entradas, consulta historial y accede a sus tickets.
   - `Grupo Teatral`: Consulta estadísticas y métricas de funciones.
   - `Administrador`: CRUD completo de obras, funciones, precios y búsqueda de boletos de invitados.

---

## 💻 Cómo Ejecutar en Local

Al estar estructurado con módulos ES6 nativos de JavaScript, puedes ejecutar la aplicación con cualquier servidor HTTP local:

### Con Node.js / npx:
```bash
npx serve .
# o
npx http-server -p 8080
```

### Con Python:
```bash
python -m http.server 8000
```

### Con VS Code / Antigravity:
Abre el directorio `teatrando` y utiliza la extensión **Live Server** o ábrelo directamente en tu navegador configurado con un servidor estático.
