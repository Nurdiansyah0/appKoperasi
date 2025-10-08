<?php
class Anggota
{
    private static $jwt_secret = "RahasiaSuperRahasia123";

    private static function requireRoleAnggota($user)
    {
        if (!$user) {
            sendResponse(false, "Akses ditolak: User tidak ditemukan");
            exit;
        }

        error_log("DEBUG requireRoleAnggota - User structure: " . print_r($user, true));

        $userRole = '';
        if (is_array($user)) {
            $userRole = $user['role'] ?? $user['user_role'] ?? $user['user-type'] ?? '';
        } elseif (is_object($user)) {
            $userRole = $user->role ?? $user->user_role ?? $user->user_type ?? '';
        }

        $userRole = strtolower(trim((string)$userRole));
        error_log("DEBUG requireRoleAnggota - Extracted user role: '$userRole'");

        // PERBAIKAN KHUSUS: Handle typo 'angggota' menjadi 'anggota'
        if ($userRole === 'angggota') {
            $userRole = 'anggota';
            error_log("DEBUG requireRoleAnggota - Fixed typo role from 'angggota' to 'anggota'");
        }

        // Izinkan akses jika role adalah 'anggota' (setelah fix typo)
        if ($userRole === 'anggota') {
            error_log("DEBUG requireRoleAnggota - Akses diterima untuk role: '$userRole'");
            return;
        }

        // Jika role tidak sesuai, coba cari anggota_id sebagai fallback
        $anggota_id = self::resolveAnggotaId($GLOBALS['conn'], $user);
        if ($anggota_id) {
            error_log("DEBUG requireRoleAnggota - Role '$userRole' tidak sesuai tapi punya anggota_id $anggota_id, izinkan akses");
            return;
        }

        $errorMsg = "Akses ditolak: Hanya anggota yang dapat mengakses. Role Anda: '" . $userRole . "'";
        error_log("DEBUG requireRoleAnggota - " . $errorMsg);
        sendResponse(false, $errorMsg);
        exit;
    }

    public static function getDataBarangBelanja($conn)
    {
        $user = getAuthUser(self::$jwt_secret);
        self::requireRoleAnggota($user);

        $res = $conn->query("SELECT barang_id, nama_barang, stok, harga_jual FROM barang");
        $rows = [];
        while ($r = $res->fetch_assoc()) $rows[] = $r;
        sendResponse(true, ["data" => $rows]);
    }

    public static function getProfil($conn)
    {
        error_log("=== DEBUG getProfil START ===");

        $user = getAuthUser(self::$jwt_secret);
        if (!$user) {
            error_log("DEBUG getProfil - Token invalid atau user tidak ditemukan");
            sendResponse(false, "Token invalid");
            return;
        }

        error_log("DEBUG getProfil - User data: " . print_r($user, true));

        // Langsung cari anggota_id berdasarkan user_id dari token
        $user_id = $user['user_id'] ?? null;
        if (!$user_id) {
            sendResponse(false, "User ID tidak ditemukan dalam token");
            return;
        }

        error_log("DEBUG getProfil - Mencari anggota_id untuk user_id: " . $user_id);

        $anggota_id = self::resolveAnggotaId($conn, $user);

        if (!$anggota_id) {
            error_log("DEBUG getProfil - Gagal menemukan anggota_id untuk user_id: " . $user_id);
            sendResponse(false, "Profil anggota tidak ditemukan untuk user ini.");
            return;
        }

        error_log("DEBUG getProfil - Anggota_id ditemukan: " . $anggota_id);

        $stmt = $conn->prepare("SELECT anggota_id, user_id, nama_lengkap, saldo, hutang, shu FROM anggota WHERE anggota_id = ? LIMIT 1");
        if (!$stmt) {
            sendResponse(false, "Prepare statement gagal: " . $conn->error);
            return;
        }

        $stmt->bind_param("i", $anggota_id);
        if (!$stmt->execute()) {
            sendResponse(false, "Execute query gagal: " . $stmt->error);
            $stmt->close();
            return;
        }

        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            sendResponse(false, "Profil tidak ditemukan di database");
            $stmt->close();
            return;
        }

        $profil = $result->fetch_assoc();
        $stmt->close();

        error_log("=== DEBUG getProfil SUCCESS ===");
        sendResponse(true, ["user" => $profil]);
    }

    private static function resolveAnggotaId($conn, $user)
    {
        error_log("DEBUG resolveAnggotaId - Mencari anggota_id untuk user");

        $user_id = null;
        if (is_array($user)) {
            $user_id = $user['user_id'] ?? $user['id'] ?? $user['uid'] ?? $user['userId'] ?? null;
        } elseif (is_object($user)) {
            $user_id = $user->user_id ?? $user->id ?? $user->uid ?? $user->userId ?? null;
        }

        if (!empty($user_id) && $user_id > 0) {
            error_log("DEBUG resolveAnggotaId - Mencari via user_id: " . $user_id);

            $stmt = $conn->prepare("SELECT anggota_id FROM anggota WHERE user_id = ? LIMIT 1");
            if ($stmt) {
                $stmt->bind_param("i", $user_id);
                if ($stmt->execute()) {
                    $result = $stmt->get_result()->fetch_assoc();
                    $stmt->close();

                    if ($result && isset($result['anggota_id'])) {
                        error_log("DEBUG resolveAnggotaId - Ditemukan via user_id: " . $result['anggota_id']);
                        return (int)$result['anggota_id'];
                    } else {
                        error_log("DEBUG resolveAnggotaId - Tidak ditemukan anggota dengan user_id: " . $user_id);
                    }
                } else {
                    error_log("DEBUG resolveAnggotaId - Execute gagal untuk user_id: " . $user_id);
                    $stmt->close();
                }
            } else {
                error_log("DEBUG resolveAnggotaId - Prepare gagal untuk user_id: " . $user_id);
            }
        }

        error_log("DEBUG resolveAnggotaId - Tidak berhasil menemukan anggota_id");
        return null;
    }

    public static function simpanTransaksi($conn)
    {
        $user = getAuthUser(self::$jwt_secret);
        self::requireRoleAnggota($user);

        $data = getInputData();
        if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
            sendResponse(false, "Items transaksi tidak valid");
        }

        $metode = isset($data['metode_pembayaran']) ? $conn->real_escape_string($data['metode_pembayaran']) : 'cash';
        $allowed_methods = ['cash', 'qr', 'ewallet', 'transfer', 'hutang'];
        if (!in_array($metode, $allowed_methods)) {
            sendResponse(false, "Metode pembayaran tidak valid");
        }

        $conn->begin_transaction();
        try {
            $total_harga = 0.0;
            $total_keuntungan = 0.0;
            $detail_rows = [];

            $anggota_id = self::resolveAnggotaId($conn, $user);
            if (!$anggota_id) {
                throw new Exception("Akun anggota tidak ditemukan");
            }

            $stmtBarang = $conn->prepare("SELECT barang_id, nama_barang, stok, harga_jual, harga_modal FROM barang WHERE barang_id=? FOR UPDATE");

            foreach ($data['items'] as $it) {
                $bid = (int)($it['barang_id'] ?? 0);
                $jml = (int)($it['jumlah'] ?? 0);
                if ($bid <= 0 || $jml <= 0) throw new Exception("Item invalid");

                $stmtBarang->bind_param("i", $bid);
                $stmtBarang->execute();
                $row = $stmtBarang->get_result()->fetch_assoc();
                if (!$row) throw new Exception("Barang id $bid tidak ditemukan");
                if ($row['stok'] < $jml) throw new Exception("Stok {$row['nama_barang']} tidak cukup");

                $subtotal = (float)$row['harga_jual'] * $jml;
                $keuntungan = ((float)$row['harga_jual'] - (float)$row['harga_modal']) * $jml;

                $total_harga += $subtotal;
                $total_keuntungan += $keuntungan;

                $detail_rows[] = [
                    'barang_id' => $bid,
                    'jumlah' => $jml,
                    'harga_satuan' => (float)$row['harga_jual'],
                    'subtotal' => $subtotal,
                    'keuntungan' => $keuntungan
                ];
            }
            $stmtBarang->close();

            $status = 'pending';

            $stmt = $conn->prepare("INSERT INTO transaksi(anggota_id, kasir_id, total_harga, total_keuntungan, metode_pembayaran, status, created_at) VALUES(?, NULL, ?, ?, ?, ?, NOW())");
            $stmt->bind_param("iddss", $anggota_id, $total_harga, $total_keuntungan, $metode, $status);
            $stmt->execute();
            $trans_id = $conn->insert_id;
            $stmt->close();

            $stmtD = $conn->prepare("INSERT INTO transaksi_detail(transaksi_id, barang_id, jumlah, harga_satuan, subtotal, keuntungan) VALUES(?, ?, ?, ?, ?, ?)");
            $stmtStok = $conn->prepare("UPDATE barang SET stok = stok - ? WHERE barang_id = ?");

            foreach ($detail_rows as $dr) {
                $stmtD->bind_param("iiiddd", $trans_id, $dr['barang_id'], $dr['jumlah'], $dr['harga_satuan'], $dr['subtotal'], $dr['keuntungan']);
                $stmtD->execute();

                $stmtStok->bind_param("ii", $dr['jumlah'], $dr['barang_id']);
                $stmtStok->execute();
            }
            $stmtD->close();
            $stmtStok->close();

            $conn->commit();

            sendResponse(true, ["message" => "Transaksi berhasil disimpan. Menunggu konfirmasi kasir.", "transaksi_id" => $trans_id]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log("simpanTransaksi error: " . $e->getMessage());
            sendResponse(false, "Gagal menyimpan transaksi: " . $e->getMessage());
        }
    }

    public static function getHistoriTransaksi($conn)
    {
        $user = getAuthUser(self::$jwt_secret);
        self::requireRoleAnggota($user);

        $anggota_id = self::resolveAnggotaId($conn, $user);
        if (!$anggota_id) {
            sendResponse(false, "Profil anggota tidak ditemukan");
            return;
        }

        $stmt = $conn->prepare("
            SELECT t.transaksi_id,t.anggota_id,t.kasir_id,t.total_harga,t.total_keuntungan,
                   t.metode_pembayaran,t.status,t.created_at,u.username nama_anggota,uk.username nama_kasir
            FROM transaksi t
            LEFT JOIN users u ON u.user_id = t.anggota_id
            LEFT JOIN users uk ON uk.user_id = t.kasir_id
            WHERE t.anggota_id = ?
            ORDER BY t.created_at DESC
        ");
        if (!$stmt) {
            sendResponse(false, "Prepare query gagal");
            return;
        }

        $stmt->bind_param("i", $anggota_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $list = [];
        while ($row = $res->fetch_assoc()) {
            $stmtD = $conn->prepare("
                SELECT td.barang_id, td.jumlah, td.harga_satuan, b.nama_barang
                FROM transaksi_detail td
                JOIN barang b ON b.barang_id = td.barang_id
                WHERE td.transaksi_id = ?
            ");
            if ($stmtD) {
                $stmtD->bind_param("i", $row['transaksi_id']);
                $stmtD->execute();
                $resD = $stmtD->get_result();
                $items = [];
                while ($d = $resD->fetch_assoc()) $items[] = $d;
                $stmtD->close();
            } else {
                $items = [];
            }
            $row['items'] = $items;
            $list[] = $row;
        }
        $stmt->close();
        sendResponse(true, ["data" => $list]);
    }

    public static function bayarHutang($conn)
    {
        ini_set('display_errors', 0);
        ini_set('log_errors', 1);

        $user = getAuthUser(self::$jwt_secret);
        if (!$user) {
            sendResponse(false, "Autentikasi gagal: token invalid atau tidak ada");
            return;
        }

        self::requireRoleAnggota($user);

        $data = getInputData();
        if (!is_array($data)) {
            sendResponse(false, "Payload tidak valid");
            return;
        }

        $nominal = 0.0;
        if (isset($data['jumlah'])) $nominal = (float)$data['jumlah'];
        elseif (isset($data['amount'])) $nominal = (float)$data['amount'];

        if ($nominal <= 0) {
            sendResponse(false, "Nominal pembayaran harus lebih dari 0");
            return;
        }

        $anggota_id = self::resolveAnggotaId($conn, $user);
        if (!$anggota_id) {
            sendResponse(false, "Anggota tidak valid");
            return;
        }

        try {
            $stmtChk = $conn->prepare("SELECT hutang FROM anggota WHERE anggota_id = ? LIMIT 1");
            if ($stmtChk) {
                $stmtChk->bind_param("i", $anggota_id);
                $stmtChk->execute();
                $row = $stmtChk->get_result()->fetch_assoc();
                $stmtChk->close();

                if (!$row) {
                    sendResponse(false, "Anggota tidak ditemukan");
                    return;
                }

                if ($nominal > (float)$row['hutang']) {
                    sendResponse(false, "Nominal pembayaran melebihi hutang yang tersedia");
                    return;
                }
            }
        } catch (Exception $e) {
            error_log("bayarHutang chk error: " . $e->getMessage());
            sendResponse(false, "Gagal memeriksa data hutang");
            return;
        }

        try {
            $stmt = $conn->prepare("INSERT INTO pembayaran_hutang (anggota_id, kasir_id, nominal, status, approved_at, created_at) VALUES (?, NULL, ?, 'pending', NULL, NOW())");
            if (!$stmt) {
                error_log("bayarHutang prepare error: " . $conn->error);
                sendResponse(false, "Internal error");
                return;
            }
            $stmt->bind_param("id", $anggota_id, $nominal);
            $stmt->execute();
            $id = $conn->insert_id;
            $stmt->close();

            sendResponse(true, ["message" => "Permintaan bayar hutang berhasil dikirim", "pembayaran_id" => $id]);
        } catch (Exception $e) {
            error_log("bayarHutang error: " . $e->getMessage());
            sendResponse(false, "Gagal buat permintaan pembayaran: " . $e->getMessage());
        }
    }

    public static function getHistoriBayarHutang($conn)
    {
        header('Content-Type: application/json; charset=utf-8');

        $user = getAuthUser(self::$jwt_secret);
        if (!$user) {
            sendResponse(false, "Token invalid");
            return;
        }

        self::requireRoleAnggota($user);

        $anggota_id = self::resolveAnggotaId($conn, $user);
        if (!$anggota_id) {
            sendResponse(false, "Anggota tidak ditemukan");
            return;
        }

        $sql = "SELECT pembayaran_id, anggota_id, kasir_id, nominal, status, approved_at, created_at
                FROM pembayaran_hutang
                WHERE anggota_id = ?
                ORDER BY created_at DESC, pembayaran_id DESC";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query prepare failed: " . $conn->error);
            return;
        }

        $stmt->bind_param("i", $anggota_id);
        if (!$stmt->execute()) {
            sendResponse(false, "Query execute failed: " . $stmt->error);
            $stmt->close();
            return;
        }

        $res = $stmt->get_result();
        $list = [];
        while ($row = $res->fetch_assoc()) {
            $row['nominal'] = is_null($row['nominal']) ? 0 : (float)$row['nominal'];
            $list[] = $row;
        }
        $stmt->close();

        sendResponse(true, ["data" => $list, "count" => count($list)]);
    }

    public static function changePassword($conn)
    {
        $user = getAuthUser(self::$jwt_secret);
        if (!$user) {
            sendResponse(false, "Token invalid");
            return;
        }

        self::requireRoleAnggota($user);

        $data = getInputData();
        if (!is_array($data)) {
            sendResponse(false, "Payload tidak valid");
            return;
        }

        $user_id_payload = isset($data['user_id']) ? (int)$data['user_id'] : null;
        $user_id_token = isset($user['user_id']) ? (int)$user['user_id'] : null;
        if (!$user_id_token || ($user_id_payload && $user_id_payload !== $user_id_token)) {
            sendResponse(false, "User ID tidak valid atau tidak diizinkan");
            return;
        }

        $current = isset($data['current_password']) ? $data['current_password'] : null;
        $newpw   = isset($data['new_password']) ? $data['new_password'] : null;

        if (!$current || !$newpw) {
            sendResponse(false, "Isi password sekarang dan password baru");
            return;
        }
        if (strlen($newpw) < 6) {
            sendResponse(false, "Password baru minimal 6 karakter");
            return;
        }

        // PERBAIKAN: Gunakan password_hash bukan password
        $stmt = $conn->prepare("SELECT password_hash FROM users WHERE user_id = ? LIMIT 1");
        if (!$stmt) {
            sendResponse(false, "Prepare failed: " . $conn->error);
            return;
        }
        $stmt->bind_param("i", $user_id_token);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row || !isset($row['password_hash'])) {
            sendResponse(false, "Akun tidak ditemukan atau password tidak tersedia");
            return;
        }

        $storedHash = $row['password_hash'];

        $isMatch = false;
        if (password_needs_rehash($storedHash, PASSWORD_DEFAULT) || strpos($storedHash, '$2y$') === 0 || strpos($storedHash, '$2a$') === 0) {
            // hashed
            $isMatch = password_verify($current, $storedHash);
        } else {
            // not hashed (legacy) - direct compare (not recommended)
            $isMatch = ($current === $storedHash);
        }

        if (!$isMatch) {
            sendResponse(false, "Password saat ini salah");
            return;
        }

        // hash new password and update
        $newHash = password_hash($newpw, PASSWORD_DEFAULT);

        // PERBAIKAN: Update password_hash bukan password
        $stmtU = $conn->prepare("UPDATE users SET password_hash = ? WHERE user_id = ? LIMIT 1");
        if (!$stmtU) {
            sendResponse(false, "Prepare update password gagal: " . $conn->error);
            return;
        }
        $stmtU->bind_param("si", $newHash, $user_id_token);
        $ok = $stmtU->execute();
        $stmtU->close();

        if (!$ok) {
            sendResponse(false, "Gagal menyimpan password baru");
            return;
        }

        sendResponse(true, ["message" => "Password berhasil diubah"]);
    }

    public static function updateProfile($conn)
    {
        error_log("=== DEBUG updateProfile START ===");

        $user = getAuthUser(self::$jwt_secret);
        if (!$user) {
            error_log("DEBUG updateProfile - Token invalid atau user tidak ditemukan");
            sendResponse(false, "Token invalid");
            return;
        }

        self::requireRoleAnggota($user);

        $data = getInputData();
        if (!is_array($data)) {
            sendResponse(false, "Data tidak valid");
            return;
        }

        error_log("DEBUG updateProfile - Input data: " . print_r($data, true));

        // Ambil user_id dari token
        $user_id = $user['user_id'] ?? null;
        if (!$user_id) {
            sendResponse(false, "User ID tidak ditemukan dalam token");
            return;
        }

        error_log("DEBUG updateProfile - User ID: " . $user_id);

        // Validasi field yang boleh diupdate di tabel users
        $allowed_fields = ['username'];
        $update_fields = [];
        $update_values = [];
        $types = '';

        // Cek dan siapkan field untuk diupdate
        if (isset($data['username']) && !empty(trim($data['username']))) {
            $username = trim($data['username']);
            if (strlen($username) < 3) {
                sendResponse(false, "Username minimal 3 karakter");
                return;
            }

            // Cek apakah username sudah digunakan oleh user lain
            $stmt_check = $conn->prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ? LIMIT 1");
            $stmt_check->bind_param("si", $username, $user_id);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            if ($result_check->num_rows > 0) {
                $stmt_check->close();
                sendResponse(false, "Username sudah digunakan oleh user lain");
                return;
            }
            $stmt_check->close();

            $update_fields[] = "username = ?";
            $update_values[] = $username;
            $types .= 's';
        }

        // Jika tidak ada field yang diupdate
        if (empty($update_fields)) {
            sendResponse(false, "Tidak ada data yang diubah");
            return;
        }

        // Tambahkan user_id ke values untuk WHERE clause
        $update_values[] = $user_id;
        $types .= 'i';

        // Build query update users
        $sql = "UPDATE users SET " . implode(", ", $update_fields) . " WHERE user_id = ? LIMIT 1";
        error_log("DEBUG updateProfile - SQL: " . $sql);
        error_log("DEBUG updateProfile - Values: " . print_r($update_values, true));
        error_log("DEBUG updateProfile - Types: " . $types);

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            error_log("DEBUG updateProfile - Prepare failed: " . $conn->error);
            sendResponse(false, "Gagal mempersiapkan query update");
            return;
        }

        // Bind parameters
        $stmt->bind_param($types, ...$update_values);

        if (!$stmt->execute()) {
            error_log("DEBUG updateProfile - Execute failed: " . $stmt->error);
            sendResponse(false, "Gagal mengupdate profil: " . $stmt->error);
            $stmt->close();
            return;
        }

        $affected_rows = $stmt->affected_rows;
        $stmt->close();

        if ($affected_rows === 0) {
            error_log("DEBUG updateProfile - Tidak ada perubahan data");
            sendResponse(false, "Tidak ada perubahan data atau user tidak ditemukan");
            return;
        }

        error_log("DEBUG updateProfile - Berhasil mengupdate user, affected rows: " . $affected_rows);

        // Ambil data user terbaru
        $stmt_get = $conn->prepare("SELECT user_id, username, role, created_at FROM users WHERE user_id = ? LIMIT 1");
        $stmt_get->bind_param("i", $user_id);
        $stmt_get->execute();
        $result = $stmt_get->get_result();
        $updated_user = $result->fetch_assoc();
        $stmt_get->close();

        // Juga ambil data anggota terkait
        $anggota_id = self::resolveAnggotaId($conn, $user);
        $anggota_data = null;
        if ($anggota_id) {
            $stmt_anggota = $conn->prepare("SELECT anggota_id, user_id, nama_lengkap, saldo, hutang, shu FROM anggota WHERE anggota_id = ? LIMIT 1");
            $stmt_anggota->bind_param("i", $anggota_id);
            $stmt_anggota->execute();
            $result_anggota = $stmt_anggota->get_result();
            $anggota_data = $result_anggota->fetch_assoc();
            $stmt_anggota->close();
        }

        error_log("=== DEBUG updateProfile SUCCESS ===");
        sendResponse(true, [
            "message" => "Profil berhasil diupdate",
            "user" => $updated_user,
            "anggota" => $anggota_data
        ]);
    }
}
