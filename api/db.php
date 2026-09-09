<?php
/**
 * Conector de Base de Datos MySQL para XAMPP
 * Teatrando - API Backend en PHP
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$port = '3306';
$dbname = 'teatrando';
$username = 'root';
$password = ''; // Contraseña por defecto en XAMPP

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión a MySQL en XAMPP: ' . $e->getMessage(),
        'hint' => 'Asegúrate de que el módulo MySQL esté encendido (Start) en el panel de control de XAMPP y que hayas importado el archivo database/teatrando.sql en phpMyAdmin.'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Helper para leer cuerpo JSON en peticiones POST/PUT
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}
