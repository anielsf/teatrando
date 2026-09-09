<?php
/**
 * API: Interacciones, Likes y Críticas de Obras (MySQL)
 * Incluye distintivo oficial para el rol 'Crítico'
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // GET: Obtener críticas y comentarios de una obra
    if ($method === 'GET') {
        $idObra = $_GET['id_obra'] ?? '';
        if (!$idObra) {
            echo json_encode([]);
            exit();
        }

        $stmt = $pdo->prepare("
            SELECT id, id_obra, id_usuario, nombre_autor, rol_autor, tipo, valor, estrellas, es_destacada, fecha_registro
            FROM interacciones 
            WHERE id_obra = :id_obra AND tipo IN ('critica', 'comentario')
            ORDER BY es_destacada DESC, fecha_registro DESC
        ");
        $stmt->execute([':id_obra' => $idObra]);
        $rows = $stmt->fetchAll();

        echo json_encode($rows, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // POST: Registrar like, comentario o crítica
    if ($method === 'POST') {
        $d = getJsonInput();
        $idObra = $d['id_obra'] ?? '';
        $tipo = $d['tipo'] ?? 'like'; // like, comentario, critica
        $idUsuario = $d['id_usuario'] ?? null;
        $nombreAutor = !empty($d['nombre_autor']) ? trim($d['nombre_autor']) : 'Anónimo';
        $rolAutor = !empty($d['rol_autor']) ? trim($d['rol_autor']) : 'Usuario';
        $valor = $d['valor'] ?? '';
        $estrellas = isset($d['estrellas']) ? (int)$d['estrellas'] : 5;

        // Distintivo oficial para el rol Crítico
        $esDestacada = ($rolAutor === 'Crítico' || $tipo === 'critica') ? 1 : 0;

        if (!$idObra) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'id_obra es requerido']);
            exit();
        }

        $stmt = $pdo->prepare("
            INSERT INTO interacciones (id_obra, id_usuario, nombre_autor, rol_autor, tipo, valor, estrellas, es_destacada)
            VALUES (:id_obra, :id_usuario, :nombre_autor, :rol_autor, :tipo, :valor, :estrellas, :es_destacada)
        ");
        $stmt->execute([
            ':id_obra' => $idObra,
            ':id_usuario' => $idUsuario,
            ':nombre_autor' => $nombreAutor,
            ':rol_autor' => $rolAutor,
            ':tipo' => $tipo,
            ':valor' => $valor,
            ':estrellas' => $estrellas,
            ':es_destacada' => $esDestacada
        ]);

        echo json_encode([
            'success' => true,
            'id' => $pdo->lastInsertId(),
            'esDestacada' => (bool)$esDestacada
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
