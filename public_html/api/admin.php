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


// Tambahkan method ini di class Admin - BE.Admin.php
public static function getMonitorBarang($conn) {
    $user = getAuthUser(self::$jwt_secret);
    self::requireRole($user, 'admin');

    // Get filter parameters
    $tanggal_awal = $_GET['tanggal_awal'] ?? '';
    $tanggal_akhir = $_GET['tanggal_akhir'] ?? '';
    $barang_id = $_GET['barang_id'] ?? '';
    $group_by = $_GET['group_by'] ?? 'daily'; // 'daily' atau 'monthly'

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

    // Tentukan grouping berdasarkan pilihan
    if ($group_by === 'monthly') {
        // Group by bulan - PERBAIKAN: Gunakan DATE_FORMAT yang konsisten
        $sql = "SELECT 
                    b.barang_id,
                    b.nama_barang,
                    DATE_FORMAT(t.created_at, '%Y-%m') as bulan,
                    DATE_FORMAT(t.created_at, '%M %Y') as bulan_label,
                    SUM(td.jumlah) as total_terjual,
                    SUM(td.subtotal) as total_pendapatan,
                    SUM(td.keuntungan) as total_keuntungan,
                    COUNT(DISTINCT t.transaksi_id) as total_transaksi,
                    GROUP_CONCAT(DISTINCT a.nama_lengkap SEPARATOR ', ') as pembeli
                FROM transaksi_detail td
                JOIN transaksi t ON td.transaksi_id = t.transaksi_id
                JOIN barang b ON td.barang_id = b.barang_id
                JOIN anggota a ON t.anggota_id = a.anggota_id
                WHERE $where_clause
                GROUP BY b.barang_id, b.nama_barang, DATE_FORMAT(t.created_at, '%Y-%m'), DATE_FORMAT(t.created_at, '%M %Y')
                ORDER BY bulan DESC, total_terjual DESC";
    } else {
        // Group by harian (default) - PERBAIKAN: Tambahkan bulan_label untuk konsistensi
        $sql = "SELECT 
                    b.barang_id,
                    b.nama_barang,
                    DATE(t.created_at) as tanggal,
                    DATE_FORMAT(t.created_at, '%M %Y') as bulan_label,
                    SUM(td.jumlah) as total_terjual,
                    SUM(td.subtotal) as total_pendapatan,
                    SUM(td.keuntungan) as total_keuntungan,
                    COUNT(DISTINCT t.transaksi_id) as total_transaksi,
                    GROUP_CONCAT(DISTINCT a.nama_lengkap SEPARATOR ', ') as pembeli
                FROM transaksi_detail td
                JOIN transaksi t ON td.transaksi_id = t.transaksi_id
                JOIN barang b ON td.barang_id = b.barang_id
                JOIN anggota a ON t.anggota_id = a.anggota_id
                WHERE $where_clause
                GROUP BY b.barang_id, b.nama_barang, DATE(t.created_at), DATE_FORMAT(t.created_at, '%M %Y')
                ORDER BY tanggal DESC, total_terjual DESC";
    }

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
        if ($group_by === 'monthly') {
            $rows[] = [
                'barang_id' => (int)$r['barang_id'],
                'nama_barang' => $r['nama_barang'],
                'bulan' => $r['bulan'],
                'bulan_label' => $r['bulan_label'],
                'total_terjual' => (int)$r['total_terjual'],
                'total_pendapatan' => (float)$r['total_pendapatan'],
                'total_keuntungan' => (float)$r['total_keuntungan'],
                'total_transaksi' => (int)$r['total_transaksi'],
                'pembeli' => $r['pembeli']
            ];
        } else {
            $rows[] = [
                'barang_id' => (int)$r['barang_id'],
                'nama_barang' => $r['nama_barang'],
                'tanggal' => $r['tanggal'],
                'bulan_label' => $r['bulan_label'],
                'total_terjual' => (int)$r['total_terjual'],
                'total_pendapatan' => (float)$r['total_pendapatan'],
                'total_keuntungan' => (float)$r['total_keuntungan'],
                'total_transaksi' => (int)$r['total_transaksi'],
                'pembeli' => $r['pembeli']
            ];
        }
    }
    
    $stmt->close();
    sendResponse(true, [
        "data" => $rows,
        "group_by" => $group_by
    ]);
}
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

    // Query data SEMUA tanpa pagination - DIPERBAIKI
    $sql = "SELECT 
                sd.shu_id,
                sd.anggota_id,
                sd.tahun,
                COALESCE(sd.shu_60_percent, 0) as shu_60_percent,
                COALESCE(sd.shu_10_percent, 0) as shu_10_percent, 
                COALESCE(sd.shu_30_percent, 0) as shu_30_percent,
                sd.created_at,
                a.nama_lengkap as nama_anggota,  -- ✅ Diubah: ambil dari tabel anggota
                (COALESCE(sd.shu_60_percent, 0) + COALESCE(sd.shu_10_percent, 0) + COALESCE(sd.shu_30_percent, 0)) as total_shu
            FROM shu_distribusi sd
            JOIN anggota a ON sd.anggota_id = a.anggota_id
            -- ✅ Dihapus: JOIN users u ON a.user_id = u.user_id (tidak perlu)
            WHERE $where_clause
            ORDER BY sd.tahun DESC, sd.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $shuData = [];
    $totalShu60 = 0;
    $totalShu10 = 0;
    $totalShu30 = 0;
    $totalAllShu = 0;
    
    while ($r = $result->fetch_assoc()) {
        $shuData[] = [
            'shu_id' => (int)$r['shu_id'],
            'anggota_id' => (int)$r['anggota_id'],
            'tahun' => $r['tahun'],
            'nama_anggota' => $r['nama_anggota'],  // ✅ Sekarang dapat nama_lengkap dari anggota
            'shu_60_percent' => (float)$r['shu_60_percent'],
            'shu_10_percent' => (float)$r['shu_10_percent'],
            'shu_30_percent' => (float)$r['shu_30_percent'],
            'total_shu' => (float)$r['total_shu'],
            'created_at' => $r['created_at']
        ];
        
        // Hitung total untuk summary
        $totalShu60 += (float)$r['shu_60_percent'];
        $totalShu10 += (float)$r['shu_10_percent'];
        $totalShu30 += (float)$r['shu_30_percent'];
        $totalAllShu += (float)$r['total_shu'];
    }
    
    $stmt->close();

    // Summary data
    $summary = [
        'totalShu60' => $totalShu60,
        'totalShu10' => $totalShu10,
        'totalShu30' => $totalShu30,
        'totalAllShu' => $totalAllShu,
        'totalDistribusi' => count($shuData),
        'tahunAktif' => $tahun ?: 'Semua Tahun'
    ];

    sendResponse(true, [
        "data" => $shuData,
        "summary" => $summary
    ]);
}

private static function calculateShuSummary($conn, $tahun = '', $anggota_id = '') {
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

    // Query untuk summary (hanya hitung shu_60_percent)
    $sql = "SELECT 
                sd.tahun,
                COUNT(*) as jumlah_anggota,
                SUM(COALESCE(sd.shu_60_percent, 0)) as total_60,
                SUM(COALESCE(sd.shu_10_percent, 0)) as total_10,
                SUM(COALESCE(sd.shu_30_percent, 0)) as total_30,
                SUM(COALESCE(sd.shu_60_percent, 0)) as total_all  -- HANYA shu_60_percent yang dijumlah
            FROM shu_distribusi sd
            JOIN anggota a ON sd.anggota_id = a.anggota_id
            JOIN users u ON a.user_id = u.user_id
            WHERE $where_clause
            GROUP BY sd.tahun
            ORDER BY sd.tahun DESC";

    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    
    $summaryByYear = [];
    $totalShu = 0;
    $totalDistribusi = 0;
    $tahunAktif = date('Y');

    while ($r = $result->fetch_assoc()) {
        $summaryByYear[] = [
            'tahun' => $r['tahun'],
            'total_60' => (float)$r['total_60'],
            'total_10' => (float)$r['total_10'],
            'total_30' => (float)$r['total_30'],
            'total_all' => (float)$r['total_all'], // Hanya SHU 60%
            'jumlah_anggota' => (int)$r['jumlah_anggota']
        ];
        
        $totalShu += (float)$r['total_all']; // Hanya SHU 60%
        $totalDistribusi += (int)$r['jumlah_anggota'];
        
        if ($r['tahun'] > $tahunAktif) {
            $tahunAktif = $r['tahun'];
        }
    }
    
    $stmt->close();

    return [
        'totalShu' => $totalShu, // Hanya SHU 60%
        'totalDistribusi' => $totalDistribusi,
        'tahunAktif' => $tahunAktif,
        'summaryByYear' => $summaryByYear
    ];
}

}
?>