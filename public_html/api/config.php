<?php
$servername = "";
$username   = "";
$password   = "";          
$dbname     = ""; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "DB gagal konek: " . $conn->connect_error]));
}
