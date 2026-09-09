<?php
/**
 * API: Carteleras Teatrales (CRUD y Consulta con MySQL)
 * Compatible con XAMPP / Apache
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // GET: Obtener todas las obras con interacciones, críticas destacadas y teatro asociado
    if ($method === 'GET') {
        $stmt = $pdo->query("
            SELECT 
                c.id, c.id_teatro, c.obra, c.funcion, c.fecha, c.hora, c.imagen, 
                c.precio_usd AS precioUSD, c.genero, c.sala, c.director, 
                c.duracion_min AS duracionMin, c.edad_minima AS edadMinima, 
                c.sinopsis, c.reparto,
                t.nombre AS teatroNombre, t.ubicacion AS teatroUbicacion, t.aforo AS teatroAforo
            FROM carteleras c
            LEFT JOIN teatros t ON c.id_teatro = t.id
            ORDER BY c.fecha ASC, c.hora ASC
        ");
        $shows = $stmt->fetchAll();

        // Obtener métricas e interacciones
        $interStmt = $pdo->query("SELECT id_obra, id_usuario, nombre_autor, rol_autor, tipo, valor, estrellas, es_destacada, fecha_registro FROM interacciones");
        $interRows = $interStmt->fetchAll();

        $metrics = [];
        foreach ($interRows as $row) {
            $idObra = $row['id_obra'];
            if (!isset($metrics[$idObra])) {
                $metrics[$idObra] = [
                    'likes' => 0,
                    'comentarios' => [],
                    'criticas' => []
                ];
            }
            if ($row['tipo'] === 'like') {
                $metrics[$idObra]['likes']++;
            } elseif ($row['tipo'] === 'critica') {
                $metrics[$idObra]['criticas'][] = [
                    'autor' => $row['nombre_autor'],
                    'rol' => $row['rol_autor'],
                    'texto' => $row['valor'],
                    'estrellas' => (int)$row['estrellas'],
                    'esDestacada' => (bool)$row['es_destacada'],
                    'fecha' => $row['fecha_registro']
                ];
            } elseif ($row['tipo'] === 'comentario') {
                $metrics[$idObra]['comentarios'][] = [
                    'autor' => $row['nombre_autor'],
                    'texto' => $row['valor'],
                    'fecha' => $row['fecha_registro']
                ];
            }
        }

        $result = array_map(function($s) use ($metrics) {
            $id = $s['id'];
            $s['precioUSD'] = (float)$s['precioUSD'];
            $s['duracionMin'] = (int)$s['duracionMin'];
            $s['teatroAforo'] = (int)$s['teatroAforo'];
            $s['likes'] = $metrics[$id]['likes'] ?? 0;
            $s['comentarios'] = $metrics[$id]['comentarios'] ?? [];
            $s['criticas'] = $metrics[$id]['criticas'] ?? [];
            return $s;
        }, $shows);

        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // POST: Guardar o actualizar espectáculo
    if ($method === 'POST') {
        $data = getJsonInput();
        if (empty($data['obra']) || empty($data['funcion'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Obra y función son requeridos']);
            exit();
        }

        $id = !empty($data['id']) ? $data['id'] : (string)round(microtime(true) * 1000);
        $idTeatro = !empty($data['id_teatro']) ? (int)$data['id_teatro'] : 1;
        $obra = trim($data['obra']);
        $funcion = trim($data['funcion']);
        $fecha = !empty($data['fecha']) ? $data['fecha'] : date('Y-m-d');
        $hora = !empty($data['hora']) ? $data['hora'] : '19:00:00';
        $imagen = !empty($data['imagen']) ? $data['imagen'] : '';
        $precioUSD = !empty($data['precioUSD']) ? (float)$data['precioUSD'] : 0.00;
        $genero = !empty($data['genero']) ? $data['genero'] : 'General';
        $sala = !empty($data['sala']) ? $data['sala'] : 'Sala Principal';
        $director = !empty($data['director']) ? $data['director'] : 'Dirección General';
        $duracionMin = !empty($data['duracionMin']) ? (int)$data['duracionMin'] : 90;
        $edadMinima = !empty($data['edadMinima']) ? $data['edadMinima'] : 'Todo público';
        $sinopsis = !empty($data['sinopsis']) ? $data['sinopsis'] : '';
        $reparto = !empty($data['reparto']) ? $data['reparto'] : '';

        $sql = "INSERT INTO carteleras (id, id_teatro, obra, funcion, fecha, hora, imagen, precio_usd, genero, sala, director, duracion_min, edad_minima, sinopsis, reparto)
                VALUES (:id, :id_teatro, :obra, :funcion, :fecha, :hora, :imagen, :precio_usd, :genero, :sala, :director, :duracion_min, :edad_minima, :sinopsis, :reparto)
                ON DUPLICATE KEY UPDATE 
                    obra = VALUES(obra), funcion = VALUES(funcion), fecha = VALUES(fecha), hora = VALUES(hora),
                    imagen = VALUES(imagen), precio_usd = VALUES(precio_usd), genero = VALUES(genero), sala = VALUES(sala),
                    director = VALUES(director), duracion_min = VALUES(duracion_min), edad_minima = VALUES(edad_minima),
                    sinopsis = VALUES(sinopsis), reparto = VALUES(reparto)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':id_teatro' => $idTeatro,
            ':obra' => $obra,
            ':funcion' => $funcion,
            ':fecha' => $fecha,
            ':hora' => $hora,
            ':imagen' => $imagen,
            ':precio_usd' => $precioUSD,
            ':genero' => $genero,
            ':sala' => $sala,
            ':director' => $director,
            ':duracion_min' => $duracionMin,
            ':edad_minima' => $edadMinima,
            ':sinopsis' => $sinopsis,
            ':reparto' => $reparto
        ]);

        echo json_encode(['success' => true, 'id' => $id]);
        exit();
    }

    // DELETE: Eliminar obra
    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID es requerido']);
            exit();
        }
        $stmt = $pdo->prepare("DELETE FROM carteleras WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
