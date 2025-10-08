<?php
$servername = "localhost";
$username   = "koperasi_user";
$password   = "Ma2syndicate";          
$dbname     = "koperasi_db"; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "DB gagal konek: " . $conn->connect_error]));
}
