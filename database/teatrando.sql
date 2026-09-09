-- ==========================================================
-- Base de Datos: teatrando (Para XAMPP / MySQL / MariaDB)
-- Compatible con phpMyAdmin
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `teatrando` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `teatrando`;

-- Desactivar restricciones de claves foráneas temporalmente para recargar tablas limpias
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `suscripciones`;
DROP TABLE IF EXISTS `interacciones`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `carteleras`;
DROP TABLE IF EXISTS `estadisticas_teatro`;
DROP TABLE IF EXISTS `teatros`;
DROP TABLE IF EXISTS `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- 1. Tabla: teatros
-- Información institucional, aforo y servicios del teatro/sala
-- ----------------------------------------------------------
CREATE TABLE `teatros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `ubicacion` TEXT NOT NULL,
  `aforo` INT NOT NULL DEFAULT 350,
  `historia` TEXT,
  `servicios` TEXT,
  `normas` TEXT,
  `telefono` VARCHAR(50),
  `imagen` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Tabla: carteleras (Obras y Funciones)
-- ----------------------------------------------------------
CREATE TABLE `carteleras` (
  `id` VARCHAR(64) PRIMARY KEY,
  `id_teatro` INT DEFAULT 1,
  `obra` VARCHAR(255) NOT NULL,
  `funcion` VARCHAR(255) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `imagen` TEXT,
  `precio_usd` DECIMAL(10,2) NOT NULL,
  `genero` VARCHAR(100) DEFAULT 'General',
  `sala` VARCHAR(100) DEFAULT 'Sala Principal',
  `director` VARCHAR(255) DEFAULT 'Dirección General',
  `duracion_min` INT DEFAULT 90,
  `edad_minima` VARCHAR(50) DEFAULT 'Todo público',
  `sinopsis` TEXT,
  `reparto` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cartelera_teatro` FOREIGN KEY (`id_teatro`) REFERENCES `teatros`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Tabla: usuarios
-- Roles: Visitante, Usuario, Crítico, Admin
-- Planes: Plan Básico (Gratis), Plan Bambalinas, Plan Crítico / VIP
-- ----------------------------------------------------------
CREATE TABLE `usuarios` (
  `id` VARCHAR(64) PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('Visitante', 'Usuario', 'Crítico', 'Admin') NOT NULL DEFAULT 'Usuario',
  `plan_suscripcion` ENUM('Plan Básico (Gratis)', 'Plan Bambalinas', 'Plan Crítico / VIP') NOT NULL DEFAULT 'Plan Básico (Gratis)',
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Tabla: tickets (Boletos emitidos con QR y Tasa BCV)
-- ----------------------------------------------------------
CREATE TABLE `tickets` (
  `ticket_id` VARCHAR(64) PRIMARY KEY,
  `id_usuario` VARCHAR(64) DEFAULT 'INVITADO',
  `nombre_cliente` VARCHAR(255) NOT NULL,
  `email_cliente` VARCHAR(255) NOT NULL,
  `obra` VARCHAR(255) NOT NULL,
  `funcion` VARCHAR(255) NOT NULL,
  `sala` VARCHAR(100) NOT NULL,
  `asiento` VARCHAR(32) NOT NULL,
  `fecha_funcion` DATE NOT NULL,
  `hora_funcion` TIME NOT NULL,
  `precio_usd` DECIMAL(10,2) NOT NULL,
  `precio_ves` DECIMAL(10,2) NOT NULL,
  `tasa_bcv` DECIMAL(10,2) NOT NULL,
  `ref_pago` VARCHAR(128) NOT NULL,
  `fecha_emision` DATE NOT NULL,
  `hora_emision` TIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Tabla: interacciones (Likes, comentarios y críticas oficiales)
-- ----------------------------------------------------------
CREATE TABLE `interacciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_obra` VARCHAR(64) NOT NULL,
  `id_usuario` VARCHAR(64) DEFAULT NULL,
  `nombre_autor` VARCHAR(255) NOT NULL DEFAULT 'Anónimo',
  `rol_autor` VARCHAR(64) NOT NULL DEFAULT 'Usuario',
  `tipo` ENUM('like', 'comentario', 'critica') NOT NULL,
  `valor` TEXT,
  `estrellas` INT DEFAULT 5,
  `es_destacada` TINYINT(1) DEFAULT 0,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Tabla: suscripciones (Control de pagos de planes)
-- ----------------------------------------------------------
CREATE TABLE `suscripciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_usuario` VARCHAR(64) NOT NULL,
  `plan` VARCHAR(100) NOT NULL,
  `precio_usd` DECIMAL(10,2) NOT NULL,
  `precio_ves` DECIMAL(10,2) NOT NULL,
  `tasa_bcv` DECIMAL(10,2) NOT NULL,
  `ref_pago` VARCHAR(128) NOT NULL,
  `estado` ENUM('Activa', 'Pendiente', 'Cancelada') DEFAULT 'Activa',
  `fecha_inicio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_suscripcion_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. Tabla: estadisticas_teatro
-- Métricas en vivo de aforo y rendimiento teatral
-- ----------------------------------------------------------
CREATE TABLE `estadisticas_teatro` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_teatro` INT DEFAULT 1,
  `total_funciones` INT DEFAULT 18,
  `butacas_vendidas` INT DEFAULT 4120,
  `porcentaje_ocupacion` DECIMAL(5,2) DEFAULT 88.50,
  `calificacion_promedio` DECIMAL(3,2) DEFAULT 4.92,
  `obra_mas_vista` VARCHAR(255) DEFAULT 'El Fantasma de la Ópera',
  `actualizado_el` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_stats_teatro` FOREIGN KEY (`id_teatro`) REFERENCES `teatros`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- DATOS SEMILLA (INSERCIONES INICIALES PARA PRUEBAS)
-- ==========================================================

-- Teatro Principal
INSERT INTO `teatros` (`id`, `nombre`, `ubicacion`, `aforo`, `historia`, `servicios`, `normas`, `telefono`, `imagen`) VALUES
(1, 'Teatro Municipal de Caracas', 'Av. Lecuna, Esquina de Reducto a Municipal, Centro de Caracas', 650, 
'Inaugurado en 1881 bajo el gobierno de Antonio Guzmán Blanco, el Teatro Municipal de Caracas es una joya neoclásica de la arquitectura escénica venezolana con acústica de estándar europeo.',
'Estacionamiento techado y vigilado, Cafetería gourmet en el foyer, Acceso accesible para sillas de ruedas, Guardarropa de cortesía, Climatización integral.',
'Silenciar teléfonos móviles durante la función. Se prohíbe el uso de flash fotográfico. Se ruega puntualidad (las puertas se cierran al iniciar la tercera llamada).',
'+58 (212) 555-8328',
'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80');

-- Estadísticas iniciales
INSERT INTO `estadisticas_teatro` (`id_teatro`, `total_funciones`, `butacas_vendidas`, `porcentaje_ocupacion`, `calificacion_promedio`, `obra_mas_vista`) VALUES
(1, 24, 5280, 91.25, 4.94, 'El Fantasma de la Ópera');

-- Cartelera de Obras
INSERT INTO `carteleras` (`id`, `id_teatro`, `obra`, `funcion`, `fecha`, `hora`, `imagen`, `precio_usd`, `genero`, `sala`, `director`, `duracion_min`, `edad_minima`, `sinopsis`, `reparto`) VALUES
('1', 1, 'Hamlet', 'Función de Gala', '2026-09-15', '19:30:00', 
 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80', 
 25.00, 'Drama', 'Sala Ríos Reyna', 'Héctor Manrique', 110, '+14 años',
 'La emblemática tragedia de William Shakespeare que indaga en la traición, el poder y la venganza moral del Príncipe de Dinamarca tras el regicidio de su padre.', 
 'Carlos Cruz, Marisa Román, Héctor Manrique, Antonio Delli'),

('2', 1, 'El Fantasma de la Ópera', 'Viernes Estelar', '2026-09-18', '20:00:00', 
 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=600&q=80', 
 35.00, 'Musical', 'Sala Principal', 'Federico Pacanins', 130, 'Todo público',
 'Un misterioso genio musical atormentado habita en las catacumbas de la Ópera de París y seduce a la talentosa soprano Christine Daaé.', 
 'Giannina Pavone, Beto Baralt, Humberto Baralt, Gaspar Colón'),

('3', 1, 'TOC TOC', 'Domingo de Risas', '2026-09-20', '18:00:00', 
 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80', 
 15.00, 'Comedia', 'Teatro Trasnocho', 'Armando Álvarez', 95, '+12 años',
 'Seis pacientes que padecen diferentes tipos de Trastorno Obsesivo Compulsivo (TOC) coinciden en la sala de espera de un reputado psiquiatra que se retrasa.', 
 'Sócrates Serrano, Sonia Villamizar, Laureano Olivarez, Diana Volpe');

-- Usuarios iniciales con los 4 roles
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `plan_suscripcion`) VALUES
('USR-ADMIN-01', 'Administrador Principal', 'admin@teatrando.com', 'admin123', 'Admin', 'Plan Crítico / VIP'),
('USR-CRITIC-01', 'Armando Reverón (Crítico Teatral)', 'critico@prensa.com', 'critico123', 'Crítico', 'Plan Crítico / VIP'),
('USR-USER-01', 'Mariana Valera', 'mariana@correo.com', 'usuario123', 'Usuario', 'Plan Bambalinas'),
('USR-USER-02', 'Carlos Mendoza', 'carlos@correo.com', 'usuario123', 'Usuario', 'Plan Básico (Gratis)');

-- Reseñas y Críticas destacadas iniciales
INSERT INTO `interacciones` (`id_obra`, `id_usuario`, `nombre_autor`, `rol_autor`, `tipo`, `valor`, `estrellas`, `es_destacada`) VALUES
('1', 'USR-CRITIC-01', 'Armando Reverón (Crítica Cultural)', 'Crítico', 'critica', 
 'Una puesta en escena sublime que honra la intensidad lírica de Shakespeare. El desempeño actoral en el tercer acto es antológico.', 5, 1),
('2', 'USR-CRITIC-01', 'Armando Reverón (Crítica Cultural)', 'Crítico', 'critica', 
 'La producción orquestal y el diseño de iluminación logran un espectáculo envolvente de primer nivel internacional.', 5, 1),
('1', 'USR-USER-01', 'Mariana Valera', 'Usuario', 'comentario', 'Excelente función, la acústica de la sala es fantástica.', 5, 0),
('1', NULL, 'Espectador Anónimo', 'Visitante', 'like', NULL, 5, 0),
('2', NULL, 'Espectador Anónimo', 'Visitante', 'like', NULL, 5, 0);
