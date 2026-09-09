<?php
/**
 * API: Procesamiento de Suscripciones y Pagos de Planes (MySQL)
 * Planes: Plan Básico (Gratis), Plan Bambalinas ($9.99), Plan Crítico / VIP ($19.99)
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

try {
    $d = getJsonInput();
    $userId = $d['userId'] ?? 'INVITADO';
    $email = strtolower(trim($d['email'] ?? ''));
    $plan = $d['plan'] ?? 'Plan Bambalinas';
    $precioUSD = (float)($d['precioUSD'] ?? 9.99);
    $tasaBCV = (float)($d['tasaBCV'] ?? 798.33);
    $precioVES = (float)($d['precioVES'] ?? round($precioUSD * $tasaBCV, 2));
    $refPago = trim($d['refPago'] ?? 'REF-PLAN-' . rand(100000, 999999));

    // Determinar nuevo rol según plan
    $nuevoRol = 'Usuario';
    if ($plan === 'Plan Crítico / VIP') {
        $nuevoRol = 'Crítico';
    }

    // 1. Guardar en historial de suscripciones
    $stmtSub = $pdo->prepare("
        INSERT INTO suscripciones (id_usuario, plan, precio_usd, precio_ves, tasa_bcv, ref_pago, estado)
        VALUES (:id_usuario, :plan, :precio_usd, :precio_ves, :tasa_bcv, :ref_pago, 'Activa')
    ");
    $stmtSub->execute([
        ':id_usuario' => $userId,
        ':plan' => $plan,
        ':precio_usd' => $precioUSD,
        ':precio_ves' => $precioVES,
        ':tasa_bcv' => $tasaBCV,
        ':ref_pago' => $refPago
    ]);

    // 2. Actualizar usuario si existe
    if ($userId !== 'INVITADO' || !empty($email)) {
        $stmtUser = $pdo->prepare("
            UPDATE usuarios 
            SET plan_suscripcion = :plan,
                rol = CASE WHEN rol = 'Admin' THEN 'Admin' ELSE :rol END
            WHERE id = :id OR email = :email
        ");
        $stmtUser->execute([
            ':plan' => $plan,
            ':rol' => $nuevoRol,
            ':id' => $userId,
            ':email' => $email
        ]);
    }

    echo json_encode([
        'success' => true,
        'mensaje' => "¡Suscripción activada con éxito al {$plan}!",
        'plan' => $plan,
        'rol' => $nuevoRol,
        'precioUSD' => $precioUSD,
        'precioVES' => $precioVES,
        'refPago' => $refPago,
        'fecha' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
