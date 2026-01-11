<?php
if (!function_exists('getJsonInput')) {
    function getJsonInput()
    {
        $json = file_get_contents('php://input');
        return json_decode($json, true);
    }
}
class kasir
{
    // JWT Secret is now in config.php as JWT_SECRET


    private static function requireRole($user, $required_role)
    {
        if (!$user || strtolower($user['role']) !== strtolower($required_role)) {
            sendResponse(false, "Akses ditolak: Hanya $required_role yang dapat mengakses. Role Anda: '" . ($user['role'] ?? 'tidak diketahui') . "'");
        }
    }

    public static function getDataBarangBelanjaKasir($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        $sql = "SELECT 
                    barang_id,
                    nama_barang,
                    harga_jual,
                    stok,
                    harga_modal
                FROM barang 
                WHERE stok > 0 
                ORDER BY nama_barang ASC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query gagal: " . $conn->error);
            return;
        }

        if (!$stmt->execute()) {
            sendResponse(false, "Execute gagal: " . $stmt->error);
            $stmt->close();
            return;
        }

        $res = $stmt->get_result();
        $list = [];

        while ($row = $res->fetch_assoc()) {
            $row['harga_jual'] = (float) $row['harga_jual'];
            $row['stok'] = (int) $row['stok'];
            $row['harga_modal'] = (float) $row['harga_modal'];
            $list[] = $row;
        }
        $stmt->close();

        sendResponse(true, ["data" => $list]);
    }

    public static function getPesananAnggota($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        $sql = "SELECT t.transaksi_id, t.anggota_id, t.metode_pembayaran, t.total_harga,
                       a.nama_lengkap AS nama_anggota
                FROM transaksi t
                LEFT JOIN anggota a ON a.anggota_id = t.anggota_id
                WHERE t.status IN ('pending','on_process')
                ORDER BY t.created_at ASC";

        $res = $conn->query($sql);
        $list = [];

        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $trans_id = $row['transaksi_id'];
                $items = [];

                $stmtD = $conn->prepare("
                    SELECT td.barang_id, td.jumlah, td.harga_satuan, 
                           b.nama_barang
                    FROM transaksi_detail td
                    LEFT JOIN barang b ON b.barang_id = td.barang_id
                    WHERE td.transaksi_id = ?
                ");
                if ($stmtD) {
                    $stmtD->bind_param("i", $trans_id);
                    $stmtD->execute();
                    $resD = $stmtD->get_result();
                    while ($d = $resD->fetch_assoc()) {
                        $items[] = [
                            'barang_id' => (int) $d['barang_id'],
                            'nama_barang' => $d['nama_barang'],
                            'jumlah' => (int) $d['jumlah'],
                            'harga_satuan' => (float) $d['harga_satuan'],
                        ];
                    }
                    $stmtD->close();
                } else {
                    error_log("Prepare statement transaksi_detail gagal: " . $conn->error);
                }

                $list[] = [
                    'transaksi_id' => (int) $row['transaksi_id'],
                    'anggota_id' => (int) $row['anggota_id'],
                    'nama_anggota' => $row['nama_anggota'],
                    'metode_pembayaran' => $row['metode_pembayaran'],
                    'total_harga' => (float) $row['total_harga'],
                    'items' => $items
                ];
            }
        }

        sendResponse(true, ["data" => $list]);
    }

    public static function simpanTransaksiKasir($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');
        $data = getInputData();

        error_log("Data received in simpanTransaksiKasir: " . json_encode($data));

        if (!isset($data['transaksi']) || !is_array($data['transaksi']) || count($data['transaksi']) === 0) {
            sendResponse(false, "Data transaksi tidak valid");
        }

        $conn->begin_transaction();
        try {
            $kasir_id = $user['user_id'] ?? 0;
            $processed_transactions = [];

            foreach ($data['transaksi'] as $transaksi) {
                $transaksi_id = intval($transaksi['transaksi_id'] ?? 0);
                if ($transaksi_id <= 0) {
                    throw new Exception("Transaksi ID tidak valid: " . ($transaksi['transaksi_id'] ?? 'null'));
                }

                error_log("Processing transaksi_id: " . $transaksi_id);

                $stmtGet = $conn->prepare("
                SELECT t.*, a.saldo, a.hutang, a.shu 
                FROM transaksi t 
                LEFT JOIN anggota a ON a.anggota_id = t.anggota_id 
                WHERE t.transaksi_id = ? AND t.status IN ('pending','on_process')
            ");
                $stmtGet->bind_param("i", $transaksi_id);
                $stmtGet->execute();
                $transaksiData = $stmtGet->get_result()->fetch_assoc();
                $stmtGet->close();

                if (!$transaksiData) {
                    throw new Exception("Transaksi ID: $transaksi_id tidak ditemukan atau sudah diproses");
                }

                $anggota_id = $transaksiData['anggota_id'];
                $total_harga = (float) $transaksiData['total_harga'];
                $total_keuntungan = (float) $transaksiData['total_keuntungan'];
                $metode_pembayaran = $transaksiData['metode_pembayaran'];
                $saldo_sekarang = (float) $transaksiData['saldo'];

                if ($metode_pembayaran === 'hutang') {
                    if ($saldo_sekarang < $total_harga) {
                        throw new Exception("Saldo tidak cukup untuk memberikan hutang. Saldo: " . $saldo_sekarang . ", Dibutuhkan: " . $total_harga);
                    }

                    $stmtSaldo = $conn->prepare("UPDATE anggota SET saldo = saldo - ? WHERE anggota_id = ?");
                    $stmtSaldo->bind_param("di", $total_harga, $anggota_id);
                    $stmtSaldo->execute();
                    $stmtSaldo->close();

                    $stmtHutang = $conn->prepare("UPDATE anggota SET hutang = hutang + ? WHERE anggota_id = ?");
                    $stmtHutang->bind_param("di", $total_harga, $anggota_id);
                    $stmtHutang->execute();
                    $stmtHutang->close();

                    error_log("Metode HUTANG: Saldo berkurang " . $total_harga . ", Hutang bertambah " . $total_harga);
                } else {
                    error_log("Metode $metode_pembayaran: Tidak ada perubahan saldo/hutang");
                }

                // DISTRIBUSI SHU - PERBAIKAN: Simpan semua persentase ke tabel shu_distribusi
                $shu_60_percent = $total_keuntungan * 0.6;
                $shu_30_percent = $total_keuntungan * 0.30;
                $shu_10_percent = $total_keuntungan * 0.10;

                // Update SHU 60% ke tabel anggota
                $stmtShu = $conn->prepare("UPDATE anggota SET shu = shu + ? WHERE anggota_id = ?");
                $stmtShu->bind_param("di", $shu_60_percent, $anggota_id);
                $stmtShu->execute();
                $stmtShu->close();

                error_log("SHU anggota $anggota_id bertambah: " . $shu_60_percent);

                // SIMPAN DISTRIBUSI LENGKAP KE TABEL shu_distribusi
                if ($anggota_id) {
                    $tahun_sekarang = date('Y');

                    $stmtShuDistribusi = $conn->prepare("
                    INSERT INTO shu_distribusi (anggota_id, tahun, shu_60_percent, shu_30_percent, shu_10_percent, created_at) 
                    VALUES (?, ?, ?, ?, ?, NOW())
                ");
                    $stmtShuDistribusi->bind_param("iiddd", $anggota_id, $tahun_sekarang, $shu_60_percent, $shu_30_percent, $shu_10_percent);
                    $stmtShuDistribusi->execute();
                    $stmtShuDistribusi->close();

                    error_log("Distribusi SHU disimpan: 60%=" . $shu_60_percent . ", 30%=" . $shu_30_percent . ", 10%=" . $shu_10_percent);
                }

                if (!in_array($transaksi_id, $processed_transactions)) {
                    $stmtUpdate = $conn->prepare("
                    UPDATE transaksi 
                    SET status = 'selesai', kasir_id = ?
                    WHERE transaksi_id = ? AND status IN ('pending','on_process')
                ");
                    if (!$stmtUpdate)
                        throw new Exception("Prepare update transaksi gagal: " . $conn->error);

                    $stmtUpdate->bind_param("ii", $kasir_id, $transaksi_id);
                    $stmtUpdate->execute();

                    $affected_rows = $stmtUpdate->affected_rows;
                    error_log("Update transaksi_id: $transaksi_id - Affected rows: $affected_rows");

                    if ($affected_rows === 0) {
                        throw new Exception("Gagal update transaksi ID: $transaksi_id - mungkin sudah selesai atau tidak ditemukan");
                    }

                    $stmtUpdate->close();
                    $processed_transactions[] = $transaksi_id;
                }
            }

            $conn->commit();
            sendResponse(true, ["message" => "Transaksi berhasil diselesaikan", "processed_count" => count($processed_transactions)]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log("Error in simpanTransaksiKasir: " . $e->getMessage());
            sendResponse(false, "Gagal menyimpan transaksi: " . $e->getMessage());
        }
    }

    public static function getAllAnggota($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        $sql = "SELECT 
                    anggota_id,
                    user_id,
                    nama_lengkap,
                    email,
                    saldo,
                    hutang,
                    shu,
                    created_at
                FROM anggota
                ORDER BY nama_lengkap ASC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query gagal: " . $conn->error);
            return;
        }

        if (!$stmt->execute()) {
            sendResponse(false, "Execute gagal: " . $stmt->error);
            $stmt->close();
            return;
        }

        $res = $stmt->get_result();
        $list = [];

        while ($row = $res->fetch_assoc()) {
            $row['saldo'] = (float) $row['saldo'];
            $row['hutang'] = (float) $row['hutang'];
            $row['shu'] = (float) $row['shu'];
            $list[] = $row;
        }
        $stmt->close();

        sendResponse(true, ["data" => $list]);
    }

    public static function approvePembayaranHutang($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        $data = getInputData();
        $pembayaran_id = isset($data['pembayaran_id']) ? (int) $data['pembayaran_id'] : 0;
        $action = isset($data['action']) ? $data['action'] : '';

        if ($pembayaran_id <= 0) {
            sendResponse(false, "ID pembayaran tidak valid");
        }

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("
                SELECT ph.*, a.saldo, a.hutang 
                FROM pembayaran_hutang ph 
                LEFT JOIN anggota a ON a.anggota_id = ph.anggota_id 
                WHERE ph.pembayaran_id = ?
            ");
            $stmt->bind_param("i", $pembayaran_id);
            $stmt->execute();
            $pembayaran = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$pembayaran) {
                throw new Exception("Pembayaran tidak ditemukan");
            }

            $status_sekarang = $pembayaran['status'];
            if ($status_sekarang !== 'pending') {
                throw new Exception("Pembayaran sudah diproses sebelumnya (Status: " . $status_sekarang . ")");
            }

            $anggota_id = $pembayaran['anggota_id'];
            $nominal = (float) $pembayaran['nominal'];
            $kasir_id = $user['user_id'];
            $hutang_sekarang = (float) $pembayaran['hutang'];

            if ($action === 'approve') {
                if ($nominal > $hutang_sekarang) {
                    throw new Exception("Nominal pembayaran (" . $nominal . ") melebihi hutang saat ini (" . $hutang_sekarang . ")");
                }

                $stmt = $conn->prepare("
                    UPDATE pembayaran_hutang 
                    SET status = 'approved', approved_at = NOW(), kasir_id = ? 
                    WHERE pembayaran_id = ? AND status = 'pending'
                ");
                $stmt->bind_param("ii", $kasir_id, $pembayaran_id);
                $stmt->execute();

                if ($stmt->affected_rows === 0) {
                    throw new Exception("Gagal mengupdate status pembayaran. Mungkin sudah diproses oleh kasir lain.");
                }
                $stmt->close();

                $stmtHutang = $conn->prepare("UPDATE anggota SET hutang = hutang - ? WHERE anggota_id = ?");
                $stmtHutang->bind_param("di", $nominal, $anggota_id);
                $stmtHutang->execute();

                if ($stmtHutang->affected_rows === 0) {
                    throw new Exception("Gagal mengurangi hutang");
                }
                $stmtHutang->close();

                $stmtSaldo = $conn->prepare("UPDATE anggota SET saldo = saldo + ? WHERE anggota_id = ?");
                $stmtSaldo->bind_param("di", $nominal, $anggota_id);
                $stmtSaldo->execute();

                if ($stmtSaldo->affected_rows === 0) {
                    throw new Exception("Gagal menambah saldo");
                }
                $stmtSaldo->close();

                error_log("Pembayaran hutang APPROVED: ID $pembayaran_id, Hutang berkurang $nominal, Saldo bertambah $nominal");
            } elseif ($action === 'reject') {
                $stmt = $conn->prepare("
                    UPDATE pembayaran_hutang 
                    SET status = 'rejected', approved_at = NOW(), kasir_id = ? 
                    WHERE pembayaran_id = ? AND status = 'pending'
                ");
                $stmt->bind_param("ii", $kasir_id, $pembayaran_id);
                $stmt->execute();

                if ($stmt->affected_rows === 0) {
                    throw new Exception("Gagal menolak pembayaran. Mungkin sudah diproses oleh kasir lain.");
                }
                $stmt->close();

                error_log("Pembayaran hutang REJECTED: Pembayaran ID $pembayaran_id");
            } else {
                throw new Exception("Action tidak valid. Gunakan 'approve' atau 'reject'");
            }

            $conn->commit();
            sendResponse(true, [
                "message" => "Pembayaran berhasil diproses",
                "status" => $action === 'approve' ? 'approved' : 'rejected',
                "nominal" => $nominal,
                "pembayaran_id" => $pembayaran_id,
                "approved_at" => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log("Error in approvePembayaranHutang: " . $e->getMessage());
            sendResponse(false, "Gagal memproses pembayaran: " . $e->getMessage());
        }
    }

    public static function getAllPembayaranHutang($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        $sql = "SELECT 
                    ph.pembayaran_id, 
                    ph.anggota_id, 
                    ph.kasir_id, 
                    ph.nominal, 
                    ph.status, 
                    ph.approved_at, 
                    ph.created_at,
                    a.nama_lengkap as nama_anggota,
                    u.username as nama_kasir
                FROM pembayaran_hutang ph
                LEFT JOIN anggota a ON a.anggota_id = ph.anggota_id
                LEFT JOIN users u ON u.user_id = ph.kasir_id
                ORDER BY ph.created_at DESC, ph.pembayaran_id DESC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query prepare failed: " . $conn->error);
            return;
        }

        if (!$stmt->execute()) {
            sendResponse(false, "Query execute failed: " . $stmt->error);
            $stmt->close();
            return;
        }

        $res = $stmt->get_result();
        $list = [];
        while ($row = $res->fetch_assoc()) {
            $row['nominal'] = is_null($row['nominal']) ? 0 : (float) $row['nominal'];
            $list[] = $row;
        }
        $stmt->close();

        sendResponse(true, ["data" => $list, "count" => count($list)]);
    }

    public static function setorAdmin($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');
        $data = getInputData();
        $nominal = (float) ($data['nominal'] ?? 0);

        if ($nominal <= 0) {
            sendResponse(false, "Nominal harus > 0");
            return;
        }

        $kasir_id = $user['user_id'] ?? 0;

        // PERBAIKAN: Sesuaikan dengan struktur tabel setoran_kasir yang ada
        // Kolom: setoran_id, kasir_id, nominal, status, approved_by, created_at
        $stmt = $conn->prepare("INSERT INTO setoran_kasir (kasir_id, nominal, status, approved_by, created_at) VALUES (?, ?, 'pending', NULL, NOW())");

        if (!$stmt) {
            sendResponse(false, "Prepare gagal: " . $conn->error);
            return;
        }

        $stmt->bind_param("id", $kasir_id, $nominal);

        if ($stmt->execute()) {
            $id = $conn->insert_id;
            $stmt->close();
            sendResponse(true, [
                "message" => "Setoran berhasil dikirim ke admin",
                "setoran_id" => $id,
                "nominal" => $nominal
            ]);
        } else {
            $error = $stmt->error;
            $stmt->close();
            sendResponse(false, "Gagal menyimpan setoran: " . $error);
        }
    }

    public static function tarikTunai($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');
        $data = getInputData();

        $nominal = (float) ($data['nominal'] ?? 0);
        $anggota_id = isset($data['anggota_id']) ? (int) $data['anggota_id'] : null;

        if ($nominal < 20000) {
            sendResponse(false, "Minimal 20.000");
        }

        if (!$anggota_id) {
            sendResponse(false, "ID anggota required");
        }

        $stmtCheck = $conn->prepare("SELECT saldo FROM anggota WHERE anggota_id = ?");
        $stmtCheck->bind_param("i", $anggota_id);
        $stmtCheck->execute();
        $saldoData = $stmtCheck->get_result()->fetch_assoc();
        $stmtCheck->close();

        if (!$saldoData) {
            sendResponse(false, "Anggota tidak ditemukan");
        }

        if ($saldoData['saldo'] < $nominal) {
            sendResponse(false, "Saldo anggota tidak cukup. Saldo: " . $saldoData['saldo']);
        }

        $kasir_id = $user['user_id'] ?? 0;

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO tarik_tunai (kasir_id, anggota_id, nominal, created_at) VALUES (?, ?, ?, NOW())");
            if (!$stmt) {
                throw new Exception("Prepare gagal: " . $conn->error);
            }
            $stmt->bind_param("iid", $kasir_id, $anggota_id, $nominal);
            $stmt->execute();
            $tarik_id = $conn->insert_id;
            $stmt->close();

            $stmtSaldo = $conn->prepare("UPDATE anggota SET saldo = saldo - ? WHERE anggota_id = ?");
            $stmtSaldo->bind_param("di", $nominal, $anggota_id);
            $stmtSaldo->execute();

            if ($stmtSaldo->affected_rows === 0) {
                throw new Exception("Gagal mengurangi saldo anggota");
            }
            $stmtSaldo->close();

            $conn->commit();

            sendResponse(true, [
                "message" => "Tarik tunai berhasil",
                "tarik_id" => $tarik_id,
                "nominal" => $nominal
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log("Error in tarikTunai: " . $e->getMessage());
            sendResponse(false, "Gagal tarik tunai: " . $e->getMessage());
        }
    }

    public static function cariProfilAnggota($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        $searchTerm = $_GET['search'] ?? $_GET['anggota_id'] ?? '';
        if (empty($searchTerm)) {
            sendResponse(false, "Parameter search atau anggota_id required untuk kasir");
            return;
        }

        $anggota_id = self::findAnggotaBySearch($conn, $searchTerm);
        if (!$anggota_id) {
            sendResponse(false, "Anggota tidak ditemukan");
            return;
        }

        $stmt = $conn->prepare("
            SELECT anggota_id, user_id, nama_lengkap, username, email, 
                   saldo, hutang, shu, created_at, updated_at
            FROM anggota 
            WHERE anggota_id = ? LIMIT 1
        ");
        $stmt->bind_param("i", $anggota_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $profil = $result->fetch_assoc();
        $stmt->close();

        if (!$profil) {
            sendResponse(false, "Profil anggota tidak ditemukan");
            return;
        }

        $profil['saldo'] = (float) $profil['saldo'];
        $profil['hutang'] = (float) $profil['hutang'];
        $profil['shu'] = (float) $profil['shu'];

        sendResponse(true, ["profil" => $profil]);
    }

    private static function findAnggotaBySearch($conn, $searchTerm)
    {
        if (is_numeric($searchTerm)) {
            $stmt = $conn->prepare("SELECT anggota_id FROM anggota WHERE anggota_id = ?");
            $stmt->bind_param("i", $searchTerm);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();

            return $row ? $row['anggota_id'] : null;
        } else {
            $stmt = $conn->prepare("SELECT anggota_id FROM anggota WHERE username = ?");
            $stmt->bind_param("s", $searchTerm);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();

            return $row ? $row['anggota_id'] : null;
        }
    }

    public static function buatTransaksiKasir($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');
        $data = getInputData();

        if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
            sendResponse(false, "Data items tidak lengkap");
            return;
        }

        $anggota_id = isset($data['anggota_id']) ? (int) $data['anggota_id'] : null;
        $items = $data['items'];
        $metode_pembayaran_input = $data['metode_pembayaran'] ?? 'cash';
        $total = (float) ($data['total'] ?? 0);
        $kasir_id = $user['user_id'] ?? 0;

        if ($anggota_id === 0) {
            $anggota_id = null;
        }

        $valid_metode = ['cash', 'qr', 'ewallet', 'transfer', 'hutang'];
        $metode_mapping = [
            'cash' => 'cash',
            'qris' => 'qr',
            'ewallet' => 'ewallet',
            'transfer' => 'transfer',
            'hutang' => 'hutang'
        ];

        $metode_cleaned = trim($metode_pembayaran_input);
        $metode_cleaned = preg_replace('/[^a-zA-Z]/', '', $metode_cleaned);

        $metode_pembayaran = 'cash';
        if (isset($metode_mapping[$metode_cleaned])) {
            $metode_pembayaran = $metode_mapping[$metode_cleaned];
        }

        if (!in_array($metode_pembayaran, $valid_metode)) {
            $metode_pembayaran = 'cash';
        }

        $conn->begin_transaction();
        try {
            $total_harga = 0;
            $total_keuntungan = 0;

            foreach ($items as $item) {
                $barang_id = (int) ($item['barang_id'] ?? 0);
                $jumlah = (int) ($item['jumlah'] ?? 0);
                $harga_satuan = (float) ($item['harga_satuan'] ?? 0);

                $stmtHarga = $conn->prepare("SELECT harga_modal FROM barang WHERE barang_id = ?");
                $stmtHarga->bind_param("i", $barang_id);
                $stmtHarga->execute();
                $barangData = $stmtHarga->get_result()->fetch_assoc();
                $stmtHarga->close();

                $harga_modal = (float) ($barangData['harga_modal'] ?? 0);
                $keuntungan_per_item = $harga_satuan - $harga_modal;

                $subtotal = $harga_satuan * $jumlah;
                $keuntungan = $keuntungan_per_item * $jumlah;

                $total_harga += $subtotal;
                $total_keuntungan += $keuntungan;
            }

            $stmtTransaksi = $conn->prepare("
                INSERT INTO transaksi (anggota_id, total_harga, total_keuntungan, metode_pembayaran, status, kasir_id, created_at) 
                VALUES (?, ?, ?, ?, 'selesai', ?, NOW())
            ");

            $stmtTransaksi->bind_param("iddss", $anggota_id, $total_harga, $total_keuntungan, $metode_pembayaran, $kasir_id);
            $stmtTransaksi->execute();
            $transaksi_id = $conn->insert_id;
            $stmtTransaksi->close();

            foreach ($items as $item) {
                $barang_id = (int) ($item['barang_id'] ?? 0);
                $jumlah = (int) ($item['jumlah'] ?? 0);
                $harga_satuan = (float) ($item['harga_satuan'] ?? 0);

                $stmtHarga = $conn->prepare("SELECT harga_modal FROM barang WHERE barang_id = ?");
                $stmtHarga->bind_param("i", $barang_id);
                $stmtHarga->execute();
                $barangData = $stmtHarga->get_result()->fetch_assoc();
                $stmtHarga->close();

                $harga_modal = (float) ($barangData['harga_modal'] ?? 0);
                $keuntungan_per_item = $harga_satuan - $harga_modal;

                $subtotal = $harga_satuan * $jumlah;
                $keuntungan_detail = $keuntungan_per_item * $jumlah;

                $stmtDetail = $conn->prepare("
                    INSERT INTO transaksi_detail (transaksi_id, barang_id, jumlah, harga_satuan, subtotal, keuntungan) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmtDetail->bind_param("iiiddd", $transaksi_id, $barang_id, $jumlah, $harga_satuan, $subtotal, $keuntungan_detail);
                $stmtDetail->execute();
                $stmtDetail->close();

                $stmtStok = $conn->prepare("UPDATE barang SET stok = stok - ? WHERE barang_id = ?");
                $stmtStok->bind_param("ii", $jumlah, $barang_id);
                $stmtStok->execute();
                $stmtStok->close();
            }

            if ($metode_pembayaran === 'hutang' && $anggota_id) {
                $stmtSaldo = $conn->prepare("UPDATE anggota SET saldo = saldo - ?, hutang = hutang + ? WHERE anggota_id = ?");
                $stmtSaldo->bind_param("ddi", $total_harga, $total_harga, $anggota_id);
                $stmtSaldo->execute();
                $stmtSaldo->close();
            }

            if ($anggota_id) {
                $shu_60_percent = $total_keuntungan * 0.6;

                // Update SHU di tabel anggota (60% dari keuntungan)
                $stmtShu = $conn->prepare("UPDATE anggota SET shu = shu + ? WHERE anggota_id = ?");
                $stmtShu->bind_param("di", $shu_60_percent, $anggota_id);
                $stmtShu->execute();
                $stmtShu->close();

                // Simpan detail distribusi SHU ke tabel shu_distribusi
                $tahun_sekarang = date('Y');
                $shu_10_percent = $total_keuntungan * 0.10;
                $shu_30_percent = $total_keuntungan * 0.30;

                $stmtShuDistribusi = $conn->prepare("
        INSERT INTO shu_distribusi (anggota_id, tahun, shu_60_percent, shu_10_percent, shu_30_percent, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
                $stmtShuDistribusi->bind_param("iiddd", $anggota_id, $tahun_sekarang, $shu_60_percent, $shu_10_percent, $shu_30_percent);
                $stmtShuDistribusi->execute();
                $stmtShuDistribusi->close();
            }
            $conn->commit();

            sendResponse(true, [
                "message" => "Transaksi berhasil disimpan",
                "transaksi_id" => $transaksi_id,
                "total" => $total_harga,
                "total_keuntungan" => $total_keuntungan
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            error_log("Error in buatTransaksiKasir: " . $e->getMessage());
            sendResponse(false, "Gagal menyimpan transaksi: " . $e->getMessage());
        }
    }

    public static function getDaftarKasir($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        // PERBAIKAN: Sesuaikan dengan struktur tabel users yang ada
        $sql = "SELECT user_id, username 
            FROM users 
            WHERE role = 'kasir' AND user_id != ? 
            ORDER BY username"; // Ganti nama_lengkap dengan username

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query gagal: " . $conn->error);
            return;
        }

        $current_user_id = $user['user_id'] ?? 0;
        $stmt->bind_param("i", $current_user_id);

        if (!$stmt->execute()) {
            sendResponse(false, "Execute gagal: " . $stmt->error);
            $stmt->close();
            return;
        }

        $res = $stmt->get_result();
        $kasirList = [];

        while ($row = $res->fetch_assoc()) {
            // Tambahkan nama_lengkap dari username jika kolom nama_lengkap tidak ada
            $row['nama_lengkap'] = $row['username']; // Fallback ke username
            $kasirList[] = $row;
        }
        $stmt->close();

        sendResponse(true, ["data" => $kasirList]);
    }
    public static function getHistoryTransaksi($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        // Ambil parameter filter dari GET atau POST
        $tanggal_awal = $_REQUEST['tanggal_awal'] ?? '';
        $tanggal_akhir = $_REQUEST['tanggal_akhir'] ?? '';
        $jenis_transaksi = $_REQUEST['jenis_transaksi'] ?? '';
        $status = $_REQUEST['status'] ?? '';

        error_log("Received parameters - tanggal_awal: $tanggal_awal, tanggal_akhir: $tanggal_akhir, jenis_transaksi: $jenis_transaksi, status: $status");

        $sql = "SELECT 
                t.transaksi_id,
                t.anggota_id,
                t.total_harga,
                t.total_keuntungan,
                t.metode_pembayaran,
                t.status,
                t.created_at,
                a.nama_lengkap AS nama_anggota,
                u.username AS nama_kasir
            FROM transaksi t
            LEFT JOIN anggota a ON a.anggota_id = t.anggota_id
            LEFT JOIN users u ON u.user_id = t.kasir_id
            WHERE 1=1";

        $params = [];
        $types = '';

        // Filter tanggal awal
        if (!empty($tanggal_awal)) {
            $sql .= " AND DATE(t.created_at) >= ?";
            $params[] = $tanggal_awal;
            $types .= 's';
        }

        // Filter tanggal akhir
        if (!empty($tanggal_akhir)) {
            $sql .= " AND DATE(t.created_at) <= ?";
            $params[] = $tanggal_akhir;
            $types .= 's';
        }

        // Filter jenis transaksi (metode pembayaran)
        if (!empty($jenis_transaksi)) {
            $sql .= " AND t.metode_pembayaran = ?";
            $params[] = $jenis_transaksi;
            $types .= 's';
        }

        // Filter status
        if (!empty($status)) {
            $sql .= " AND t.status = ?";
            $params[] = $status;
            $types .= 's';
        }

        $sql .= " ORDER BY t.created_at DESC";

        error_log("Executing SQL: " . $sql);
        error_log("Parameters: " . json_encode($params));

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            error_log("Query preparation failed: " . $conn->error);
            sendResponse(false, "Query gagal: " . $conn->error);
            return;
        }

        // Bind parameters jika ada
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if (!$stmt->execute()) {
            error_log("Query execution failed: " . $stmt->error);
            sendResponse(false, "Execute gagal: " . $stmt->error);
            $stmt->close();
            return;
        }

        $res = $stmt->get_result();
        $list = [];

        while ($row = $res->fetch_assoc()) {
            $transaksi_id = $row['transaksi_id'];

            // Fetch items for each transaction
            $items = [];
            $stmtItems = $conn->prepare("
                SELECT td.barang_id, td.jumlah, td.harga_satuan, b.nama_barang
                FROM transaksi_detail td
                LEFT JOIN barang b ON b.barang_id = td.barang_id
                WHERE td.transaksi_id = ?
            ");

            if ($stmtItems) {
                $stmtItems->bind_param("i", $transaksi_id);
                $stmtItems->execute();
                $resItems = $stmtItems->get_result();

                while ($item = $resItems->fetch_assoc()) {
                    $items[] = [
                        'barang_id' => (int) $item['barang_id'],
                        'nama_barang' => $item['nama_barang'],
                        'nama_item' => $item['nama_barang'],
                        'jumlah' => (int) $item['jumlah'],
                        'harga_satuan' => (float) $item['harga_satuan']
                    ];
                }
                $stmtItems->close();
            }

            $list[] = [
                'id' => $row['transaksi_id'],
                'transaksi_id' => $row['transaksi_id'],
                'anggota_id' => $row['anggota_id'],
                'total' => (float) $row['total_harga'],
                'total_harga' => (float) $row['total_harga'],
                'total_keuntungan' => (float) $row['total_keuntungan'],
                'jenis_transaksi' => $row['metode_pembayaran'],
                'metode_pembayaran' => $row['metode_pembayaran'],
                'status' => $row['status'],
                'tanggal' => $row['created_at'],
                'created_at' => $row['created_at'],
                'nama_anggota' => $row['nama_anggota'] ?: 'Non-Anggota',
                'nama_kasir' => $row['nama_kasir'] ?: '-',
                'kasir_id' => $row['anggota_id'],
                'items' => $items // Include items array
            ];
        }
        $stmt->close();

        error_log("Found " . count($list) . " transactions");
        sendResponse(true, ["data" => $list]);
    }
    // Di class Kasir, perbaiki fungsi createSerahTerima
    public static function createSerahTerima($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        $input = getJsonInput();

        $kasir_to = $input['kasir_to'] ?? null;
        $hasil_opname = $input['hasil_opname'] ?? null;

        if (!$kasir_to || !$hasil_opname) {
            sendResponse(false, "Data tidak lengkap");
            return;
        }

        // Validasi kasir_to berbeda dengan current user
        $current_user_id = $user['user_id'];
        if ($kasir_to == $current_user_id) {
            sendResponse(false, "Tidak bisa melakukan serah terima ke diri sendiri");
            return;
        }

        // Validasi kasir_to exists dan role kasir
        $checkKasir = "SELECT user_id FROM users WHERE user_id = ? AND role = 'kasir'";
        $stmtCheck = $conn->prepare($checkKasir);
        if (!$stmtCheck) {
            sendResponse(false, "Prepare check kasir failed: " . $conn->error);
            return;
        }

        $stmtCheck->bind_param("i", $kasir_to);

        if (!$stmtCheck->execute()) {
            sendResponse(false, "Execute check kasir failed: " . $stmtCheck->error);
            $stmtCheck->close();
            return;
        }

        $result = $stmtCheck->get_result();

        if ($result->num_rows === 0) {
            sendResponse(false, "Kasir penerima tidak ditemukan atau tidak memiliki role kasir");
            $stmtCheck->close();
            return;
        }
        $stmtCheck->close();

        // Encode hasil_opname ke JSON
        $hasil_opname_json = json_encode($hasil_opname);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(false, "Error encoding JSON: " . json_last_error_msg());
            return;
        }

        $sql = "INSERT INTO serah_terima_kasir 
            (kasir_from, kasir_to, hasil_opname, status, created_at) 
            VALUES (?, ?, ?, 'pending', NOW())";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Prepare failed: " . $conn->error);
            return;
        }

        $stmt->bind_param("iis", $current_user_id, $kasir_to, $hasil_opname_json);

        if ($stmt->execute()) {
            $insert_id = $stmt->insert_id;
            sendResponse(true, "Serah terima berhasil dibuat", ["serah_id" => $insert_id]);
        } else {
            sendResponse(false, "Execute failed: " . $stmt->error);
        }
        $stmt->close();
    }

    // Serah Terima
    public static function getSerahTerimaForMe($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        $current_user_id = $user['user_id'];

        error_log("🔄 getSerahTerimaForMe - User ID: " . $current_user_id);

        try {
            $sql = "SELECT st.*, 
                       u_from.username as kasir_from_username,
                       u_from.username as kasir_from_name,
                       u_to.username as kasir_to_username
                FROM serah_terima_kasir st 
                JOIN users u_from ON st.kasir_from = u_from.user_id 
                JOIN users u_to ON st.kasir_to = u_to.user_id 
                WHERE st.kasir_to = ? 
                ORDER BY st.created_at DESC";

            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Query gagal: " . $conn->error);
            }

            $stmt->bind_param("i", $current_user_id);

            if (!$stmt->execute()) {
                throw new Exception("Execute gagal: " . $stmt->error);
            }

            $res = $stmt->get_result();
            $serahTerimaList = [];

            while ($row = $res->fetch_assoc()) {
                // Decode hasil_opname dari JSON
                if (isset($row['hasil_opname']) && !empty($row['hasil_opname'])) {
                    $decoded = json_decode($row['hasil_opname'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $row['hasil_opname'] = $decoded;
                        $row['summary'] = $decoded['summary'] ?? [];
                        $row['items'] = $decoded['items'] ?? [];
                    }
                }
                $serahTerimaList[] = $row;
            }

            $stmt->close();

            error_log("✅ Data ditemukan: " . count($serahTerimaList) . " records");

            // PERBAIKAN: Debug lebih detail dan pastikan data dikirim
            error_log("🔍 Data content: " . json_encode($serahTerimaList));

            // Coba response manual dulu
            if (count($serahTerimaList) > 0) {
                $response = [
                    "success" => true,
                    "message" => "Data berhasil diambil",
                    "data" => $serahTerimaList,
                    "debug_count" => count($serahTerimaList),
                    "debug_user" => $current_user_id
                ];
            } else {
                $response = [
                    "success" => true,
                    "message" => "Tidak ada data serah terima",
                    "data" => [],
                    "debug_count" => 0,
                    "debug_user" => $current_user_id
                ];
            }

            error_log("📤 Sending response: " . json_encode($response));

            // Kirim response manual
            header('Content-Type: application/json');
            echo json_encode($response);
            exit;

        } catch (Exception $e) {
            error_log("❌ Error in getSerahTerimaForMe: " . $e->getMessage());

            $response = [
                "success" => false,
                "error" => "Terjadi kesalahan sistem: " . $e->getMessage(),
                "debug_user" => $current_user_id
            ];

            header('Content-Type: application/json');
            echo json_encode($response);
            exit;
        }
    }

    // Approve Serah Terima
    public static function approveSerahTerima($conn, $input)
    {
        $user = getAuthUser(JWT_SECRET);
        // $input is passed mainly from api.php

        $serah_id = $input['serah_id'] ?? null;

        if (!$serah_id) {
            sendResponse(false, "Data tidak lengkap");
            return;
        }

        // Validasi bahwa status saat ini adalah 'pending'
        $checkSql = "SELECT status, kasir_to FROM serah_terima_kasir WHERE serah_id = ?";
        $checkStmt = $conn->prepare($checkSql);
        if (!$checkStmt) {
            sendResponse(false, "Prepare check failed: " . $conn->error);
            return;
        }

        $checkStmt->bind_param("i", $serah_id);

        if (!$checkStmt->execute()) {
            sendResponse(false, "Execute check failed: " . $checkStmt->error);
            $checkStmt->close();
            return;
        }

        // Deklarasi variabel SEBELUM bind_result
        $current_status = null;
        $kasir_to = null;

        $checkStmt->bind_result($current_status, $kasir_to);
        $data_found = $checkStmt->fetch();
        $checkStmt->close();

        // Cek apakah data ditemukan
        if (!$data_found) {
            sendResponse(false, "Data serah terima tidak ditemukan");
            return;
        }

        // Validasi bahwa current user adalah penerima yang berhak approve
        $current_user_id = $user['user_id'];
        if ($kasir_to != $current_user_id) {
            sendResponse(false, "Anda tidak berhak menyetujui serah terima ini");
            return;
        }

        if ($current_status !== 'pending') {
            sendResponse(false, "Hanya data dengan status pending yang dapat disetujui");
            return;
        }

        $sql = "UPDATE serah_terima_kasir 
        SET status = 'approved'
        WHERE serah_id = ? AND kasir_to = ?";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query gagal: " . $conn->error);
            return;
        }

        $stmt->bind_param("ii", $serah_id, $current_user_id);

        if ($stmt->execute()) {
            sendResponse(true, "Opname berhasil disetujui");
        } else {
            sendResponse(false, "Execute gagal: " . $stmt->error);
        }
        $stmt->close();
    }
    // Reject Serah Terima
    public static function rejectSerahTerima($conn, $data)
    {
        $user = getAuthUser(JWT_SECRET);
        $serah_id = $data['serah_id'] ?? null;
        $alasan = $data['alasan'] ?? null;

        if (!$serah_id || !$alasan) {
            sendResponse(false, "Data tidak lengkap");
            return;
        }

        // Validasi bahwa status saat ini adalah 'pending'
        $checkSql = "SELECT status, kasir_to FROM serah_terima_kasir WHERE serah_id = ?";
        $checkStmt = $conn->prepare($checkSql);
        if (!$checkStmt) {
            sendResponse(false, "Prepare check failed: " . $conn->error);
            return;
        }

        $checkStmt->bind_param("i", $serah_id);

        if (!$checkStmt->execute()) {
            sendResponse(false, "Execute check failed: " . $checkStmt->error);
            $checkStmt->close();
            return;
        }

        // Deklarasi variabel SEBELUM bind_result
        $current_status = null;
        $kasir_to = null;

        $checkStmt->bind_result($current_status, $kasir_to);
        $data_found = $checkStmt->fetch();
        $checkStmt->close();

        // Cek apakah data ditemukan
        if (!$data_found) {
            sendResponse(false, "Data serah terima tidak ditemukan");
            return;
        }

        // Validasi bahwa current user adalah penerima yang berhak reject
        $current_user_id = $user['user_id'];
        if ($kasir_to != $current_user_id) {
            sendResponse(false, "Anda tidak berhak menolak serah terima ini");
            return;
        }

        if ($current_status !== 'pending') {
            sendResponse(false, "Hanya data dengan status pending yang dapat ditolak");
            return;
        }

        $sql = "UPDATE serah_terima_kasir 
        SET status = 'rejected', alasan_penolakan = ?
        WHERE serah_id = ? AND kasir_to = ?";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            sendResponse(false, "Query gagal: " . $conn->error);
            return;
        }

        $current_user_id = $user['user_id'];
        $stmt->bind_param("sii", $alasan, $serah_id, $current_user_id);

        if ($stmt->execute()) {
            sendResponse(true, "Opname ditolak. Kasir pengirim diminta opname ulang.");
        } else {
            sendResponse(false, "Execute gagal: " . $stmt->error);
        }
        $stmt->close();
    }


    public static function getDashboardKasir($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        $current_user_id = $user['user_id'];

        error_log("Getting dashboard data for kasir ID: " . $current_user_id);

        // 1. Total Penjualan Hari Ini
        $sql1 = "SELECT COALESCE(SUM(total_harga), 0) as total_penjualan
            FROM transaksi 
            WHERE kasir_id = ? 
            AND DATE(created_at) = CURDATE() 
            AND status = 'selesai'";

        $stmt1 = $conn->prepare($sql1);
        if (!$stmt1) {
            error_log("Prepare failed for sql1: " . $conn->error);
            sendResponse(false, "Query preparation failed");
            return;
        }

        $stmt1->bind_param("i", $current_user_id);
        $stmt1->execute();
        $result1 = $stmt1->get_result();
        $row1 = $result1->fetch_assoc();
        $penjualanHariIni = $row1['total_penjualan'] ?? 0;
        $stmt1->close();

        error_log("Total penjualan hari ini: " . $penjualanHariIni);

        // 2. Total Transaksi Hari Ini
        $sql2 = "SELECT COUNT(*) as total_transaksi
            FROM transaksi 
            WHERE kasir_id = ? 
            AND DATE(created_at) = CURDATE() 
            AND status = 'selesai'";

        $stmt2 = $conn->prepare($sql2);
        if (!$stmt2) {
            error_log("Prepare failed for sql2: " . $conn->error);
            sendResponse(false, "Query preparation failed");
            return;
        }

        $stmt2->bind_param("i", $current_user_id);
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        $row2 = $result2->fetch_assoc();
        $transaksiHariIni = $row2['total_transaksi'] ?? 0;
        $stmt2->close();

        error_log("Total transaksi hari ini: " . $transaksiHariIni);

        // 3. Total Hutang Belum Lunas
        $sql3 = "SELECT COALESCE(SUM(hutang), 0) as total_hutang
            FROM anggota 
            WHERE hutang > 0";

        $stmt3 = $conn->prepare($sql3);
        if (!$stmt3) {
            error_log("Prepare failed for sql3: " . $conn->error);
            sendResponse(false, "Query preparation failed");
            return;
        }

        $stmt3->execute();
        $result3 = $stmt3->get_result();
        $row3 = $result3->fetch_assoc();
        $hutangBelumLunas = $row3['total_hutang'] ?? 0;
        $stmt3->close();

        error_log("Total hutang belum lunas: " . $hutangBelumLunas);

        // 4. Stok Menipis
        $sql4 = "SELECT COUNT(*) as stok_menipis
            FROM barang 
            WHERE stok < 5 AND stok > 0";

        $stmt4 = $conn->prepare($sql4);
        if (!$stmt4) {
            error_log("Prepare failed for sql4: " . $conn->error);
            sendResponse(false, "Query preparation failed");
            return;
        }

        $stmt4->execute();
        $result4 = $stmt4->get_result();
        $row4 = $result4->fetch_assoc();
        $stokMenipis = $row4['stok_menipis'] ?? 0;
        $stmt4->close();

        error_log("Stok menipis: " . $stokMenipis);

        $data = [
            'totalPenjualanHariIni' => (float) $penjualanHariIni,
            'totalTransaksiHariIni' => (int) $transaksiHariIni,
            'hutangBelumLunas' => (float) $hutangBelumLunas,
            'stokMenipis' => (int) $stokMenipis
        ];

        error_log("Final dashboard data: " . json_encode($data));

        // PERBAIKAN: Kembalikan dalam format yang diharapkan frontend
        sendResponse(true, ["data" => $data]);
    }

    public static function getTransaksiTerbaru($conn)
    {
        $user = getAuthUser(JWT_SECRET);
        self::requireRole($user, 'kasir');

        // Get all recent transactions from today
        $sql = "SELECT 
                    t.transaksi_id as id,
                    t.created_at as tanggal,
                    t.total_harga as total,
                    t.metode_pembayaran,
                    t.status,
                    COALESCE(a.nama_lengkap, 'Non-Anggota') as nama_anggota
                FROM transaksi t
                LEFT JOIN anggota a ON t.anggota_id = a.anggota_id
                WHERE DATE(t.created_at) = CURDATE()
                ORDER BY t.created_at DESC
                LIMIT 20";

        $res = $conn->query($sql);
        $transactions = [];

        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $transaksi_id = $row['id'];

                // Fetch items for each transaction
                $items = [];
                $stmtItems = $conn->prepare("
                    SELECT td.barang_id, td.jumlah, td.harga_satuan, b.nama_barang
                    FROM transaksi_detail td
                    LEFT JOIN barang b ON b.barang_id = td.barang_id
                    WHERE td.transaksi_id = ?
                ");

                if ($stmtItems) {
                    $stmtItems->bind_param("i", $transaksi_id);
                    $stmtItems->execute();
                    $resItems = $stmtItems->get_result();

                    while ($item = $resItems->fetch_assoc()) {
                        $items[] = [
                            'barang_id' => (int) $item['barang_id'],
                            'nama_barang' => $item['nama_barang'],
                            'nama_item' => $item['nama_barang'],
                            'jumlah' => (int) $item['jumlah'],
                            'harga_satuan' => (float) $item['harga_satuan']
                        ];
                    }
                    $stmtItems->close();
                }

                $transactions[] = [
                    'id' => (int) $row['id'],
                    'transaksi_id' => (int) $row['id'],
                    'tanggal' => $row['tanggal'],
                    'created_at' => $row['tanggal'],
                    'total' => (float) $row['total'],
                    'total_harga' => (float) $row['total'],
                    'metode_pembayaran' => $row['metode_pembayaran'],
                    'metode' => $row['metode_pembayaran'],
                    'status' => $row['status'],
                    'nama_anggota' => $row['nama_anggota'],
                    'items' => $items
                ];
            }
        }

        error_log("getTransaksiTerbaru: Returning " . count($transactions) . " transactions");
        sendResponse(true, ["data" => $transactions]);
    }
}
