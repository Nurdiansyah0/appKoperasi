<?php
// ==================== CORS HEADERS ====================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    "https://koperasipkbatam.my.id",
    "http://localhost:5173",
    "http://localhost:3000"
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default fallback (conservative)
    header("Access-Control-Allow-Origin: https://koperasipkbatam.my.id");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// TURN OFF ERROR DISPLAY - sangat penting!
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL); // Tetap report errors tapi jangan display

// ==================== ERROR LOGGING FUNCTION ====================
function logError($message, $data = [])
{
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $url = $_SERVER['REQUEST_URI'] ?? 'unknown';

    $logMessage = "=== API ERROR [{$timestamp}] ===\n";
    $logMessage .= "IP: {$ip}\n";
    $logMessage .= "URL: {$url}\n";
    $logMessage .= "Message: {$message}\n";

    if (!empty($data)) {
        $logMessage .= "Data: " . print_r($data, true) . "\n";
    }

    $logMessage .= "====================\n";

    // Gunakan system error log yang sudah di-set di .htaccess
    error_log($logMessage);
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start output buffering
while (ob_get_level())
    ob_end_clean();
ob_start();

// ==================== AUTOLOADER COMPOSER - HARUS DI ATAS SEMUA ====================
$autoloadPaths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php'
];

$autoloaded = false;
foreach ($autoloadPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $autoloaded = true;
        // logError("Composer autoloader loaded: " . $path);
        break;
    }
}

if (!$autoloaded) {
    $errorMsg = "Composer autoload not found";
    logError($errorMsg, ['paths_tried' => $autoloadPaths]);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "System configuration error"]);
    ob_end_flush();
    exit();
}


// Manual require if autoloader failed to load JWT
if (!class_exists('Firebase\JWT\JWT')) {
    $vendorDir = __DIR__ . '/vendor/firebase/php-jwt/src';
    if (file_exists($vendorDir . '/JWT.php')) {
        require_once $vendorDir . '/JWTExceptionWithPayloadInterface.php';
        require_once $vendorDir . '/BeforeValidException.php';
        require_once $vendorDir . '/ExpiredException.php';
        require_once $vendorDir . '/SignatureInvalidException.php';
        require_once $vendorDir . '/Key.php';
        require_once $vendorDir . '/JWT.php';
        logError("Manually loaded JWT library files");
    }
}

// Import JWT classes
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Test endpoint - HARUS di atas semua code lain
if (isset($_GET['action']) && $_GET['action'] == 'test') {
    echo json_encode([
        "success" => true,
        "message" => "API is working",
        "timestamp" => date('Y-m-d H:i:s'),
        "server" => $_SERVER['HTTP_HOST'] ?? 'unknown'
    ]);
    ob_end_flush();
    exit();
}

// Deklarasi global $conn
global $conn;

try {
    // Log request start (Only in debug or for critical actions)
    // logError("API Request Started", [
    //     'method' => $_SERVER['REQUEST_METHOD'],
    //     'action' => $_GET['action'] ?? 'unknown',
    //     'query_string' => $_SERVER['QUERY_STRING'] ?? ''
    // ]);

    // DB connection
    require_once "config.php";

    // Pastikan $conn ada dan valid
    if (!isset($conn) || !($conn instanceof mysqli)) {
        $errorMsg = "DB connection error - Connection object not valid after config";
        logError($errorMsg);
        throw new Exception($errorMsg);
    }

    // Check if connection has errors
    if ($conn->connect_error) {
        $errorMsg = "DB connection failed: " . $conn->connect_error;
        logError($errorMsg);
        throw new Exception($errorMsg);
    }

    // Test connection
    if (!$conn->ping()) {
        $errorMsg = "Database connection is not active";
        logError($errorMsg);
        throw new Exception($errorMsg);
    }

    // Router and Lazy Loader
    $action = $_GET['action'] ?? '';

    // Define which actions belong to which modules
    $kasir_actions = [
        'getDataBarangBelanjaKasir',
        'getPesananAnggota',
        'simpanTransaksiKasir',
        'getAllAnggota',
        'approvePembayaranHutang',
        'getAllPembayaranHutang',
        'setorAdmin',
        'tarikTunai',
        'cariProfilAnggota',
        'buatTransaksiKasir',
        'getDaftarKasir',
        'getHistoryTransaksi',
        'createSerahTerima',
        'getSerahTerimaForMe',
        'rejectSerahTerima',
        'approveSerahTerima',
        'getTransaksiTerbaru',
        'getDashboardKasir'
    ];

    $anggota_actions = [
        'simpanTransaksi',
        'getHistoriTransaksi',
        'getDataBarangBelanja',
        'getProfil',
        'bayarHutang',
        'getHistoriBayarHutang',
        'changePassword',
        'updateProfile'
    ];

    $admin_actions = [
        'getDataBarang',
        'getDataAnggota',
        'tambahBarang',
        'updateBarang',
        'hapusBarang',
        'getSetoranKasir',
        'approveSetoranKasir',
        'topupMemberSHU',
        'getDataKasir',
        'getTransaksiHariIni',
        'getLaporanTransaksi',
        'getMonitorBarang',
        'getDashboardAdmin',
        'getShuDistribusi'
    ];

    if (in_array($action, $kasir_actions)) {
        require_once "kasir.php";
    } elseif (in_array($action, $anggota_actions)) {
        require_once "anggota.php";
    } elseif (in_array($action, $admin_actions)) {
        require_once "admin.php";
    }

} catch (Exception $e) {
    // Clean any output before sending error
    ob_clean();

    // Log the exception before sending response
    logError("Exception in main try-catch: " . $e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
    ob_end_flush();
    exit();
}

// Helper functions
function sendResponse($success, $data = null)
{
    // Log errors in responses
    if (!$success) {
        logError("API Error Response: " . (is_string($data) ? $data : json_encode($data)));
    }

    $resp = ["success" => $success];
    if ($success && $data !== null) {
        $resp = is_array($data) ? array_merge($resp, $data) : ["success" => $success, "message" => $data];
    } elseif (!$success) {
        $resp["error"] = $data;
    }
    echo json_encode($resp);
    exit;
}

function getInputData()
{
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        logError("JSON decode error in getInputData: " . json_last_error_msg());
        return [];
    }
    return $data ?? [];
}

function getAuthUser($jwt_secret = JWT_SECRET)
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!$auth) {
        logError("Authorization header missing");
        return null;
    }

    $token = str_replace('Bearer ', '', $auth);
    if (!$token) {
        logError("Token missing from authorization header");
        return null;
    }

    try {
        $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
        return (array) $decoded;
    } catch (Exception $e) {
        logError("JWT decode error: " . $e->getMessage());
        return null;
    }
}

function getJsonInput()
{
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        logError("JSON decode error in getJsonInput: " . json_last_error_msg());
        return [];
    }
    return $data ?? [];
}

// Router
$action = $_GET['action'] ?? '';

// Log the action being processed
logError("Processing action: " . ($action ?: 'empty action'));

try {
    switch ($action) {
        case 'login':
            $data = getInputData();
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';

            if (!$username || !$password) {
                logError("Login failed: username or password empty");
                sendResponse(false, "Username dan password harus diisi");
            }

            logError("Login attempt for username: " . $username);

            $stmt = $conn->prepare("SELECT user_id, username, password_hash, role FROM users WHERE username = ?");
            if (!$stmt) {
                logError("Prepare statement failed: " . $conn->error);
                sendResponse(false, "Database error");
            }

            $stmt->bind_param("s", $username);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                logError("Login failed: invalid credentials for username: " . $username);
                sendResponse(false, "Username atau password salah");
            }

            if ($user['role'] === 'anggota') {
                $stmtA = $conn->prepare("SELECT anggota_id, saldo, hutang, shu FROM anggota WHERE user_id = ?");
                $stmtA->bind_param("i", $user['user_id']);
                $stmtA->execute();
                $anggota = $stmtA->get_result()->fetch_assoc();
                $stmtA->close();
                if ($anggota)
                    $user = array_merge($user, $anggota);
            }

            // Generate JWT Token
            $payload = [
                "user_id" => $user['user_id'],
                "username" => $user['username'],
                "role" => $user['role'],
                "exp" => time() + (7 * 24 * 60 * 60) // 7 hari
            ];

            $jwt_secret = JWT_SECRET;
            $token = JWT::encode($payload, $jwt_secret, 'HS256');

            logError("Login successful for user: " . $username);
            sendResponse(true, [
                "message" => "Login berhasil",
                "token" => $token,
                "user" => $user
            ]);
            break;

        case 'autoLogin':
            $authUser = getAuthUser();
            if (!$authUser) {
                logError("AutoLogin failed: invalid token");
                sendResponse(false, "Token tidak valid");
            }

            $stmt = $conn->prepare("SELECT user_id, username, role FROM users WHERE user_id = ?");
            $stmt->bind_param("i", $authUser['user_id']);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$user) {
                logError("AutoLogin failed: user not found for ID: " . $authUser['user_id']);
                sendResponse(false, "User tidak ditemukan");
            }

            if ($user['role'] === 'anggota') {
                $stmtA = $conn->prepare("SELECT anggota_id, saldo, hutang, shu FROM anggota WHERE user_id = ?");
                $stmtA->bind_param("i", $user['user_id']);
                $stmtA->execute();
                $anggota = $stmtA->get_result()->fetch_assoc();
                $stmtA->close();
                if ($anggota)
                    $user = array_merge($user, $anggota);
            }

            logError("AutoLogin successful for user: " . $user['username']);
            sendResponse(true, ["user" => $user]);
            break;

        // Kasir routes
        case 'getDataBarangBelanjaKasir':
            logError("Calling Kasir::getDataBarangBelanjaKasir");
            Kasir::getDataBarangBelanjaKasir($conn);
            break;
        case 'getPesananAnggota':
            logError("Calling Kasir::getPesananAnggota");
            Kasir::getPesananAnggota($conn);
            break;
        case 'simpanTransaksiKasir':
            logError("Calling Kasir::simpanTransaksiKasir");
            Kasir::simpanTransaksiKasir($conn);
            break;
        case 'getAllAnggota':
            logError("Calling Kasir::getAllAnggota");
            Kasir::getAllAnggota($conn);
            break;
        case 'approvePembayaranHutang':
            logError("Calling Kasir::approvePembayaranHutang");
            Kasir::approvePembayaranHutang($conn);
            break;
        case 'getAllPembayaranHutang':
            logError("Calling Kasir::getAllPembayaranHutang");
            Kasir::getAllPembayaranHutang($conn);
            break;
        case 'setorAdmin':
            logError("Calling Kasir::setorAdmin");
            Kasir::setorAdmin($conn);
            break;
        case 'tarikTunai':
            logError("Calling Kasir::tarikTunai");
            Kasir::tarikTunai($conn);
            break;
        case 'cariProfilAnggota':
            logError("Calling Kasir::cariProfilAnggota");
            Kasir::cariProfilAnggota($conn);
            break;
        case 'buatTransaksiKasir':
            logError("Calling Kasir::buatTransaksiKasir");
            Kasir::buatTransaksiKasir($conn);
            break;
        case 'getDaftarKasir':
            logError("Calling Kasir::getDaftarKasir");
            Kasir::getDaftarKasir($conn);
            break;
        case 'getHistoryTransaksi':
            logError("Calling Kasir::getHistoryTransaksi");
            Kasir::getHistoryTransaksi($conn);
            break;
        case 'createSerahTerima':
            logError("Calling Kasir:: createSerahTerima");
            Kasir::createSerahTerima($conn);
            break;
        case 'getSerahTerimaForMe':
            logError("Calling Kasir::getSerahTerimaForMe");
            Kasir::getSerahTerimaForMe($conn);
            break;
        case 'rejectSerahTerima':
            logError("Calling Kasir::rejectSerahTerima");
            $input = getJsonInput();
            Kasir::rejectSerahTerima($conn, $input);
            break;
        case 'approveSerahTerima':
            logError("Calling Kasir::approveSerahTerima");
            $input = getJsonInput();
            Kasir::approveSerahTerima($conn, $input);
            break;
        case 'getTransaksiTerbaru':
            logError("Calling Kasir::getTransaksiTerbaru");
            Kasir::getTransaksiTerbaru($conn);
            break;
        case 'getDashboardKasir':
            logError("Calling Kasir::getDashboardKasir");
            Kasir::getDashboardKasir($conn);
            break;

        // Anggota routes
        case 'simpanTransaksi':
            logError("Calling Anggota::simpanTransaksi");
            Anggota::simpanTransaksi($conn);
            break;
        case 'getHistoriTransaksi':
            logError("Calling Anggota::getHistoriTransaksi");
            Anggota::getHistoriTransaksi($conn);
            break;
        case 'getDataBarangBelanja':
            logError("Calling Anggota::getDataBarangBelanja");
            Anggota::getDataBarangBelanja($conn);
            break;
        case 'getProfil':
            logError("Calling Anggota::getProfil");
            Anggota::getProfil($conn);
            break;
        case 'bayarHutang':
            logError("Calling Anggota::bayarHutang");
            Anggota::bayarHutang($conn);
            break;
        case 'getHistoriBayarHutang':
            logError("Calling Anggota::getHistoriBayarHutang");
            Anggota::getHistoriBayarHutang($conn);
            break;
        case 'changePassword':
            logError("Calling Anggota::changePassword");
            Anggota::changePassword($conn);
            break;
        case 'updateProfile':
            logError("Calling Anggota::updateProfile");
            Anggota::updateProfile($conn);
            break;

        // Admin routes
        case 'getDataBarang':
            logError("Calling Admin::getDataBarang");
            Admin::getDataBarang($conn);
            break;
        case 'getDataAnggota':
            logError("Calling Admin::getDataAnggota");
            Admin::getDataAnggota($conn);
            break;
        case 'tambahBarang':
            logError("Calling Admin::tambahBarang");
            Admin::tambahBarang($conn);
            break;
        case 'updateBarang':
            logError("Calling Admin::updateBarang");
            Admin::updateBarang($conn);
            break;
        case 'hapusBarang':
            logError("Calling Admin::hapusBarang");
            Admin::hapusBarang($conn);
            break;
        case 'getSetoranKasir':
            logError("Calling Admin::getSetoranKasir");
            Admin::getSetoranKasir($conn);
            break;
        case 'approveSetoranKasir':
            logError("Calling Admin::approveSetoranKasir");
            Admin::approveSetoranKasir($conn);
            break;
        case 'topupMemberSHU':
            logError("Calling Admin::topupMemberSHU");
            Admin::topupMemberSHU($conn);
            break;

        // Dashboard routes
        case 'getDataKasir':
            logError("Calling Admin::getDataKasir");
            Admin::getDataKasir($conn);
            break;
        case 'getTransaksiHariIni':
            logError("Calling Admin::getTransaksiHariIni");
            Admin::getTransaksiHariIni($conn);
            break;
        case 'getLaporanTransaksi':
            logError("Calling Admin::getLaporanTransaksi");
            Admin::getLaporanTransaksi($conn);
            break;
        case 'getMonitorBarang':
            logError("Calling Admin::getMonitorBarang");
            Admin::getMonitorBarang($conn);
            break;
        case 'getDashboardAdmin':
            logError("Calling Admin::getDashboardAdmin");
            Admin::getDashboardAdmin($conn);
            break;
        case 'getShuDistribusi':
            logError("Calling Admin::getShuDistribusi");
            Admin::getShuDistribusi($conn);
            break;

        default:
            logError("Unknown action requested: " . $action);
            sendResponse(false, "Action tidak dikenali: $action");
            break;
    }
} catch (Exception $e) {
    $errorMsg = "Terjadi kesalahan server: " . $e->getMessage();
    logError($errorMsg, [
        'action' => $action,
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    sendResponse(false, $errorMsg);
}

// Log successful completion
logError("API Request Completed Successfully for action: " . $action);

$conn->close();
ob_end_flush();
?>