<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$configPath = __DIR__ . '/api/config.php';
require_once $configPath;

$username = "member_demo";
$password = "member123";
$role = "anggota";
$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Creating user $username / $password ...\n";

// 1. Check if exists
$stmt = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();
$userId = 0;

if ($res->num_rows > 0) {
    echo "User already exists. Updating password.\n";
    $row = $res->fetch_assoc();
    $userId = $row['user_id'];
    $stmtUpd = $conn->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
    $stmtUpd->bind_param("si", $hash, $userId);
    $stmtUpd->execute();
} else {
    echo "Creating new user.\n";
    $stmtIns = $conn->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
    $stmtIns->bind_param("sss", $username, $hash, $role);
    $stmtIns->execute();
    $userId = $conn->insert_id;
}

echo "User ID: $userId\n";

// 2. Ensure anggota record exists
$stmtA = $conn->prepare("SELECT anggota_id FROM anggota WHERE user_id = ?");
$stmtA->bind_param("i", $userId);
$stmtA->execute();
if ($stmtA->get_result()->num_rows == 0) {
    echo "Creating anggota profile.\n";
    $nama = "Member Demo";
    $email = "member@demo.com";
    // Columns: user_id, nama_lengkap, email, saldo, hutang, shu
    $stmtInsA = $conn->prepare("INSERT INTO anggota (user_id, nama_lengkap, email, saldo, hutang, shu) VALUES (?, ?, ?, 1000000, 0, 0)");
    $stmtInsA->bind_param("iss", $userId, $nama, $email);
    if ($stmtInsA->execute()) {
        echo "Anggota profile created.\n";
    } else {
        echo "Error creating anggota profile: " . $conn->error . "\n";
    }
} else {
    echo "Anggota profile already exists.\n";
}

echo "Done.\n";
?>