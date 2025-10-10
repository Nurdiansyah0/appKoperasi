<?php
// config.php
$servername = "localhost";
$username   = "dqfqxjrd_admin";
$password   = "Ma2syndicate";          
$dbname     = "dqfqxjrd_koperasi_db";

// Enable detailed error reporting
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Deklarasi global $conn
global $conn;

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // Test connection
    if ($conn->ping()) {
        error_log("=== INFO [".date('Y-m-d H:i:s')."] === MySQLi DB Connection Successful");
    } else {
        throw new Exception("Database connection failed");
    }
    
} catch (Exception $e) {
    $error_message = "DB Connection Error: " . $e->getMessage();
    error_log("=== ERROR [".date('Y-m-d H:i:s')."] === " . $error_message);
    
    // Return JSON error
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    die(json_encode([
        "status" => "error", 
        "message" => "Database connection failed"
    ]));
}

// Koneksi berhasil, $conn sudah tersedia
?>