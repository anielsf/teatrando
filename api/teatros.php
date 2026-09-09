<?php
/**
 * API: Teatros y Estadísticas de Rendimiento (MySQL)
 * Compatible con XAMPP / Apache
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $idTeatro = isset($_GET['id']) ? (int)$_GET['id'] : 1;

        // 1. Obtener ficha del teatro
        $stmtTeatro = $pdo->prepare("SELECT * FROM teatros WHERE id = :id");
        $stmtTeatro->execute([':id' => $idTeatro]);
        $teatro = $stmtTeatro->fetch();

        if (!$teatro) {
            $stmtTeatro = $pdo->query("SELECT * FROM teatros LIMIT 1");
            $teatro = $stmtTeatro->fetch();
        }

        // 2. Obtener estadísticas globales y dinámicas
        $stmtStats = $pdo->prepare("SELECT * FROM estadisticas_teatro WHERE id_teatro = :id LIMIT 1");
        $stmtStats->execute([':id' => $teatro ? $teatro['id'] : 1]);
        $stats = $stmtStats->fetch();

        // 3. Contabilizar boletos reales vendidos en la base de datos
        $stmtTicketsCount = $pdo->query("SELECT count(*) as totalTickets, sum(precio_usd) as totalRecaudado FROM tickets");
        $ticketStats = $stmtTicketsCount->fetch();
        $realTickets = (int)($ticketStats['totalTickets'] ?? 0);

        // 4. Calcular ocupación y promedio de crítica
        $stmtCriticas = $pdo->query("SELECT avg(estrellas) as promedio, count(*) as totalCriticas FROM interacciones WHERE tipo = 'critica'");
        $criticaStats = $stmtCriticas->fetch();

        $respuesta = [
            'teatro' => $teatro ?: [
                'id' => 1,
                'nombre' => 'Teatro Municipal de Caracas',
                'ubicacion' => 'Centro de Caracas',
                'aforo' => 650,
                'historia' => 'Teatro histórico neoclásico venezolano.',
                'servicios' => 'Estacionamiento, Cafetería, Acceso para sillas de ruedas',
                'normas' => 'Puntualidad y teléfonos en silencio.',
                'telefono' => '+58 212 555-8328'
            ],
            'estadisticas' => [
                'totalFunciones' => (int)($stats['total_funciones'] ?? 24),
                'butacasVendidas' => (int)($stats['butacas_vendidas'] ?? 5280) + $realTickets,
                'porcentajeOcupacion' => (float)($stats['porcentaje_ocupacion'] ?? 91.25),
                'calificacionCriticos' => round((float)($criticaStats['promedio'] ?? 4.94), 2),
                'totalCriticasOficiales' => (int)($criticaStats['totalCriticas'] ?? 2),
                'obraMasVista' => $stats['obra_mas_vista'] ?? 'El Fantasma de la Ópera',
                'totalRecaudadoUSD' => (float)($ticketStats['totalRecaudado'] ?? 0.00)
            ]
        ];

        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // POST: Actualizar ficha o estadísticas del teatro (Admin)
    if ($method === 'POST') {
        $data = getJsonInput();
        $idTeatro = !empty($data['id']) ? (int)$data['id'] : 1;

        if (!empty($data['historia']) || !empty($data['servicios']) || !empty($data['normas'])) {
            $stmt = $pdo->prepare("
                UPDATE teatros SET 
                    aforo = :aforo,
                    historia = :historia,
                    servicios = :servicios,
                    normas = :normas,
                    telefono = :telefono
                WHERE id = :id
            ");
            $stmt->execute([
                ':aforo' => (int)($data['aforo'] ?? 650),
                ':historia' => $data['historia'] ?? '',
                ':servicios' => $data['servicios'] ?? '',
                ':normas' => $data['normas'] ?? '',
                ':telefono' => $data['telefono'] ?? '',
                ':id' => $idTeatro
            ]);
        }

        echo json_encode(['success' => true]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
