# Product Requirements Document (PRD) Lanjutan: BatikOS V2
**Dokumen Perencanaan Pengembangan Jangka Menengah - Panjang**

## 1. Latar Belakang & Visi
Setelah BatikOS V1 sukses diimplementasikan sebagai sistem *Mini-ERP* (Enterprise Resource Planning) berbasis Google Apps Script yang mencakup modul Inventaris, Produksi, Penjualan, Keuangan, dan Visualizer, langkah selanjutnya adalah meningkatkan otomatisasi, akurasi data, dan integrasi eksternal untuk mendukung skala bisnis yang lebih besar (pembukaan cabang baru atau penjualan *online* masif).

## 2. Rencana Fitur Lanjutan (Fase 2)

### A. Integrasi *Barcode / QR Code Scanner*
- **Tujuan**: Mempercepat proses kasir (POS) dan meminimalisir *human error* saat *stock opname* atau mutasi bahan.
- **Mekanisme**:
  - Pemanfaatan kamera HP/Tablet pengguna melalui API HTML5 Camera untuk memindai kode QR/Barcode.
  - Setiap produk jadi dan gulungan kain bahan baku akan dicetak stiker *barcode* otomatis dari sistem.
- **Modul Terdampak**: Penjualan (Kasir), Inventaris (Mutasi & Cek Stok).

### B. Notifikasi Otomatis via WhatsApp (WA Gateway)
- **Tujuan**: Komunikasi instan dengan pelanggan dan pelaporan cepat ke *Owner*.
- **Mekanisme**:
  - Menggunakan pihak ketiga (seperti Wablas, Fonnte, atau WhatsApp Cloud API) yang terhubung ke Apps Script via Webhook.
  - **Otomatisasi**:
    - Kirim Nota/Struk digital (PDF) langsung ke WA Pelanggan setelah kasir klik "Selesai".
    - Kirim notifikasi peringatan ke WA *Owner* jika ada Permintaan Persetujuan (*Approval*) dari staf.
    - Notifikasi stok bahan baku menipis ke pihak *Purchasing*.

### C. Dasbor Analitik Visual (Grafik & *Chart*)
- **Tujuan**: Memberikan pandangan komprehensif terkait kesehatan bisnis sekilas pandang.
- **Mekanisme**:
  - Integrasi pustaka *Chart.js* atau *ApexCharts* pada menu Dasbor Utama.
  - **Metrik Kunci**:
    - Grafik Tren Penjualan Harian/Bulanan (Garis).
    - Proporsi Penjualan per Kategori Motif Batik (*Pie Chart*).
    - Arus Kas Keluar vs Masuk Bulanan (*Bar Chart*).

### D. Manajemen Penggajian Karyawan & Pembayaran Pengrajin (Payroll)
- **Tujuan**: Menghubungkan modul Produksi (*Work Order*) dengan sistem upah/gaji.
- **Mekanisme**:
  - Modul baru: **SDM & Penggajian**.
  - Mengakalkulasi upah borongan pengrajin (pembatik, pewarna) berdasarkan jumlah penyelesaian *Work Order* secara otomatis.
  - Cetak slip gaji digital.

## 3. Rencana Fitur Jangka Panjang (Fase 3)

### E. Integrasi *Marketplace* (Shopee / Tokopedia / TikTok Shop)
- **Tujuan**: Sinkronisasi stok terpusat. Ketika barang terjual di toko fisik, stok di *marketplace* otomatis berkurang agar tidak terjadi *overselling*.
- **Mekanisme**: API Integration via *webhook* dua arah.

### F. Sistem Multi-Cabang & Multi-Gudang
- **Tujuan**: Mendukung ekspansi toko.
- **Mekanisme**: 
  - Penambahan kolom `Lokasi/Cabang` pada database.
  - Staf *Login* akan diarahkan ke *inventory* cabang masing-masing.
  - Kemampuan transfer stok antar gudang.

## 4. Pertimbangan Teknis & Migrasi Database
Seiring bertambahnya data (jika transaksi mencapai >10.000 baris per bulan), Google Sheets akan mulai terasa lambat (*lagging*). 
- **Saran Skalabilitas**: Saat fase 3 dimulai, *database* disarankan bermigrasi dari Google Sheets menuju **Google Cloud SQL (MySQL/PostgreSQL)** atau **Firebase / Supabase**, sementara *frontend* tetap menggunakan antarmuka yang ada saat ini.

---
*Dokumen ini bersifat dinamis (Living Document) dan dapat diprioritaskan ulang sesuai dengan urgensi bisnis dan ketersediaan anggaran pengembangan.*
