// SPREADSHEET_ID sudah dideklarasikan di Backend.gs

// === JALANKAN FUNGSI INI SEKALI UNTUK MEMBUAT SEMUA SHEET ===
function setupAllSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  var sheetsData = {
    "Pengguna":       ["ID", "NamaPengguna", "KataSandi", "Peran", "Status", "TanggalDibuat"],
    "Pelanggan":      ["ID", "Nama Instansi", "Nama", "Alamat", "WhatsApp", "Email", "Kota", "Kategori", "TotalBelanja", "TanggalOrderTerakhir", "Status"],
    "Pemasok":        ["ID", "Toko / Supplier", "Nama PIC", "Alamat", "WhatsApp", "Email", "TanggalDibuat"],
    "Produk":         ["ID", "Kode", "Nama", "Kategori", "Motif", "Warna", "Ukuran", "No WO", "HPP", "HargaJual", "URLFoto"],
    "BahanBaku":      ["ID", "Kode", "Nama", "Kategori", "Satuan Beli", "Satuan Pakai", "Rasio Konversi", "IDPemasok", "HargaBeli", "HargaJual", "StokMinimum", "StokSaatIni"],
    "ResepBOM":       ["ID", "IDProduk", "IDBahan", "JumlahDibutuhkan"],
    "POPembelian":    ["ID", "NomorPO", "IDPemasok", "Tanggal", "TotalNilai", "Status", "DibuatOleh"],
    "DetailPO":       ["ID", "ID_PO", "IDBahan", "Jumlah", "Harga", "Subtotal"],
    "MutasiBahan":    ["ID", "Tanggal", "IDBahan", "PerubahanJumlah", "Tipe", "IDReferensi", "Keterangan"],
    "WOProduksi":     ["ID", "NomorWO", "Tanggal", "IDProduk", "TargetJumlah", "TenggatWaktu", "Status"],
    "DetailProduksi": ["ID", "ID_WO", "Tahapan", "Status", "WaktuMulai", "WaktuSelesai", "IDPenanggungJawab", "Keterangan"],
    "BarangJadi":     ["IDProduk", "Jumlah", "LokasiRak", "TerakhirDiperbarui"],
    "SOPenjualan":    ["ID", "NomorSO", "Tanggal", "IDPelanggan", "Status", "TotalNilai"],
    "DetailSO":       ["ID", "ID_SO", "IDProduk", "Jumlah", "Harga", "Subtotal"],
    "Tagihan":        ["ID", "NomorTagihan", "ID_SO", "Tanggal", "JatuhTempo", "Total", "Term Payment", "Status"],
    "Pembayaran":     ["ID", "IDTagihan", "Tanggal", "Metode", "Term Payment", "Nominal", "URLBukti"],
    "ArusKas":        ["ID", "Tanggal", "Tipe", "Kategori", "Nominal", "IDReferensi", "Keterangan"],
    "Pengaturan":     ["Kunci", "Nilai", "Deskripsi"],
    "LogAktivitas":   ["ID", "Waktu", "IDPengguna", "Aksi", "Modul", "Deskripsi"]
  };
  
  for (var name in sheetsData) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheetsData[name]);
      
      // Memberikan format tebal (bold) dan background abu-abu untuk baris judul (header)
      var headerRange = sheet.getRange(1, 1, 1, sheetsData[name].length);
      headerRange.setFontWeight("bold").setBackground("#e0e0e0");
      sheet.setFrozenRows(1);
      
      Logger.log("Sheet '" + name + "' berhasil dibuat.");
    } else {
      Logger.log("Sheet '" + name + "' sudah ada. Dilewati.");
    }
  }
  
  // Buat akun Admin default jika belum ada
  setupDefaultAdmin(ss);
  Logger.log("=== Setup Database Selesai! Semua 19 sheet siap digunakan. ===");
}

function setupDefaultAdmin(ss) {
  var sheet = ss.getSheetByName("Pengguna");
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) { // Hanya ada header
      var id = generateID("USR");
      var defaultPass = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, "admin123");
      var passHex = defaultPass.map(function(byte) {
        var v = (byte < 0) ? 256 + byte : byte;
        return ("0" + v.toString(16)).slice(-2);
      }).join("");
      
      var now = new Date().toISOString();
      sheet.appendRow([id, "admin", passHex, "Admin", "Aktif", now]);
      Logger.log("Akun Admin default berhasil dibuat. (Username: admin, Password: admin123)");
    }
  }
}

function migrateBahanBakuSchema() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("BahanBaku");
  if (!sheet) return;

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Periksa Kategori
  var kategoriIdx = headers.indexOf("Kategori");
  if (kategoriIdx === -1) {
    sheet.insertColumnAfter(3); // Setelah "Nama"
    sheet.getRange(1, 4).setValue("Kategori");
    // Karena kita baru insert, headers array lama tidak valid lagi, tapi kita update manual:
    headers.splice(3, 0, "Kategori");
    Logger.log("Kolom 'Kategori' ditambahkan ke BahanBaku.");
  }
  
  // Periksa HargaJual
  var hargaJualIdx = headers.indexOf("HargaJual");
  if (hargaJualIdx === -1) {
    // Cari index HargaBeli
    var hbIdx = headers.indexOf("HargaBeli");
    if (hbIdx !== -1) {
      sheet.insertColumnAfter(hbIdx + 1);
      sheet.getRange(1, hbIdx + 2).setValue("HargaJual");
      Logger.log("Kolom 'HargaJual' ditambahkan ke BahanBaku.");
    }
  }
  
  // Format header
  var newLastCol = sheet.getLastColumn();
  sheet.getRange(1, 1, 1, newLastCol).setFontWeight("bold").setBackground("#e0e0e0");
}

function setupTahap5() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetsData = {
    "WorkOrder": ["ID", "NomorWO", "Tanggal", "TargetSelesai", "Status", "JenisPesanan", "PIC_Produksi", "IDPelanggan"],
    "WODetail": ["ID", "ID_WO", "NamaCustom", "UkuranCustom", "JumlahProduksi", "Keterangan"],
    "KebutuhanBahan": ["ID", "ID_WO", "IDBahan", "JumlahDibutuhkan"],
    "LaporanProduksi": ["ID", "ID_WO", "Tahap", "Tanggal", "JumlahSelesai", "Pelapor"],
    "ApprovalRequest": ["ID", "ID_WO", "DataBaruJSON", "DiajukanOleh", "TanggalPengajuan", "StatusApproval"]
  };
  
  for (var name in sheetsData) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheetsData[name]);
      var headerRange = sheet.getRange(1, 1, 1, sheetsData[name].length);
      headerRange.setFontWeight("bold").setBackground("#e0e0e0");
      sheet.setFrozenRows(1);
      Logger.log("Sheet Tahap 5: '" + name + "' berhasil dibuat.");
    } else {
      // Periksa apakah kolom IDPelanggan sudah ada di WorkOrder
      if (name === "WorkOrder") {
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (headers.indexOf("IDPelanggan") === -1) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue("IDPelanggan").setFontWeight("bold").setBackground("#e0e0e0");
          Logger.log("Kolom 'IDPelanggan' berhasil ditambahkan ke sheet WorkOrder.");
        }
      }
      Logger.log("Sheet Tahap 5: '" + name + "' sudah ada/diperbarui.");
    }
  }
}

// ==========================================
// TAHAP 6: PENJUALAN & KASIR (POS)
// ==========================================
function setupTahap6() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. Inventaris Produk Jadi
  var sheetProduk = ss.getSheetByName("InventarisProduk");
  if (!sheetProduk) {
    sheetProduk = ss.insertSheet("InventarisProduk");
    var headersProduk = ["ID", "SKU", "NamaProduk", "Kategori", "HargaJual", "StokSaatIni", "ImageURL"];
    sheetProduk.appendRow(headersProduk);
    sheetProduk.getRange(1, 1, 1, headersProduk.length).setFontWeight("bold").setBackground("#f3f3f3");
    
    // Sample Data
    sheetProduk.appendRow(["PRD-001", "BTK-KMS-01", "Kemeja Batik Pria Lengan Pendek", "Pakaian Pria", 150000, 10, ""]);
    sheetProduk.appendRow(["PRD-002", "BTK-KMS-02", "Kemeja Batik Pria Lengan Panjang", "Pakaian Pria", 180000, 5, ""]);
    sheetProduk.appendRow(["PRD-003", "BTK-BLS-01", "Blouse Batik Wanita", "Pakaian Wanita", 160000, 8, ""]);
    sheetProduk.appendRow(["PRD-004", "BTK-KN-01", "Kain Batik Tulis 2m", "Kain", 350000, 15, ""]);
  }

  // 2. Data Penjualan (Header)
  var sheetPenjualan = ss.getSheetByName("Penjualan");
  if (!sheetPenjualan) {
    sheetPenjualan = ss.insertSheet("Penjualan");
    var headersPenjualan = ["ID", "NoInvoice", "Tanggal", "IDPelanggan", "TipePesanan", "TotalHarga", "Diskon", "TotalAkhir", "DP", "SisaTagihan", "MetodePembayaran", "StatusPembayaran", "StatusPesanan", "ID_WO", "Kasir"];
    sheetPenjualan.appendRow(headersPenjualan);
    sheetPenjualan.getRange(1, 1, 1, headersPenjualan.length).setFontWeight("bold").setBackground("#f3f3f3");
  }

  // 3. Detail Penjualan (Item)
  var sheetPenjualanDetail = ss.getSheetByName("PenjualanDetail");
  if (!sheetPenjualanDetail) {
    sheetPenjualanDetail = ss.insertSheet("PenjualanDetail");
    var headersDetail = ["ID", "IDPenjualan", "IDProduk", "NamaItemCustom", "HargaSatuan", "Qty", "Subtotal"];
    sheetPenjualanDetail.appendRow(headersDetail);
    sheetPenjualanDetail.getRange(1, 1, 1, headersDetail.length).setFontWeight("bold").setBackground("#f3f3f3");
  }

  Logger.log("Tahap 6 Setup Selesai.");
}

// ==========================================
// FUNGSI UTILITY (BANTUAN)
// ==========================================

function generateID() {
  return 'ID-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function getCurrentTime() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function hashSHA256(input) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function updateTahap6() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetProduk = ss.getSheetByName("InventarisProduk");
  if (sheetProduk) {
    var headers = sheetProduk.getRange(1, 1, 1, sheetProduk.getLastColumn()).getValues()[0];
    if (headers.indexOf("ImageURL") === -1) {
      sheetProduk.getRange(1, headers.length + 1).setValue("ImageURL").setFontWeight("bold").setBackground("#f3f3f3");
      Logger.log("Kolom ImageURL berhasil ditambahkan.");
    } else {
      Logger.log("Kolom ImageURL sudah ada.");
    }
  }
}

function setupTahap7() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Data Kas Keuangan
  var sheetKas = ss.getSheetByName("KeuanganKas");
  if (!sheetKas) {
    sheetKas = ss.insertSheet("KeuanganKas");
    var headersKas = ["ID", "Tanggal", "Tipe", "Kategori", "Nominal", "Keterangan", "IDReferensi", "TercatatOleh"];
    sheetKas.appendRow(headersKas);
    sheetKas.getRange(1, 1, 1, headersKas.length).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  Logger.log("Tahap 7 Setup Selesai.");
}

// ==========================================
// TAHAP 8: VISUALIZER DESAIN
// ==========================================
function setupVisualizer() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Sheet Motif Library
  var sheetMotif = ss.getSheetByName("MotifLibrary");
  if (!sheetMotif) {
    sheetMotif = ss.insertSheet("MotifLibrary");
    var headersMotif = ["ID", "NamaMotif", "Kategori", "URLGambar", "DiuploadOleh", "TanggalDibuat"];
    sheetMotif.appendRow(headersMotif);
    sheetMotif.getRange(1, 1, 1, headersMotif.length).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Sheet Desain Visualizer
  var sheetDesain = ss.getSheetByName("DesainVisualizer");
  if (!sheetDesain) {
    sheetDesain = ss.insertSheet("DesainVisualizer");
    var headersDesain = ["ID", "NamaDesain", "IDPelanggan", "ModelPakaian", "WarnaDasar", "StatusApproval", "URLMockup", "DibuatOleh", "TanggalDibuat", "KomentarPelanggan"];
    sheetDesain.appendRow(headersDesain);
    sheetDesain.getRange(1, 1, 1, headersDesain.length).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  Logger.log("Visualizer Setup Selesai.");
}
