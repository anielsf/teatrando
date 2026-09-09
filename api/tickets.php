<?php
/**
 * API: Emisión de Boletos y Consulta en MySQL
 * Compatible con XAMPP
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // GET: Consultar entradas por correo de comprador
    if ($method === 'GET') {
        $email = strtolower(trim($_GET['email'] ?? ''));
        if (!$email) {
            echo json_encode([]);
            exit();
        }

        $stmt = $pdo->prepare("
            SELECT 
                ticket_id AS ticketId, id_usuario AS userId, nombre_cliente AS nombreCliente,
                email_cliente AS emailCliente, obra, funcion, sala, asiento,
                fecha_funcion AS fechaFuncion, hora_funcion AS horaFuncion,
                precio_usd AS precioUSD, precio_ves AS precioVES, tasa_bcv AS tasaBCV,
                ref_pago AS refPago, fecha_emision AS fechaEmision, hora_emision AS horaEmision
            FROM tickets
            WHERE LOWER(email_cliente) = :email
            ORDER BY created_at DESC
        ");
        $stmt->execute([':email' => $email]);
        $tickets = $stmt->fetchAll();

        $result = array_map(function($t) {
            $t['precioUSD'] = (float)$t['precioUSD'];
            $t['precioVES'] = (float)$t['precioVES'];
            $t['tasaBCV'] = (float)$t['tasaBCV'];
            return $t;
        }, $tickets);

        echo json_encode($result, JSON_UNESCAPED_UNICODE);
        exit();
    }

    // POST: Emitir y registrar un nuevo ticket
    if ($method === 'POST') {
        $d = getJsonInput();

        $ticketId = 'TCK-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 9));
        $fechaEmision = date('Y-m-d');
        $horaEmision = date('H:i:s');

        $userId = !empty($d['userId']) ? $d['userId'] : 'INVITADO';
        $nombre = !empty($d['nombreCliente']) ? trim($d['nombreCliente']) : 'Cliente';
        $email = !empty($d['emailCliente']) ? strtolower(trim($d['emailCliente'])) : 'sin_correo@teatrando.com';
        $obra = !empty($d['obra']) ? trim($d['obra']) : 'N/A';
        $funcion = !empty($d['funcion']) ? trim($d['funcion']) : 'Función General';
        $sala = !empty($d['sala']) ? trim($d['sala']) : 'Sala Principal';
        $asiento = !empty($d['asiento']) ? trim($d['asiento']) : 'General';
        $fechaFuncion = !empty($d['fecha']) ? $d['fecha'] : date('Y-m-d');
        $horaFuncion = !empty($d['hora']) ? $d['hora'] : '19:00:00';
        $precioUSD = !empty($d['precioUSD']) ? (float)$d['precioUSD'] : 0.00;
        $tasaBCV = !empty($d['tasaBCV']) ? (float)$d['tasaBCV'] : 798.33;
        $precioVES = round($precioUSD * $tasaBCV, 2);
        $refPago = !empty($d['refPago']) ? trim($d['refPago']) : 'REF-' . rand(100000, 999999);

        $stmt = $pdo->prepare("
            INSERT INTO tickets (
                ticket_id, id_usuario, nombre_cliente, email_cliente,
                obra, funcion, sala, asiento, fecha_funcion, hora_funcion,
                precio_usd, precio_ves, tasa_bcv, ref_pago, fecha_emision, hora_emision
            ) VALUES (
                :ticket_id, :id_usuario, :nombre_cliente, :email_cliente,
                :obra, :funcion, :sala, :asiento, :fecha_funcion, :hora_funcion,
                :precio_usd, :precio_ves, :tasa_bcv, :ref_pago, :fecha_emision, :hora_emision
            )
        ");

        $stmt->execute([
            ':ticket_id' => $ticketId,
            ':id_usuario' => $userId,
            ':nombre_cliente' => $nombre,
            ':email_cliente' => $email,
            ':obra' => $obra,
            ':funcion' => $funcion,
            ':sala' => $sala,
            ':asiento' => $asiento,
            ':fecha_funcion' => $fechaFuncion,
            ':hora_funcion' => $horaFuncion,
            ':precio_usd' => $precioUSD,
            ':precio_ves' => $precioVES,
            ':tasa_bcv' => $tasaBCV,
            ':ref_pago' => $refPago,
            ':fecha_emision' => $fechaEmision,
            ':hora_emision' => $horaEmision
        ]);

        $ticket = [
            'ticketId' => $ticketId,
            'userId' => $userId,
            'nombreCliente' => $nombre,
            'emailCliente' => $email,
            'obra' => $obra,
            'funcion' => $funcion,
            'sala' => $sala,
            'asiento' => $asiento,
            'fechaFuncion' => $fechaFuncion,
            'horaFuncion' => $horaFuncion,
            'precioUSD' => $precioUSD,
            'precioVES' => $precioVES,
            'tasaBCV' => $tasaBCV,
            'refPago' => $refPago,
            'fechaEmision' => $fechaEmision,
            'horaEmision' => $horaEmision
        ];

        echo json_encode($ticket, JSON_UNESCAPED_UNICODE);
        exit();
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
