import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function MonitorBarang() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    tanggal_awal: "",
    tanggal_akhir: "",
    barang_id: "all",
    group_by: "daily"
  });
  const [barangList, setBarangList] = useState([]);

  // Set default dates to current month on component mount
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilter((prev) => ({
      ...prev,
      tanggal_awal: firstDay.toISOString().split("T")[0],
      tanggal_akhir: lastDay.toISOString().split("T")[0],
    }));
  }, []);

  // Ambil data barang untuk dropdown
  useEffect(() => {
    fetchBarangList();
  }, []);

  // Ambil data transaksi ketika filter berubah
  useEffect(() => {
    if (filter.tanggal_awal && filter.tanggal_akhir) {
      fetchData();
    }
  }, [filter.tanggal_awal, filter.tanggal_akhir, filter.barang_id, filter.group_by]);

  const fetchBarangList = async () => {
    try {
      const response = await api("getDataBarang", "GET");
      if (response.success) {
        setBarangList(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching barang list:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        tanggal_awal: filter.tanggal_awal,
        tanggal_akhir: filter.tanggal_akhir,
        group_by: filter.group_by
      };

      if (filter.barang_id !== "all") {
        params.barang_id = filter.barang_id;
      }

      const response = await api("getMonitorBarang", "GET", params);

      if (response.success) {
        setData(response.data || []);
      } else {
        console.error("Failed to fetch data");
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching monitor data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilter = () => {
    fetchData();
  };

  const exportToPDF = async () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    setLoading(true);

    try {
      // Dynamic import dengan cara yang benar
      const jsPDFModule = await import("jspdf");
      await import("jspdf-autotable");

      // Beberapa versi jsPDF menggunakan export default, beberapa menggunakan named export
      let jsPDF;
      if (jsPDFModule.default) {
        jsPDF = jsPDFModule.default;
      } else {
        jsPDF = jsPDFModule.jsPDF;
      }

      // Jika masih tidak ada, coba langsung dari module
      if (!jsPDF) {
        jsPDF = jsPDFModule;
      }

      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Judul Laporan
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LAPORAN BARANG TERJUAL', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Koperasi PK Batam', 20, 27);
      pdf.text(`Periode: ${new Date(filter.tanggal_awal).toLocaleDateString('id-ID')} - ${new Date(filter.tanggal_akhir).toLocaleDateString('id-ID')}`, 20, 34);
      pdf.text(`Grouping: ${filter.group_by === 'monthly' ? 'Bulanan' : 'Harian'}`, 20, 41);
      pdf.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 20, 48);

      // Hitung total
      const totalTerjual = data.reduce((sum, item) => sum + (item.total_terjual || 0), 0);
      const totalPendapatan = data.reduce((sum, item) => sum + (item.total_pendapatan || 0), 0);
      const totalKeuntungan = data.reduce((sum, item) => sum + (item.total_keuntungan || 0), 0);
      const totalTransaksi = data.reduce((sum, item) => sum + (item.total_transaksi || 0), 0);

      // Summary Box
      pdf.setFillColor(219, 234, 254);
      pdf.rect(20, 55, 250, 25, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      pdf.text('Total Terjual:', 25, 65);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${totalTerjual} items`, 25, 72);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Pendapatan:', 85, 65);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rp ${totalPendapatan.toLocaleString('id-ID')}`, 85, 72);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Keuntungan:', 145, 65);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Rp ${totalKeuntungan.toLocaleString('id-ID')}`, 145, 72);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Transaksi:', 205, 65);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${totalTransaksi} transaksi`, 205, 72);

      // Siapkan data untuk tabel
      const tableData = data.map((item, index) => [
        index + 1,
        item.nama_barang,
        filter.group_by === 'monthly' ? (item.bulan_label || '-') : (item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : '-'),
        item.total_terjual || 0,
        `Rp ${(item.total_pendapatan || 0).toLocaleString('id-ID')}`,
        `Rp ${(item.total_keuntungan || 0).toLocaleString('id-ID')}`,
        item.total_transaksi || 0,
        item.pembeli || '-'
      ]);

      // Tambahkan row total di akhir
      tableData.push([
        '',
        'TOTAL',
        '',
        totalTerjual,
        `Rp ${totalPendapatan.toLocaleString('id-ID')}`,
        `Rp ${totalKeuntungan.toLocaleString('id-ID')}`,
        totalTransaksi,
        ''
      ]);

      // Buat tabel dengan autoTable
      pdf.autoTable({
        startY: 85,
        head: [[
          'No', 
          'Nama Barang', 
          filter.group_by === 'monthly' ? 'Bulan' : 'Tanggal',
          'Jumlah Terjual', 
          'Total Pendapatan', 
          'Total Keuntungan', 
          'Jumlah Transaksi', 
          'Pembeli'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        styles: {
          cellPadding: 3,
          lineColor: [209, 213, 219],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 35 },
          5: { cellWidth: 35 },
          6: { cellWidth: 25, halign: 'center' },
          7: { cellWidth: 45 }
        },
        didDrawPage: function (data) {
          // Footer
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text('Dibuat oleh: Sistem Koperasi', 20, pdf.internal.pageSize.height - 10);
          pdf.text(`Halaman ${pdf.internal.getNumberOfPages()}`, pdf.internal.pageSize.width - 30, pdf.internal.pageSize.height - 10);
        },
        willDrawCell: function (data) {
          // Style untuk row total (last row)
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [229, 231, 235];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 9;
          }
        }
      });

      // Simpan PDF
      const fileName = `laporan-barang-${filter.tanggal_awal}-sd-${filter.tanggal_akhir}-${filter.group_by}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Hitung total untuk display di UI
  const totalTerjual = data.reduce(
    (sum, item) => sum + (item.total_terjual || 0),
    0
  );
  const totalPendapatan = data.reduce(
    (sum, item) => sum + (item.total_pendapatan || 0),
    0
  );
  const totalKeuntungan = data.reduce(
    (sum, item) => sum + (item.total_keuntungan || 0),
    0
  );
  const totalTransaksi = data.reduce(
    (sum, item) => sum + (item.total_transaksi || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Monitor Barang Terjual
          </h1>
          <p className="text-gray-600 mt-2">
            Pantau penjualan barang berdasarkan timeline
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={filter.tanggal_awal}
                onChange={(e) =>
                  handleFilterChange("tanggal_awal", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={filter.tanggal_akhir}
                onChange={(e) =>
                  handleFilterChange("tanggal_akhir", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Barang
              </label>
              <select
                value={filter.barang_id}
                onChange={(e) =>
                  handleFilterChange("barang_id", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Barang</option>
                {barangList.map((barang) => (
                  <option key={barang.barang_id} value={barang.barang_id}>
                    {barang.nama_barang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelompokkan Berdasarkan
              </label>
              <select
                value={filter.group_by}
                onChange={(e) =>
                  handleFilterChange("group_by", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">Harian</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={handleApplyFilter}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
              >
                Terapkan Filter
              </button>
              <button
                onClick={exportToPDF}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                title="Export to PDF"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Terjual
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalTerjual} items
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Pendapatan
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {totalPendapatan.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Keuntungan
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp {totalKeuntungan.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Transaksi
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalTransaksi} transaksi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Tidak ada data
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tidak ada data penjualan untuk periode yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Barang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {filter.group_by === 'monthly' ? 'Bulan' : 'Tanggal'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Terjual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Pendapatan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Keuntungan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Transaksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pembeli
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.nama_barang}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {filter.group_by === 'monthly' ? item.bulan_label : new Date(item.tanggal).toLocaleDateString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.total_terjual}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Rp {item.total_pendapatan.toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Rp {item.total_keuntungan.toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.total_transaksi}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={item.pembeli}>
                          {item.pembeli || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}