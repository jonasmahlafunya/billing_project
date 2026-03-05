<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Starting DB Test...<br>";

$host = 'sql213.infinityfree.com';
$dbname = 'if0_41211937_billing';
$username = 'if0_41211937';
$password = 'efxsGB96nPWyGF1';

try {
    echo "Attempting connection...<br>";
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connection successful!<br>";

    echo "Testing query...<br>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($tables) . " tables.<br>";

} catch (PDOException $e) {
    echo "PDO Error: " . $e->getMessage() . "<br>";
} catch (Exception $e) {
    echo "General Error: " . $e->getMessage() . "<br>";
} catch (Error $e) {
    echo "Fatal Error: " . $e->getMessage() . "<br>";
}

echo "Test complete.";
?>