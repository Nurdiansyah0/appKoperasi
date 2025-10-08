<?php
// ==================== CORS HEADERS ====================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start output buffering
if (ob_get_level()) ob_end_clean();
ob_start();

// Test endpoint
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

try {
    // Autoload composer
    $autoloadPaths = [
        __DIR__ . '/vendor/autoload.php', 
        __DIR__ . '/../vendor/autoload.php'
    ];
    
    $autoloaded = false;
    foreach ($autoloadPaths as $path) {
        if (file_exists($path)) {
            require_once $path;
            $autoloaded = true;
            break;
        }
    }
    
    if (!$autoloaded) {
        throw new Exception("Composer autoload not found");
    }

    // DB connection
    require_once "config.php";
    if (!isset($conn) || !($conn instanceof mysqli)) {
        throw new Exception("DB connection error");
    }

    // Include role modules
    require_once "kasir.php";
    require_once "anggota.php";
    require_once "admin.php";

} catch (Exception $e) {
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
    return $data ?? [];
}

function getAuthUser($jwt_secret = "RahasiaSuperRahasia123")
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!$auth) return null;

    $token = str_replace('Bearer ', '', $auth);
    if (!$token) return null;

    try {
        $decoded = JWT::decode($token, new Key($jwt_secret, 'HS256'));
        return (array)$decoded;
    } catch (Exception $e) {
        return null;
    }
}

// Router
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'login':
            $data = getInputData();
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            if (!$username || !$password) sendResponse(false, "Username dan password harus diisi");

            // PERBAIKAN: Gunakan password_hash bukan password
            $stmt = $conn->prepare("SELECT user_id, username, password_hash, role FROM users WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                sendResponse(false, "Username atau password salah");
            }

            if ($user['role'] === 'anggota') {
                $stmtA = $conn->prepare("SELECT anggota_id, saldo, hutang, shu FROM anggota WHERE user_id = ?");
                $stmtA->bind_param("i", $user['user_id']);
                $stmtA->execute();
                $anggota = $stmtA->get_result()->fetch_assoc();
                $stmtA->close();
                if ($anggota) $user = array_merge($user, $anggota);
            }

            $token = JWT::encode([
                "user_id" => $user['user_id'],
                "username" => $user['username'],
                "role" => $user['role'],
                "exp" => time() + 7 * 24 * 60 * 60
            ], "RahasiaSuperRahasia123", "HS256");

            sendResponse(true, [
                "message" => "Login berhasil",
                "token" => $token,
                "user" => $user
            ]);
            break;

        case 'autoLogin':
            $authUser = getAuthUser();
            if (!$authUser) sendResponse(false, "Token tidak valid");

            $stmt = $conn->prepare("SELECT user_id, username, role FROM users WHERE user_id = ?");
            $stmt->bind_param("i", $authUser['user_id']);
            $stmt->execute();
            $user = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$user) sendResponse(false, "User tidak ditemukan");

            if ($user['role'] === 'anggota') {
                $stmtA = $conn->prepare("SELECT anggota_id, saldo, hutang, shu FROM anggota WHERE user_id = ?");
                $stmtA->bind_param("i", $user['user_id']);
                $stmtA->execute();
                $anggota = $stmtA->get_result()->fetch_assoc();
                $stmtA->close();
                if ($anggota) $user = array_merge($user, $anggota);
            }

            sendResponse(true, ["user" => $user]);
            break;

        // Kasir routes - case match
        case 'getDataBarangBelanjaKasir':
            Kasir::getDataBarangBelanjaKasir($conn);
            break;
        case 'getPesananAnggota':
            Kasir::getPesananAnggota($conn);
            break;
        case 'simpanTransaksiKasir':
            Kasir::simpanTransaksiKasir($conn);
            break;
        case 'getAllAnggota':
            Kasir::getAllAnggota($conn);
            break;
        case 'approvePembayaranHutang':
            Kasir::approvePembayaranHutang($conn);
            break;
        case 'getAllPembayaranHutang':
            Kasir::getAllPembayaranHutang($conn);
            break;
        case 'setorAdmin':
            Kasir::setorAdmin($conn);
            break;
        case 'tarikTunai':
            Kasir::tarikTunai($conn);
            break;
        case 'cariProfilAnggota':
            Kasir::cariProfilAnggota($conn);
            break;
        case 'buatTransaksiKasir':
            Kasir::buatTransaksiKasir($conn);
            break;
        case 'getDaftarKasir':
            Kasir::getDaftarKasir($conn);
            break;
        case 'getHistoryTransaksi':
            Kasir::getHistoryTransaksi($conn);
            break;
        case 'getSerahTerimaForMe':
            Kasir::getSerahTerimaForMe($conn);
            break;
        case 'rejectSerahTerima':
            $input = getJsonInput();
            Kasir::rejectSerahTerima($conn, $input);
            break;
        case 'approveSerahTerima':
            $input = getJsonInput();
            Kasir::approveSerahTerima($conn, $input);
            break;
        case 'getTransaksiTerbaru':
            Kasir::getTransaksiTerbaru($conn);
            break;
        case 'getDashboardKasir':
            Kasir::getDashboardKasir($conn);
            break;



        // Anggota routes
        case 'simpanTransaksi':
            Anggota::simpanTransaksi($conn);
            break;
        case 'getHistoriTransaksi':
            Anggota::getHistoriTransaksi($conn);
            break;
        case 'getDataBarangBelanja':
            Anggota::getDataBarangBelanja($conn);
            break;
        case 'getProfil':
            Anggota::getProfil($conn);
            break;
        case 'bayarHutang':
            Anggota::bayarHutang($conn);
            break;
        case 'getHistoriBayarHutang':
            Anggota::getHistoriBayarHutang($conn);
            break;
        case 'changePassword':
            Anggota::changePassword($conn);
            break;
        case 'updateProfile':
            Anggota::updateProfile($conn);
            break;
        // Admin routes
        case 'getDataBarang':
            Admin::getDataBarang($conn);
            break;
        case 'getDataAnggota':
            Admin::getDataAnggota($conn);
            break;
        case 'tambahBarang':
            Admin::tambahBarang($conn);
            break;
        case 'updateBarang':
            Admin::updateBarang($conn);
            break;
        case 'hapusBarang':
            Admin::hapusBarang($conn);
            break;
        case 'getSetoranKasir':
            Admin::getSetoranKasir($conn);
            break;
        case 'approveSetoranKasir':
            Admin::approveSetoranKasir($conn);
            break;
        case 'topupMemberSHU':
            Admin::topupMemberSHU($conn);
            break;

        // Dashboard routes
        case 'getDataKasir':
            Admin::getDataKasir($conn);
            break;
        case 'getTransaksiHariIni':
            Admin::getTransaksiHariIni($conn);
            break;
        case 'getLaporanTransaksi':
            Admin::getLaporanTransaksi($conn);
            break;
        case 'getMonitorBarang':
            Admin::getMonitorBarang($conn);
            break;
        case 'getDashboardAdmin':
            Admin::getDashboardAdmin($conn);
            break;
        case 'getShuDistribusi':
                Admin::getShuDistribusi($conn);
                break;
        default:
            sendResponse(false, "Action tidak dikenali: $action");
            break;
    }
} catch (Exception $e) {
    sendResponse(false, "Terjadi kesalahan server: " . $e->getMessage());
}

$conn->close();
