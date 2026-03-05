<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$host = 'sql213.infinityfree.com';
$dbname = 'if0_41211937_billing';
$username = 'if0_41211937';
$password = 'efxsGB96nPWyGF1';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected successfully.\n";

    // Add columns if they don't exist
    $stmtInfo = $pdo->query("SHOW COLUMNS FROM `users`");
    $existingDbCols = $stmtInfo->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('otp_code', $existingDbCols)) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `otp_code` VARCHAR(10)");
        echo "Added otp_code column.\n";
    } else {
        echo "otp_code exists.\n";
    }

    if (!in_array('otp_expiry', $existingDbCols)) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `otp_expiry` DATETIME");
        echo "Added otp_expiry column.\n";
    } else {
        echo "otp_expiry exists.\n";
    }

} catch (PDOException $e) {
    echo "Connection Failed: " . $e->getMessage() . "\n";
}
?>