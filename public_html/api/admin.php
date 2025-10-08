<?php
class Admin {
    private static $jwt_secret = "RahasiaSuperRahasia123";

    private static function requireRole($user, $role){
        if(!$user || $user['role'] !== $role) sendResponse(false,"Akses ditolak");
    }

    // Ambil semua data barang
    public static function getDataBarang($conn){
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $res = $conn->query("SELECT barang_id, nama_barang, stok, harga_modal, harga_jual FROM barang");
        $rows = [];
        while($r=$res->fetch_assoc()) $rows[]=$r;
        sendResponse(true,["data"=>$rows]);
    }

    // Tambah barang baru
    public static function tambahBarang($conn){
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $data = getInputData();
        $nama = $conn->real_escape_string($data['nama_barang'] ?? '');
        $stok = intval($data['stok'] ?? 0);
        $harga_modal = floatval($data['harga_modal'] ?? 0);
        $harga_jual = floatval($data['harga_jual'] ?? 0);

        if(!$nama || $stok<0 || $harga_modal<0 || $harga_jual<0)
            sendResponse(false,"Data barang tidak valid");

        $stmt = $conn->prepare("INSERT INTO barang(nama_barang,stok,harga_modal,harga_jual) VALUES(?,?,?,?)");
        $stmt->bind_param("sidd",$nama,$stok,$harga_modal,$harga_jual);
        if($stmt->execute()){
            $stmt->close();
            sendResponse(true,"Barang berhasil ditambahkan");
        }else{
            $stmt->close();
            sendResponse(false,"Gagal menambahkan barang: ".$conn->error);
        }
    }

    // Update data barang
    public static function updateBarang($conn){
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $data = getInputData();
        $id = intval($data['barang_id'] ?? 0);
        $nama = $conn->real_escape_string($data['nama_barang'] ?? '');
        $stok = intval($data['stok'] ?? 0);
        $harga_modal = floatval($data['harga_modal'] ?? 0);
        $harga_jual = floatval($data['harga_jual'] ?? 0);

        if($id<=0 || !$nama || $stok<0 || $harga_modal<0 || $harga_jual<0)
            sendResponse(false,"Data barang tidak valid");

        $stmt = $conn->prepare("UPDATE barang SET nama_barang=?, stok=?, harga_modal=?, harga_jual=? WHERE barang_id=?");
        $stmt->bind_param("sidii",$nama,$stok,$harga_modal,$harga_jual,$id);
        if($stmt->execute()){
            $stmt->close();
            sendResponse(true,"Barang berhasil diperbarui");
        }else{
            $stmt->close();
            sendResponse(false,"Gagal update barang: ".$conn->error);
        }
    }

    // Hapus barang
    public static function hapusBarang($conn){
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $data = getInputData();
        $id = intval($data['barang_id'] ?? 0);
        if($id<=0) sendResponse(false,"ID barang tidak valid");

        $stmt = $conn->prepare("DELETE FROM barang WHERE barang_id=?");
        $stmt->bind_param("i",$id);
        if($stmt->execute()){
            $stmt->close();
            sendResponse(true,"Barang berhasil dihapus");
        }else{
            $stmt->close();
            sendResponse(false,"Gagal hapus barang: ".$conn->error);
        }
    }

    // Ambil semua data anggota
    public static function getDataAnggota($conn){
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $res = $conn->query("SELECT a.anggota_id, u.username, a.saldo, a.hutang, a.shu FROM anggota a JOIN users u ON u.user_id=a.user_id");
        $rows=[];
        while($r=$res->fetch_assoc()) $rows[]=$r;
        sendResponse(true,["data"=>$rows]);
    }

    // Tambah user baru (admin bisa tambah kasir/anggota)
    public static function tambahUser($conn){
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $data = getInputData();
        $username = $conn->real_escape_string($data['username'] ?? '');
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? '';

        if(!$username || !$password || !in_array($role,['kasir','anggota','admin']))
            sendResponse(false,"Data user tidak valid");

        $hash = password_hash($password,PASSWORD_DEFAULT);

        $stmt = $conn->prepare("INSERT INTO users(username,password_hash,role) VALUES(?,?,?)");
        $stmt->bind_param("sss",$username,$hash,$role);
        if($stmt->execute()){
            $user_id = $conn->insert_id;
            $stmt->close();
            // Jika role anggota, buat entry di table anggota
            if($role==='anggota'){
                $stmtA=$conn->prepare("INSERT INTO anggota(user_id,saldo,hutang,shu) VALUES(?,?,?,?)");
                $saldo=0; $hutang=0; $shu=0;
                $stmtA->bind_param("iddd",$user_id,$saldo,$hutang,$shu);
                $stmtA->execute();
                $stmtA->close();
            }
            sendResponse(true,"User berhasil ditambahkan");
        }else{
            $stmt->close();
            sendResponse(false,"Gagal tambah user: ".$conn->error);
        }
    }

    // Update user (misal ganti password, role)
    public static function updateUser($conn){
        $user=getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $data=getInputData();
        $id=intval($data['user_id']??0);
        $username=$conn->real_escape_string($data['username']??'');
        $password=$data['password']??'';
        $role=$data['role']??'';

        if($id<=0 || !$username || !in_array($role,['kasir','anggota','admin'])) sendResponse(false,"Data user tidak valid");

        if($password){
            $hash=password_hash($password,PASSWORD_DEFAULT);
            $stmt=$conn->prepare("UPDATE users SET username=?, password_hash=?, role=? WHERE user_id=?");
            $stmt->bind_param("sssi",$username,$hash,$role,$id);
        }else{
            $stmt=$conn->prepare("UPDATE users SET username=?, role=? WHERE user_id=?");
            $stmt->bind_param("ssi",$username,$role,$id);
        }

        if($stmt->execute()){
            $stmt->close();
            sendResponse(true,"User berhasil diperbarui");
        }else{
            $stmt->close();
            sendResponse(false,"Gagal update user: ".$conn->error);
        }
    }

    // Hapus user
    public static function hapusUser($conn){
        $user=getAuthUser(self::$jwt_secret);
        self::requireRole($user,'admin');

        $data=getInputData();
        $id=intval($data['user_id']??0);
        if($id<=0) sendResponse(false,"ID user tidak valid");

        $stmt=$conn->prepare("DELETE FROM users WHERE user_id=?");
        $stmt->bind_param("i",$id);
        if($stmt->execute()){
            $stmt->close();
            sendResponse(true,"User berhasil dihapus");
        }else{
            $stmt->close();
            sendResponse(false,"Gagal hapus user: ".$conn->error);
        }
    }

    // Ambil setoran kasir yang butuh approval
    public static function getSetoranKasir($conn) {
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user, 'admin');
        
        $res = $conn->query("
            SELECT 
                s.setoran_id as id, 
                s.nominal, 
                u.username as nama_kasir, 
                s.created_at as tanggal,
                s.status
            FROM setoran_kasir s 
            JOIN users u ON s.kasir_id = u.user_id 
            WHERE s.status = 'pending'
            ORDER BY s.created_at DESC
        ");
        
        $rows = [];
        while($r = $res->fetch_assoc()) $rows[] = $r;
        sendResponse(true, ["data" => $rows]);
    }

    // Approve setoran kasir
   public static function approveSetoranKasir($conn) {
    $user = getAuthUser(self::$jwt_secret);
    self::requireRole($user, 'admin');
    $data = getInputData();

    $setoran_id = isset($data['setoran_id']) ? (int)$data['setoran_id'] : 0;
    $admin_id = $user['user_id'] ?? 0;

    if ($setoran_id <= 0) {
        sendResponse(false, "ID setoran tidak valid");
        return;
    }

    $conn->begin_transaction();
    try {
        // Update status setoran
        $stmt = $conn->prepare("
            UPDATE setoran_kasir 
            SET status = 'approved', approved_by = ?
            WHERE setoran_id = ? AND status = 'pending'
        ");
        
        if(!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("ii", $admin_id, $setoran_id);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            throw new Exception("Setoran tidak ditemukan atau sudah diproses");
        }
        $stmt->close();

        $conn->commit();
        sendResponse(true, "Setoran berhasil diapprove");

    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error in approveSetoranKasir: " . $e->getMessage());
        sendResponse(false, "Gagal approve setoran: " . $e->getMessage());
    }
}
    // Topup saldo member dari SHU
    public static function topupMemberSHU($conn) {
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user, 'admin');
        
        $data = getInputData();
        $nama_anggota = $conn->real_escape_string($data['nama_anggota'] ?? '');
        $nominal = floatval($data['nominal'] ?? 0);
        
        if(!$nama_anggota || $nominal <= 0) sendResponse(false, "Data tidak valid");
        
        // Cari anggota berdasarkan username
        $res = $conn->query("
            SELECT a.anggota_id, a.shu, a.saldo 
            FROM anggota a 
            JOIN users u ON a.user_id = u.user_id 
            WHERE u.username = '$nama_anggota'
        ");
        
        if($res->num_rows === 0) sendResponse(false, "Anggota tidak ditemukan");
        
        $anggota = $res->fetch_assoc();
        
        if($anggota['shu'] < $nominal) sendResponse(false, "SHU tidak mencukupi");
        
        // Kurangi SHU dan tambah saldo
        $newSHU = $anggota['shu'] - $nominal;
        $newSaldo = $anggota['saldo'] + $nominal;
        
        $stmt = $conn->prepare("UPDATE anggota SET shu = ?, saldo = ? WHERE anggota_id = ?");
        $stmt->bind_param("ddi", $newSHU, $newSaldo, $anggota['anggota_id']);
        
        if($stmt->execute()) {
            $stmt->close();
            sendResponse(true, "Topup berhasil dilakukan");
        } else {
            $stmt->close();
            sendResponse(false, "Gagal melakukan topup: " . $conn->error);
        }
    }

    // ================= DASHBOARD METHODS =================

    // Ambil data kasir untuk dashboard
    public static function getDataKasir($conn) {
        $user = getAuthUser(self::$jwt_secret);
        self::requireRole($user, 'admin');

        $res = $conn->query("SELECT user_id, username FROM users WHERE role = 'kasir'");
        $rows = [];
        while($r = $res->fetch_assoc()) $rows[] = $r;
        sendResponse(true, ["data" => $rows]);
    }

public static function getTransaksiHariIni($conn) {
    $user = getAuthUser(self::$jwt_secret);
    self::requireRole($user, 'admin');

    $sql = "SELECT 
                COUNT(*) as total_transaksi,
                COALESCE(SUM(total_harga), 0) as total_pendapatan
            FROM transaksi 
            WHERE DATE(created_at) = CURDATE() 
            AND status = 'selesai'";

    $stmt = $conn->prepare($sql);
    if(!$stmt) {
        sendResponse(false, "Query preparation failed: " . $conn->error);
        return;
    }

    if(!$stmt->execute()) {
        sendResponse(false, "Execute failed: " . $stmt->error);
        $stmt->close();
        return;
    }

    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    // PERBAIKAN: Kembalikan dalam format data yang konsisten
    sendResponse(true, [
        "total_transaksi" => (int)$row['total_transaksi'],
        "total_pendapatan" => (float)$row['total_pendapatan']
    ]);
}

// Tambahkan di BE.Admin.php - perbaiki function getLaporanTransaksi
public static function getLaporanTransaksi($conn) {
    $user = getAuthUser(self::$jwt_secret);
    self::requireRole($user, 'admin');

    $data = getInputData();
    $tanggal_awal = $conn->real_escape_string($data['tanggal_awal'] ?? '');
    $tanggal_akhir = $conn->real_escape_string($data['tanggal_akhir'] ?? '');

    // Jika tidak ada filter tanggal, gunakan bulan ini
    if (empty($tanggal_awal) || empty($tanggal_akhir)) {
        $tanggal_awal = date('Y-m-01');
        $tanggal_akhir = date('Y-m-t');
    }

    // Query untuk total transaksi dan pendapatan
    $sql_total = "SELECT 
                    COUNT(*) as total_transaksi,
                    COALESCE(SUM(total_harga), 0) as total_pendapatan
                FROM transaksi 
                WHERE DATE(created_at) BETWEEN ? AND ?
                AND status = 'selesai'";

    $stmt_total = $conn->prepare($sql_total);
    if(!$stmt_total) {
        sendResponse(false, "Query preparation failed: " . $conn->error);
        return;
    }

    $stmt_total->bind_param("ss", $tanggal_awal, $tanggal_akhir);
    $stmt_total->execute();
    $result_total = $stmt_total->get_result();
    $row_total = $result_total->fetch_assoc();
    $stmt_total->close();

    // Query untuk breakdown metode pembayaran
    $sql_breakdown = "SELECT 
                        metode_pembayaran,
                        COALESCE(SUM(total_harga), 0) as total
                    FROM transaksi 
                    WHERE DATE(created_at) BETWEEN ? AND ?
                    AND status = 'selesai'
                    GROUP BY metode_pembayaran";

    $stmt_breakdown = $conn->prepare($sql_breakdown);
    if(!$stmt_breakdown) {
        sendResponse(false, "Query preparation failed: " . $conn->error);
        return;
    }

    $stmt_breakdown->bind_param("ss", $tanggal_awal, $tanggal_akhir);
    $stmt_breakdown->execute();
    $result_breakdown = $stmt_breakdown->get_result();
    
    $breakdown = [
        'cash' => 0,
        'qr' => 0,
        'ewallet' => 0,
        'transfer' => 0,
        'hutang' => 0
    ];

    while($row = $result_breakdown->fetch_assoc()) {
        $metode = $row['metode_pembayaran'];
        $breakdown[$metode] = (float)$row['total'];
    }
    $stmt_breakdown->close();

    // Query untuk breakdown per kasir
    $sql_kasir = "SELECT 
                    u.username as nama_kasir,
                    COUNT(*) as total_transaksi,
                    COALESCE(SUM(t.total_harga), 0) as total_pendapatan,
                    COALESCE(SUM(CASE WHEN t.metode_pembayaran = 'cash' THEN t.total_harga ELSE 0 END), 0) as cash,
                    COALESCE(SUM(CASE WHEN t.metode_pembayaran = 'qr' THEN t.total_harga ELSE 0 END), 0) as qr,
                    COALESCE(SUM(CASE WHEN t.metode_pembayaran = 'ewallet' THEN t.total_harga ELSE 0 END), 0) as ewallet,
                    COALESCE(SUM(CASE WHEN t.metode_pembayaran = 'transfer' THEN t.total_harga ELSE 0 END), 0) as transfer,
                    COALESCE(SUM(CASE WHEN t.metode_pembayaran = 'hutang' THEN t.total_harga ELSE 0 END), 0) as hutang
                FROM transaksi t
                JOIN users u ON t.kasir_id = u.user_id
                WHERE DATE(t.created_at) BETWEEN ? AND ?
                AND t.status = 'selesai'
                GROUP BY t.kasir_id, u.username
                ORDER BY total_pendapatan DESC";

    $stmt_kasir = $conn->prepare($sql_kasir);
    if(!$stmt_kasir) {
        sendResponse(false, "Query preparation failed: " . $conn->error);
        return;
    }

    $stmt_kasir->bind_param("ss", $tanggal_awal, $tanggal_akhir);
    $stmt_kasir->execute();
    $result_kasir = $stmt_kasir->get_result();
    
    $breakdown_kasir = [];
    while($row = $result_kasir->fetch_assoc()) {
        $breakdown_kasir[] = [
            'nama_kasir' => $row['nama_kasir'],
            'total_transaksi' => (int)$row['total_transaksi'],
            'total_pendapatan' => (float)$row['total_pendapatan'],
            'cash' => (float)$row['cash'],
            'qr' => (float)$row['qr'],
            'ewallet' => (float)$row['ewallet'],
            'transfer' => (float)$row['transfer'],
            'hutang' => (float)$row['hutang']
        ];
    }
    $stmt_kasir->close();

    sendResponse(true, [
        "total_transaksi" => (int)$row_total['total_transaksi'],
        "total_pendapatan" => (float)$row_total['total_pendapatan'],
        "breakdown_pembayaran" => $breakdown,
        "breakdown_kasir" => $breakdown_kasir,
        "tanggal_awal" => $tanggal_awal,
        "tanggal_akhir" => $tanggal_akhir
    ]);
}

// Tambahkan method ini di class Admin - BE.Admin.php
public static function getMonitorBarang($conn) {
    $user = getAuthUser(self::$jwt_secret);
    self::requireRole($user, 'admin');

    // Get filter parameters
    $tanggal_awal = $_GET['tanggal_awal'] ?? '';
    $tanggal_akhir = $_GET['tanggal_akhir'] ?? '';
    $barang_id = $_GET['barang_id'] ?? '';

    // Build WHERE clause
    $where_conditions = ["t.status = 'selesai'"];
    $params = [];
    $types = '';

    if (!empty($tanggal_awal) && !empty($tanggal_akhir)) {
        $where_conditions[] = "DATE(t.created_at) BETWEEN ? AND ?";
        $params[] = $tanggal_awal;
        $params[] = $tanggal_akhir;
        $types .= 'ss';
    } else {
        // Default to current month if no date range provided
        $first_day = date('Y-m-01');
        $last_day = date('Y-m-t');
        $where_conditions[] = "DATE(t.created_at) BETWEEN ? AND ?";
        $params[] = $first_day;
        $params[] = $last_day;
        $types .= 'ss';
    }

    if (!empty($barang_id) && $barang_id !== 'all') {
        $where_conditions[] = "td.barang_id = ?";
        $params[] = $barang_id;
        $types .= 'i';
    }

    $where_clause = implode(' AND ', $where_conditions);

    $sql = "SELECT 
                b.nama_barang,
                DATE(t.created_at) as tanggal,
                SUM(td.jumlah) as total_terjual,
                SUM(td.subtotal) as total_pendapatan,
                SUM(td.keuntungan) as total_keuntungan
            FROM transaksi_detail td
            JOIN transaksi t ON td.transaksi_id = t.transaksi_id
            JOIN barang b ON td.barang_id = b.barang_id
            WHERE $where_clause
            GROUP BY b.barang_id, DATE(t.created_at)
            ORDER BY tanggal DESC, total_terjual DESC";

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        sendResponse(false, "Query preparation failed: " . $conn->error);
        return;
    }

    // Bind parameters if any
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        sendResponse(false, "Execute failed: " . $stmt->error);
        $stmt->close();
        return;
    }

    $result = $stmt->get_result();
    $rows = [];
    
    while ($r = $result->fetch_assoc()) {
        $rows[] = [
            'nama_barang' => $r['nama_barang'],
            'tanggal' => $r['tanggal'],
            'total_terjual' => (int)$r['total_terjual'],
            'total_pendapatan' => (float)$r['total_pendapatan'],
            'total_keuntungan' => (float)$r['total_keuntungan']
        ];
    }
    
    $stmt->close();
    sendResponse(true, ["data" => $rows]);
}

// PERBAIKAN: Method getShuDistribusi dengan JOIN yang benar
public static function getShuDistribusi($conn) {
    $user = getAuthUser(self::$jwt_secret);
    self::requireRole($user, 'admin');

    // Get filter parameters (opsional)
    $tahun = $_GET['tahun'] ?? '';
    $anggota_id = $_GET['anggota_id'] ?? '';

    // Build WHERE clause
    $where_conditions = ["1=1"];
    $params = [];
    $types = '';

    if (!empty($tahun) && $tahun !== 'all') {
        $where_conditions[] = "sd.tahun = ?";
        $params[] = $tahun;
        $types .= 's';
    }

    if (!empty($anggota_id) && $anggota_id !== 'all') {
        $where_conditions[] = "sd.anggota_id = ?";
        $params[] = $anggota_id;
        $types .= 'i';
    }

    $where_clause = implode(' AND ', $where_conditions);

    // PERBAIKAN: Query JOIN yang benar - melalui tabel anggota ke users
    $sql = "SELECT 
                sd.shu_id,
                sd.anggota_id,
                sd.tahun,
                COALESCE(sd.shu_60_percent, 0) as shu_60_percent,
                COALESCE(sd.shu_10_percent, 0) as shu_10_percent, 
                COALESCE(sd.shu_30_percent, 0) as shu_30_percent,
                sd.created_at,
                u.username as nama_anggota,
                (COALESCE(sd.shu_60_percent, 0) + COALESCE(sd.shu_10_percent, 0) + COALESCE(sd.shu_30_percent, 0)) as total_shu
            FROM shu_distribusi sd
            JOIN anggota a ON sd.anggota_id = a.anggota_id
            JOIN users u ON a.user_id = u.user_id
            WHERE $where_clause
            ORDER BY sd.tahun DESC, sd.created_at DESC
            LIMIT 20";

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        sendResponse(false, "Query preparation failed: " . $conn->error);
        return;
    }

    // Bind parameters if any
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        sendResponse(false, "Execute failed: " . $stmt->error);
        $stmt->close();
        return;
    }

    $result = $stmt->get_result();
    $shuData = [];
    
    while ($r = $result->fetch_assoc()) {
        $shuData[] = [
            'shu_id' => (int)$r['shu_id'],
            'anggota_id' => (int)$r['anggota_id'],
            'tahun' => $r['tahun'],
            'nama_anggota' => $r['nama_anggota'],
            'shu_60_percent' => (float)$r['shu_60_percent'],
            'shu_10_percent' => (float)$r['shu_10_percent'],
            'shu_30_percent' => (float)$r['shu_30_percent'],
            'total_shu' => (float)$r['total_shu'],
            'created_at' => $r['created_at']
        ];
    }
    
    $stmt->close();

    // Jika tidak ada data, kembalikan array kosong dengan summary
    if (empty($shuData)) {
        sendResponse(true, [
            "data" => [],
            "summary" => [
                "totalShu" => 0,
                "totalDistribusi" => 0,
                "tahunAktif" => date('Y'),
                "summaryByYear" => []
            ]
        ]);
        return;
    }

    // Hitung summary data
    $summary = self::calculateShuSummary($shuData);

    sendResponse(true, [
        "data" => $shuData,
        "summary" => $summary
    ]);
}

private static function calculateShuSummary($shuData) {
    $totalShu = 0;
    $totalDistribusi = count($shuData);
    $summaryByYear = [];
    $tahunAktif = date('Y');

    foreach ($shuData as $item) {
        $totalShu += $item['total_shu'];
        
        $tahun = $item['tahun'];
        if (!isset($summaryByYear[$tahun])) {
            $summaryByYear[$tahun] = [
                'tahun' => $tahun,
                'total_60' => 0,
                'total_10' => 0,
                'total_30' => 0,
                'total_all' => 0,
                'jumlah_anggota' => 0
            ];
        }
        
        $summaryByYear[$tahun]['total_60'] += $item['shu_60_percent'];
        $summaryByYear[$tahun]['total_10'] += $item['shu_10_percent'];
        $summaryByYear[$tahun]['total_30'] += $item['shu_30_percent'];
        $summaryByYear[$tahun]['total_all'] += $item['total_shu'];
        $summaryByYear[$tahun]['jumlah_anggota'] += 1;

        // Update tahun aktif (tahun terbaru)
        if ($tahun > $tahunAktif) {
            $tahunAktif = $tahun;
        }
    }

    return [
        'totalShu' => $totalShu,
        'totalDistribusi' => $totalDistribusi,
        'tahunAktif' => $tahunAktif,
        'summaryByYear' => array_values($summaryByYear)
    ];
}

}
?>