# 🎭 Guía de Instalación y Uso con XAMPP (MySQL + Apache) - Teatrando

Esta guía explica paso a paso cómo ejecutar **Teatrando** localmente en tu computadora usando **XAMPP**.

---

## 📋 Requisitos Previos

1. Tener instalado **XAMPP** en tu sistema (generalmente en `C:\xampp`).
2. Abrir el **XAMPP Control Panel**.

---

## 🚀 Pasos de Instalación (Menos de 3 minutos)

### Paso 1: Copiar el proyecto a `htdocs`
Copia la carpeta de este proyecto (`teatrando`) dentro del directorio `htdocs` de XAMPP:
```
C:\xampp\htdocs\teatrando
```

### Paso 2: Iniciar Apache y MySQL
1. Abre el **XAMPP Control Panel**.
2. Haz clic en el botón **Start** junto a **Apache**.
3. Haz clic en el botón **Start** junto a **MySQL**.
*(Ambos módulos deben ponerse en color verde).*

### Paso 3: Importar la Base de Datos en phpMyAdmin
1. Abre tu navegador y entra a:
   👉 **[http://localhost/phpmyadmin](http://localhost/phpmyadmin)**
2. En el menú superior, haz clic en la pestaña **Importar** (o *Import*).
3. Haz clic en **Seleccionar archivo** (*Choose File*) y elige el archivo:
   ```
   C:\xampp\htdocs\teatrando\database\teatrando.sql
   ```
4. Baja hasta el final de la página y haz clic en el botón **Importar** (*Go* / *Continuar*).
5. ¡Listo! Se creará la base de datos `teatrando` con todas sus tablas y datos de ejemplo:
   - `teatros` (ficha institucional, historia, aforo y servicios).
   - `carteleras` (obras, funciones, directores, duración y clasificación).
   - `usuarios` (cuentas con los 4 roles).
   - `tickets` (boletos emitidos con QR y tasa oficial BCV).
   - `interacciones` (likes, comentarios y críticas de prensa).
   - `suscripciones` (historial de pagos y membresías).
   - `estadisticas_teatro` (aforo y métricas de taquilla en vivo).

### Paso 4: Abrir Teatrando en tu Navegador
Entra a:
👉 **[http://localhost/teatrando](http://localhost/teatrando)**

---

## 👥 Cuentas Demo para Probar los 4 Roles

Puedes probar la experiencia de cada rol con estas credenciales ya creadas:

| Rol | Correo | Contraseña | Plan de Suscripción | Permisos |
|---|---|---|---|---|
| 🛡️ **Admin** | `admin@teatrando.com` | `admin123` | Plan Crítico / VIP | Acceso total al panel de administración, gestión de obras, salas y ficha del teatro. |
| 🎖️ **Crítico** | `critico@prensa.com` | `critico123` | Plan Crítico / VIP | Publicación de **Críticas Oficiales Destacadas** con distintivo de prensa y estrellas. |
| 👤 **Usuario** | `mariana@correo.com` | `usuario123` | Plan Bambalinas | Compra de entradas con **Cero Comisiones**, pre-ventas y comentarios. |
| 👤 **Usuario** | `carlos@correo.com` | `usuario123` | Plan Básico (Gratis) | Compra estándar de entradas y comentarios generales. |
| 👁️ **Visitante** | *(Sin iniciar sesión)* | *(Ninguna)* | Ninguno | Navega por la cartelera, ficha del teatro, lee estadísticas y críticas; al comprar o calificar se le invita a registrarse o suscribirse. |

---

## ⭐ Planes de Suscripción y Botón de Pago

En la barra de navegación encontrarás el botón **`⭐ Planes & Suscripciones`**:

1. **Plan Básico (Gratis)**:
   - Compra estándar de entradas.
2. **Plan Bambalinas ($9.99 / mes)**:
   - Cero comisiones de servicio en compras.
   - Acceso a pre-ventas exclusivas 48 horas antes.
3. **Plan Crítico / VIP ($19.99 / mes)**:
   - Distintivo oficial 🎖️ en todas las reseñas y críticas escénicas.
   - Pases a ruedas de prensa y foyer VIP.
   - Ascenso automático al rol **Crítico**.

### Conversión en Bolívares y Pago Móvil:
- Al seleccionar cualquier plan, la plataforma calcula en vivo el monto en **Bolívares (VES)** usando la tasa oficial del Banco Central de Venezuela (BCV).
- Puedes ingresar una referencia simulada de Pago Móvil y tu plan se activará de inmediato tanto en la base de datos MySQL como en tu perfil.

---

## 🏛️ Apartado de Cartelera: Información y Estadísticas Teatrales

En la vista de **Cartelera** encontrarás:
- **Ficha Institucional del Teatro**: Sede, historia patrimonial, aforo oficial (650 butacas), servicios disponibles (estacionamiento vigilado, cafetín, accesibilidad) y normas de sala.
- **Dashboard de Estadísticas en Vivo**: % de ocupación de sala, total de butacas vendidas y calificación promedio otorgada por los Críticos Oficiales.
- **Ficha Técnica en cada Obra**: Director, duración en minutos, edad recomendada y críticas de prensa destacadas.
