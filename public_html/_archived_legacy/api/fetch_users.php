<?php
require_once "config.php";
$stmt = $conn->prepare("SELECT user_id, username, role FROM users LIMIT 5");
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    print_r($row);
}
?>
