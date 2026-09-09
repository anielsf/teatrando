<?php
/**
 * API: Autenticación, Roles y Planes en MySQL
 * Roles soportados: Visitante, Usuario, Crítico, Admin
 * Planes soportados: Plan Básico (Gratis), Plan Bambalinas, Plan Crítico / VIP
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

$data = getJsonInput();
$action = $data['action'] ?? '';
$email = strtolower(trim($data['email'] ?? ''));

try {
    // 1. Registro
    if ($action === 'register') {
        $nombre = trim($data['nombre'] ?? '');
        $password = trim($data['password'] ?? '');

        if (!$nombre || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nombre, correo y contraseña son obligatorios.']);
            exit();
        }

        // Verificar existencia
        $checkStmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
        $checkStmt->execute([':email' => $email]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El correo electrónico ya se encuentra registrado.']);
            exit();
        }

        $userId = 'USR-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        
        // Asignación de rol inicial inteligente
        $rol = 'Usuario';
        $plan = 'Plan Básico (Gratis)';

        if (strpos($email, 'admin') !== false) {
            $rol = 'Admin';
            $plan = 'Plan Crítico / VIP';
        } elseif (strpos($email, 'critico') !== false || !empty($data['esCritico'])) {
            $rol = 'Crítico';
            $plan = 'Plan Crítico / VIP';
        }

        $stmt = $pdo->prepare("
            INSERT INTO usuarios (id, nombre, email, password, rol, plan_suscripcion) 
            VALUES (:id, :nombre, :email, :password, :rol, :plan)
        ");
        $stmt->execute([
            ':id' => $userId,
            ':nombre' => $nombre,
            ':email' => $email,
            ':password' => $password,
            ':rol' => $rol,
            ':plan' => $plan
        ]);

        echo json_encode([
            'success' => true,
            'usuario' => [
                'id' => $userId,
                'nombre' => $nombre,
                'email' => $email,
                'rol' => $rol,
                'plan' => $plan
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 2. Login
    if ($action === 'login') {
        $password = trim($data['password'] ?? '');

        $stmt = $pdo->prepare("SELECT id, nombre, email, rol, plan_suscripcion as plan FROM usuarios WHERE email = :email AND password = :password");
        $stmt->execute([':email' => $email, ':password' => $password]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Correo o contraseña incorrectos.']);
            exit();
        }

        echo json_encode([
            'success' => true,
            'usuario' => $user
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 3. Actualizar Plan y Rol (Tras pagar suscripción)
    if ($action === 'update_plan') {
        $nuevoPlan = $data['plan'] ?? 'Plan Básico (Gratis)';
        $userId = $data['userId'] ?? '';

        $nuevoRol = 'Usuario';
        if ($nuevoPlan === 'Plan Crítico / VIP') {
            $nuevoRol = 'Crítico';
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET plan_suscripcion = :plan, rol = CASE WHEN rol = 'Admin' THEN 'Admin' ELSE :rol END WHERE id = :id OR email = :email");
        $stmt->execute([
            ':plan' => $nuevoPlan,
            ':rol' => $nuevoRol,
            ':id' => $userId,
            ':email' => $email
        ]);

        echo json_encode(['success' => true, 'rol' => $nuevoRol, 'plan' => $nuevoPlan]);
        exit();
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción no válida']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
