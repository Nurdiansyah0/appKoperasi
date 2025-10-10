<?php 
header("Content-Type: text/plain");
echo "PHP IS WORKING WITH APACHE\n";
echo "Version: " . phpversion() . "\n";
echo "Server: " . $_SERVER["SERVER_SOFTWARE"] . "\n";
?>
