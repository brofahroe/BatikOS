const SPREADSHEET_ID = "1iccn1by0VmiZY__GijlAcvQm8VuJfAavp-aEnLmlryM"; // Ganti dengan ID Spreadsheet Anda

// ==========================================
// ROUTER & ENDPOINTS
// ==========================================

function doGet(e) {
  // Jika ada parameter 'action', proses sebagai request API REST
  if (e && e.parameter && e.parameter.action) {
    // Karena Apps Script POST redirect menjadi GET, kita tangkap di sini
    return handleRequest(e, "GET");
  }

  const publicAccess = (e && e.parameter && e.parameter.public) ? e.parameter.public : null;
  const designId = (e && e.parameter && e.parameter.designId) ? e.parameter.designId : null;
  
  let template;

  try {
    if (publicAccess === "true" && designId) {
      template = HtmlService.createTemplateFromFile('ViewPublicApproval');
      template.designId = designId;
      return template.evaluate()
        .setTitle('Batik Seng - Persetujuan Desain')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag("viewport", "width=device-width, initial-scale=1");
    }

    // SPA Mode: Selalu layani Dashboard.html (Login disematkan di dalamnya)
    template = HtmlService.createTemplateFromFile('Dashboard');
    return template.evaluate()
      .setTitle('BatikOS Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  } catch (err) {
    try { logActivity('SYSTEM', 'ERROR', 'doGet', String(err)); } catch(e){}
    return HtmlService.createHtmlOutput('<h2>Terjadi kesalahan. Hubungi administrator.</h2>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// Helper untuk menyertakan file CSS/JS ke dalam HTML
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Helper untuk mendapatkan URL Web App yang sedang aktif
function getScriptUrl(page = null, token = null) {
  const url = ScriptApp.getService().getUrl();
  const params = [];
  if (page) params.push('page=' + encodeURIComponent(page));
  if (token) params.push('token=' + encodeURIComponent(token));
  return params.length ? url + '?' + params.join('&') : url;
}

function doPost(e) {
  if (!e) {
    return ContentService.createTextOutput("Harap akses melalui HTTP POST.");
  }
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  try {
    var action = e.parameter.action;
    var result = { success: false, message: "Action not found" };

    if (!action) {
      return responseJSON({ success: false, message: "No action provided" });
    }

    // --- Autentikasi (Pengecualian tanpa token) ---
    if (action === "login" && method === "POST") {
      var data = JSON.parse(e.postData.contents);
      result = loginUser(data.username, data.password);
      return responseJSON(result);
    }

    // --- Validasi Token untuk fungsi yang dilindungi ---
    var token = e.parameter.token;
    if (!token && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        token = parsed.token;
      } catch (err) {}
    }

    if (!token) {
      return responseJSON({ success: false, message: "Unauthorized. Token required." });
    }
    if (!validateToken(token)) {
      return responseJSON({ success: false, message: "Token expired. Silakan login kembali." });
    }

    // --- Pemrosesan CRUD Internal ---
    if (action === "read" && method === "GET") {
      result = readData(e.parameter.sheet);
    } else if (action === "create" && method === "POST") {
      var reqData = JSON.parse(e.postData.contents);
      result = createData(reqData.sheet, reqData.data);
    } else if (action === "update" && method === "POST") {
      var reqData = JSON.parse(e.postData.contents);
      result = updateData(reqData.sheet, reqData.id, reqData.data);
    } else if (action === "delete" && method === "POST") {
      var reqData = JSON.parse(e.postData.contents);
      result = deleteData(reqData.sheet, reqData.id);
    } else {
      result = { success: false, message: "Unsupported action or method" };
    }

    return responseJSON(result);
  } catch (error) {
    return responseJSON({ success: false, message: error.toString() });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupTahap5Handler(sheetName) {
  if (sheetName === "SetupTahap5") {
    setupTahap5();
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Tahap 5 Setup Berhasil." })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// TAHAP 6: PENJUALAN & KASIR (POS)
// ==========================================

function readProdukPOS() {
  try {
    var sheet = getSheet("InventarisProduk");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];
    for(var i=1; i<data.length; i++) {
      var row = {};
      headers.forEach((h, index) => { 
        var val = data[i][index];
        if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
          val = val.toISOString();
        }
        row[h] = val; 
      });
      results.push(row);
    }
    return { success: true, data: results };
  } catch(err) { return { success: false, message: err.toString() }; }
}

function createPenjualan(payload) {
  try {
    var sheetPenjualan = getSheet("Penjualan");
    var sheetDetail = getSheet("PenjualanDetail");
    var sheetProduk = getSheet("InventarisProduk");

    var idPenjualan = generateID();
    var now = new Date();
    // Format NoInvoice: INV-YYMMDD-XXXX
    var noInv = "INV-" + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
    var tanggal = getCurrentTime();

    // 1. Insert ke Penjualan
    // Headers: "ID", "NoInvoice", "Tanggal", "IDPelanggan", "TipePesanan", "TotalHarga", "Diskon", "TotalAkhir", "DP", "SisaTagihan", "MetodePembayaran", "StatusPembayaran", "StatusPesanan", "ID_WO", "Kasir"
    var hPenjualan = sheetPenjualan.getRange(1, 1, 1, sheetPenjualan.getLastColumn()).getValues()[0];
    var rowPenjualan = hPenjualan.map(h => {
      if(h === "ID") return idPenjualan;
      if(h === "NoInvoice") return noInv;
      if(h === "Tanggal") return tanggal;
      if(h === "IDPelanggan") return payload.IDPelanggan || "";
      if(h === "TipePesanan") return payload.TipePesanan || "Ready Stock";
      if(h === "TotalHarga") return payload.TotalHarga || 0;
      if(h === "Diskon") return payload.Diskon || 0;
      if(h === "TotalAkhir") return payload.TotalAkhir || 0;
      if(h === "DP") return payload.DP || 0;
      if(h === "SisaTagihan") return payload.SisaTagihan || 0;
      if(h === "MetodePembayaran") return payload.MetodePembayaran || "Cash";
      if(h === "StatusPembayaran") return payload.StatusPembayaran || "Lunas";
      if(h === "StatusPesanan") return payload.StatusPesanan || "Selesai"; // Menggantung jika Custom Order
      if(h === "ID_WO") return payload.ID_WO || "";
      if(h === "Kasir") return payload.Kasir || "Admin";
      return "";
    });
    sheetPenjualan.appendRow(rowPenjualan);

    // 2. Insert ke PenjualanDetail & Potong Stok
    // Headers: "ID", "IDPenjualan", "IDProduk", "NamaItemCustom", "HargaSatuan", "Qty", "Subtotal"
    var hDetail = sheetDetail.getRange(1, 1, 1, sheetDetail.getLastColumn()).getValues()[0];
    
    var prodData = sheetProduk.getDataRange().getValues();
    var prodHeaders = prodData[0];

    var sheetBahan = getSheet("BahanBaku");
    var bahanData = sheetBahan.getDataRange().getValues();
    var bahanHeaders = bahanData[0];

    payload.items.forEach(item => {
      var idDet = generateID();
      var rowDet = hDetail.map(h => {
        if(h === "ID") return idDet;
        if(h === "IDPenjualan") return idPenjualan;
        if(h === "IDProduk") return item.IDProduk || "";
        if(h === "NamaItemCustom") return item.NamaItemCustom || "";
        if(h === "HargaSatuan") return item.HargaSatuan || 0;
        if(h === "Qty") return item.Qty || 1;
        if(h === "Subtotal") return item.Subtotal || 0;
        return "";
      });
      sheetDetail.appendRow(rowDet);

      // Potong stok InventarisProduk atau BahanBaku
      if(payload.TipePesanan === "Ready Stock" || payload.TipePesanan === "Bahan Batik") {
        if (item.ItemType === "BahanBaku" && item.IDProduk) {
          for(var b = 1; b < bahanData.length; b++) {
            if(bahanData[b][0] === item.IDProduk) {
               var stokColB = bahanHeaders.indexOf("StokSaatIni") + 1;
               var currentStokB = parseFloat(bahanData[b][stokColB - 1]);
               sheetBahan.getRange(b + 1, stokColB).setValue(currentStokB - parseFloat(item.Qty));
               break;
            }
          }
        } else if (item.IDProduk && item.ItemType === "Produk") {
          for(var p = 1; p < prodData.length; p++) {
            if(prodData[p][0] === item.IDProduk) {
               var stokCol = prodHeaders.indexOf("StokSaatIni") + 1;
               var currentStok = parseFloat(prodData[p][stokCol - 1]);
               sheetProduk.getRange(p + 1, stokCol).setValue(currentStok - parseFloat(item.Qty));
               break;
            }
          }
        }
      }
    });

    // 3. Otomatisasi Jurnal Keuangan (Pemasukan)
    var sheetKas = getSheet("KeuanganKas");
    if(sheetKas) {
      var hKas = sheetKas.getRange(1, 1, 1, sheetKas.getLastColumn()).getValues()[0];
      var nominalMasuk = (payload.StatusPembayaran === "DP") ? parseFloat(payload.DP) : parseFloat(payload.TotalAkhir);
      if(nominalMasuk > 0) {
        var rowKas = hKas.map(h => {
          if(h === "ID") return generateID();
          if(h === "Tanggal") return tanggal;
          if(h === "Tipe") return "MASUK";
          if(h === "Kategori") return "Penjualan";
          if(h === "Nominal") return nominalMasuk;
          if(h === "Keterangan") return "Pembayaran Kasir: " + noInv + (payload.StatusPembayaran === "DP" ? " (DP)" : " (Lunas)");
          if(h === "IDReferensi") return idPenjualan;
          if(h === "TercatatOleh") return payload.Kasir || "Sistem";
          return "";
        });
        sheetKas.appendRow(rowKas);
      }
    }

    return { success: true, message: "Transaksi berhasil disimpan!", invoice: noInv, id: idPenjualan };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function readRiwayatPenjualan() {
  try {
    var sheet = getSheet("Penjualan");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];
    for(var i=1; i<data.length; i++) {
      var row = {};
      headers.forEach((h, index) => { 
        var val = data[i][index];
        if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
          val = val.toISOString();
        }
        row[h] = val; 
      });
      results.push(row);
    }
    return { success: true, data: results.reverse() };
  } catch(err) { return { success: false, message: err.toString() }; }
}

// ==========================================
// FUNGSI RPC (DIPANGGIL DARI CLIENT VIA google.script.run)
// ==========================================

function handleClientRequest(action, data) {
  try {
    var result = { success: false, message: "Action not found" };

    if (!action) return { success: false, message: "No action provided" };

    if (action === "login") {
      return loginUser(data.username, data.password);
    }

    var token = data.token;
    var userObj = null;

    var publicActions = ["getDesignById", "customerApproveDesign"];
    if (!publicActions.includes(action)) {
      if (!token) {
        return { success: false, message: "Unauthorized. Token required." };
      }
      userObj = validateSession(token);
      if (!userObj) {
        return { success: false, message: "Token expired. Silakan login kembali." };
      }

      // --- RBAC Security Guard ---
      if (data.sheet === "Pengguna" || data.sheet === "Pengaturan") {
        if (userObj.role !== "Admin" && userObj.role !== "Pemilik (Owner)") {
          return { success: false, message: "Akses Ditolak: Anda tidak memiliki izin untuk mengelola Pengguna." };
        }
      }
    }

    if (action === "read") {
      result = readData(data.sheet);
    } else if (action === "getDashboardStats") {
      result = getDashboardStats(userObj.role);
    } else if (action === "create") {
      result = createData(data.sheet, data.data);
    } else if (action === "update") {
      result = updateData(data.sheet, data.id, data.data);
    } else if (action === "delete") {
      result = deleteData(data.sheet, data.id);
    } else if (action === "createPO") {
      result = createPurchaseOrder(data);
    } else if (action === "updatePO") {
      result = updatePurchaseOrder(data);
    } else if (action === "readPODetails") {
      var allDetails = readData("DetailPO").data;
      result = { success: true, data: allDetails.filter(d => d.ID_PO === data.poId) };
    } else if (action === "createWO") {
      result = createWorkOrder(data);
    } else if (action === "updateWO") {
      result = updateWorkOrder(data);
    } else if (action === "readWODetails") {
      var allDet = readData("WODetail").data;
      var allBom = readData("KebutuhanBahan").data;
      result = { success: true, data: {
         details: allDet.filter(d => d.ID_WO === data.woId),
         bom: allBom.filter(b => b.ID_WO === data.woId)
      }};
    } else if (action === "createLaporanProduksi") {
      result = createLaporanProduksi(data);
    } else if (action === "readApprovals") {
      result = readData("ApprovalRequest");
    } else if (action === "approveWOEdit") {
      result = approveWOEdit(data);
    } else if (action === "rejectWOEdit") {
      result = rejectWOEdit(data);
    } else if (action === "readProdukPOS") {
      result = readProdukPOS();
    } else if (action === "createPenjualan") {
      result = createPenjualan(data);
    } else if (action === "readRiwayatPenjualan") {
      result = readRiwayatPenjualan();
    } else if (action === "getLaporanKeuangan") {
      result = getLaporanKeuangan();
    } else if (action === "createKasManual") {
      result = createKasManual(data);
    } else if (action === "uploadImageBase64") {
      result = uploadImageBase64(data.filename, data.base64, data.folderName);
    } else if (action === "customerApproveDesign") {
      result = customerApproveDesign(data.designId, data.status, data.komentar);
    } else if (action === "getDesignById") {
      result = getDesignById(data.designId);
    } else if (action === "saveSettings") {
      result = saveSettings(data.settings);
    }

    return result;
  } catch(err) {
    return { success: false, message: "Error in handleClientRequest: " + err.toString() };
  }
}

// ==========================================
// TAHAP 7: KEUANGAN (LABA RUGI & ARUS KAS)
// ==========================================

function getLaporanKeuangan() {
  try {
    var sheetKas = getSheet("KeuanganKas");
    if (!sheetKas) return { success: false, message: "Modul Keuangan belum di-setup." };
    
    var data = sheetKas.getDataRange().getValues();
    var headers = data[0];
    
    var kas = [];
    var labaRugi = {
      Pendapatan: 0,
      PembelianBahan: 0,
      PengeluaranOperasional: 0,
      LabaBersih: 0
    };
    
    for (var i = 1; i < data.length; i++) {
      var row = {};
      headers.forEach((h, idx) => { 
        var val = data[i][idx];
        if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
          val = val.toISOString();
        }
        row[h] = val; 
      });
      kas.push(row);
      
      var nom = parseFloat(row.Nominal) || 0;
      if (row.Tipe === "MASUK") {
        if (row.Kategori === "Penjualan") labaRugi.Pendapatan += nom;
      } else if (row.Tipe === "KELUAR") {
        if (row.Kategori === "Pembelian Bahan") labaRugi.PembelianBahan += nom;
        else labaRugi.PengeluaranOperasional += nom;
      }
    }
    
    labaRugi.LabaBersih = labaRugi.Pendapatan - (labaRugi.PembelianBahan + labaRugi.PengeluaranOperasional);
    
    return { success: true, data: { kas: kas.reverse(), labaRugi: labaRugi } };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function createKasManual(payload) {
  try {
    var sheetKas = getSheet("KeuanganKas");
    if(!sheetKas) return { success: false, message: "Database Keuangan tidak ditemukan." };
    
    var hKas = sheetKas.getRange(1, 1, 1, sheetKas.getLastColumn()).getValues()[0];
    var rowKas = hKas.map(h => {
      if(h === "ID") return generateID();
      if(h === "Tanggal") return payload.Tanggal || getCurrentTime();
      if(h === "Tipe") return payload.Tipe || "KELUAR";
      if(h === "Kategori") return payload.Kategori || "Operasional";
      if(h === "Nominal") return parseFloat(payload.Nominal) || 0;
      if(h === "Keterangan") return payload.Keterangan || "";
      if(h === "IDReferensi") return payload.IDReferensi || "";
      if(h === "TercatatOleh") return payload.Kasir || "Admin";
      return "";
    });
    
    sheetKas.appendRow(rowKas);
    return { success: true, message: "Transaksi manual berhasil disimpan." };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

// ==========================================
// FUNGSI CRUD & DATABASE SPREADSHEET
// ==========================================

function getSheet(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

function readData(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var value = data[i][j];
      // Jika value adalah tipe Date, konversi ke string ISO agar aman dikirim ke client
      if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
        value = value.toISOString();
      }
      obj[headers[j]] = value;
    }
    result.push(obj);
  }
  
  return { success: true, data: result };
}

function createData(sheetName, record) {
  var sheet = getSheet(sheetName);
  if (!sheet) return { success: false, message: "Sheet not found: " + sheetName };

  if (sheetName === "Pengguna" && record.KataSandi) {
    record.KataSandi = hashSHA256(record.KataSandi);
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];
  
  if (!record.ID) {
    record.ID = generateID(); // Auto-generate ID unik
  }
  
  for (var i = 0; i < headers.length; i++) {
    newRow.push(record[headers[i]] || "");
  }
  
  sheet.appendRow(newRow);
  return { success: true, message: "Data berhasil ditambahkan", id: record.ID };
}

function updateData(sheetName, id, record) {
  var sheet = getSheet(sheetName);
  if (!sheet) return { success: false, message: "Sheet not found: " + sheetName };
  
  if (sheetName === "Pengguna" && record.KataSandi) {
    record.KataSandi = hashSHA256(record.KataSandi);
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) { // Asumsi ID selalu berada di kolom pertama
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return { success: false, message: "ID data tidak ditemukan" };
  
  var updatedRow = [];
  for (var j = 0; j < headers.length; j++) {
    if (record.hasOwnProperty(headers[j])) {
      updatedRow.push(record[headers[j]]);
    } else {
      updatedRow.push(data[rowIndex - 1][j]); // Ambil nilai yang sudah ada sebelumnya
    }
  }
  
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
  return { success: true, message: "Data berhasil diperbarui" };
}

function deleteData(sheetName, id) {
  var sheet = getSheet(sheetName);
  if (!sheet) return { success: false, message: "Sheet not found: " + sheetName };
  
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return { success: false, message: "ID data tidak ditemukan" };
  
  sheet.deleteRow(rowIndex);
  return { success: true, message: "Data berhasil dihapus" };
}

function createPurchaseOrder(data) {
  // data = { po: {}, details: [] }
  try {
    var sheetPO = getSheet("POPembelian");
    var sheetDetail = getSheet("DetailPO");
    var sheetMutasi = getSheet("MutasiBahan");
    var sheetBahan = getSheet("BahanBaku");
    
    var poID = generateID();
    data.po.ID = poID;
    
    // Insert Header PO
    var headersPO = sheetPO.getRange(1, 1, 1, sheetPO.getLastColumn()).getValues()[0];
    var rowPO = headersPO.map(h => data.po[h] || "");
    sheetPO.appendRow(rowPO);
    
    // Loop details
    data.details.forEach(detail => {
      detail.ID = generateID();
      detail.ID_PO = poID;
      
      var headersDetail = sheetDetail.getRange(1, 1, 1, sheetDetail.getLastColumn()).getValues()[0];
      var rowDetail = headersDetail.map(h => detail[h] || "");
      sheetDetail.appendRow(rowDetail);
      
      // Jika status Selesai, trigger Mutasi & Update Stok Bahan Baku
      if (data.po.Status === "Selesai") {
        var bbData = sheetBahan.getDataRange().getValues();
        var bbHeaders = bbData[0];
        var bbRowIdx = -1;
        var bbObj = {};
        for (var i = 1; i < bbData.length; i++) {
          if (bbData[i][0] == detail.IDBahan) {
            bbRowIdx = i + 1;
            for (var j = 0; j < bbHeaders.length; j++) { bbObj[bbHeaders[j]] = bbData[i][j]; }
            break;
          }
        }
        
        if (bbRowIdx !== -1) {
          var qtyBeli = parseFloat(detail.Jumlah) || 0;
          var rasio = parseFloat(bbObj["Rasio Konversi"]) || 1;
          var qtyPakai = qtyBeli * rasio; // Dikonversi ke Satuan Pakai
          
          // Insert Mutasi
          var mutasi = {
            ID: generateID(),
            Tanggal: data.po.Tanggal,
            IDBahan: detail.IDBahan,
            PerubahanJumlah: qtyPakai,
            Tipe: "MASUK",
            IDReferensi: poID,
            Keterangan: "Pembelian PO: " + data.po.NomorPO
          };
          var headersMut = sheetMutasi.getRange(1, 1, 1, sheetMutasi.getLastColumn()).getValues()[0];
          sheetMutasi.appendRow(headersMut.map(h => mutasi[h] || ""));
          
          // Update Stok
          var currentStok = parseFloat(bbObj["StokSaatIni"]) || 0;
          bbObj["StokSaatIni"] = currentStok + qtyPakai;
          
          var updatedBBRow = bbHeaders.map(h => bbObj[h]);
          sheetBahan.getRange(bbRowIdx, 1, 1, bbHeaders.length).setValues([updatedBBRow]);
        }
      }
    });
    
    // 3. Otomatisasi Jurnal Keuangan (Pengeluaran Pembelian)
    if (data.po.Status === "Selesai") {
      var sheetKas = getSheet("KeuanganKas");
      if (sheetKas) {
        var hKas = sheetKas.getRange(1, 1, 1, sheetKas.getLastColumn()).getValues()[0];
        // Hitung total dari detail jika tidak ada di po
        var totalBelanja = parseFloat(data.po.TotalNilai || data.po.TotalBiaya || data.po.TotalBayar || data.po.TotalHarga || 0);
        if(totalBelanja === 0) {
          totalBelanja = data.details.reduce((sum, d) => sum + (parseFloat(d.Subtotal) || 0), 0);
        }
        if(totalBelanja > 0) {
          var rowKas = hKas.map(h => {
            if(h === "ID") return generateID();
            if(h === "Tanggal") return data.po.Tanggal || getCurrentTime();
            if(h === "Tipe") return "KELUAR";
            if(h === "Kategori") return "Pembelian Bahan";
            if(h === "Nominal") return totalBelanja;
            if(h === "Keterangan") return "Pelunasan PO: " + data.po.NomorPO;
            if(h === "IDReferensi") return data.po.ID;
            if(h === "TercatatOleh") return data.po.DibuatOleh || "Sistem";
            return "";
          });
          sheetKas.appendRow(rowKas);
        }
      }
    }
    
    return { success: true, message: "Purchase Order berhasil disimpan!" };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function updatePurchaseOrder(data) {
  try {
    var sheetPO = getSheet("POPembelian");
    var sheetDetail = getSheet("DetailPO");
    var sheetMutasi = getSheet("MutasiBahan");
    var sheetBahan = getSheet("BahanBaku");
    
    // 1. Find PO
    var poData = sheetPO.getDataRange().getValues();
    var poHeaders = poData[0];
    var rowIndexPO = -1;
    var oldStatus = "";
    
    for (var i = 1; i < poData.length; i++) {
      if (poData[i][0] == data.po.ID) { // Index 0 is ID
        rowIndexPO = i + 1;
        var statusIdx = poHeaders.indexOf("Status");
        oldStatus = poData[i][statusIdx];
        break;
      }
    }
    
    if (rowIndexPO === -1) return { success: false, message: "PO tidak ditemukan." };
    if (oldStatus === "Selesai") return { success: false, message: "PO yang sudah Selesai tidak dapat diedit." };
    
    // 2. Update Header PO
    // retain original fields like DibuatOleh, TanggalDibuat if we want, but for now just overwrite
    var rowPO = poHeaders.map(h => data.po[h] !== undefined ? data.po[h] : poData[rowIndexPO-1][poHeaders.indexOf(h)]);
    sheetPO.getRange(rowIndexPO, 1, 1, poHeaders.length).setValues([rowPO]);
    
    // 3. Delete Old Details
    var detailData = sheetDetail.getDataRange().getValues();
    for (var i = detailData.length - 1; i >= 1; i--) {
       if (detailData[i][1] == data.po.ID) { // Index 1 is ID_PO
          sheetDetail.deleteRow(i + 1);
       }
    }
    
    // 4. Insert New Details & Check Mutasi
    var detailHeaders = sheetDetail.getRange(1, 1, 1, sheetDetail.getLastColumn()).getValues()[0];
    data.details.forEach(detail => {
      detail.ID = generateID();
      detail.ID_PO = data.po.ID;
      var rowDetail = detailHeaders.map(h => detail[h] || "");
      sheetDetail.appendRow(rowDetail);
      
      // Jika status Selesai, trigger Mutasi & Update Stok Bahan Baku
      if (data.po.Status === "Selesai") {
        var bbData = sheetBahan.getDataRange().getValues();
        var bbHeaders = bbData[0];
        var bbRowIdx = -1;
        var bbObj = {};
        for (var b = 1; b < bbData.length; b++) {
          if (bbData[b][0] == detail.IDBahan) {
            bbRowIdx = b + 1;
            for (var j = 0; j < bbHeaders.length; j++) { bbObj[bbHeaders[j]] = bbData[b][j]; }
            break;
          }
        }
        
        if (bbRowIdx !== -1) {
          var qtyBeli = parseFloat(detail.Jumlah) || 0;
          var rasio = parseFloat(bbObj["Rasio Konversi"]) || 1;
          var qtyPakai = qtyBeli * rasio; 
          
          var mutasi = {
            ID: generateID(),
            Tanggal: data.po.Tanggal,
            IDBahan: detail.IDBahan,
            PerubahanJumlah: qtyPakai,
            Tipe: "MASUK",
            IDReferensi: data.po.ID,
            Keterangan: "Pembelian PO: " + data.po.NomorPO
          };
          var headersMut = sheetMutasi.getRange(1, 1, 1, sheetMutasi.getLastColumn()).getValues()[0];
          sheetMutasi.appendRow(headersMut.map(h => mutasi[h] || ""));
          
          var currentStok = parseFloat(bbObj["StokSaatIni"]) || 0;
          bbObj["StokSaatIni"] = currentStok + qtyPakai;
          var updatedBBRow = bbHeaders.map(h => bbObj[h]);
          sheetBahan.getRange(bbRowIdx, 1, 1, bbHeaders.length).setValues([updatedBBRow]);
        }
      }
    });
    
    // 5. Otomatisasi Jurnal Keuangan (Pengeluaran Pembelian saat Update jadi Selesai)
    if (data.po.Status === "Selesai" && oldStatus !== "Selesai") {
      var sheetKas = getSheet("KeuanganKas");
      if (sheetKas) {
        var hKas = sheetKas.getRange(1, 1, 1, sheetKas.getLastColumn()).getValues()[0];
        var totalBelanja = parseFloat(data.po.TotalNilai || data.po.TotalBiaya || data.po.TotalBayar || data.po.TotalHarga || 0);
        if(totalBelanja === 0) {
          totalBelanja = data.details.reduce((sum, d) => sum + (parseFloat(d.Subtotal) || 0), 0);
        }
        if(totalBelanja > 0) {
          var rowKas = hKas.map(h => {
            if(h === "ID") return generateID();
            if(h === "Tanggal") return data.po.Tanggal || getCurrentTime();
            if(h === "Tipe") return "KELUAR";
            if(h === "Kategori") return "Pembelian Bahan";
            if(h === "Nominal") return totalBelanja;
            if(h === "Keterangan") return "Pelunasan PO: " + data.po.NomorPO;
            if(h === "IDReferensi") return data.po.ID;
            if(h === "TercatatOleh") return data.po.DibuatOleh || "Sistem";
            return "";
          });
          sheetKas.appendRow(rowKas);
        }
      }
    }
    
    return { success: true, message: "Purchase Order berhasil diperbarui!" };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function createWorkOrder(data) {
  try {
    var sheetWO = getSheet("WorkOrder");
    var sheetDetail = getSheet("WODetail");
    var sheetBahan = getSheet("KebutuhanBahan");
    var sheetMutasi = getSheet("MutasiBahan");
    var sheetBB = getSheet("BahanBaku");
    
    var woID = generateID();
    data.wo.ID = woID;
    
    // Insert Header WO
    var headersWO = sheetWO.getRange(1, 1, 1, sheetWO.getLastColumn()).getValues()[0];
    var rowWO = headersWO.map(h => data.wo[h] || "");
    sheetWO.appendRow(rowWO);
    
    // Insert WO Detail
    var headersDetail = sheetDetail.getRange(1, 1, 1, sheetDetail.getLastColumn()).getValues()[0];
    data.details.forEach(det => {
      det.ID = generateID();
      det.ID_WO = woID;
      var rowDetail = headersDetail.map(h => det[h] || "");
      sheetDetail.appendRow(rowDetail);
    });
    
    // Insert BoM & Check Mutasi
    var isBerjalan = (data.wo.Status === "Berjalan");
    var bbData = sheetBB.getDataRange().getValues();
    var bbHeaders = bbData[0];
    var headersBom = sheetBahan.getRange(1, 1, 1, sheetBahan.getLastColumn()).getValues()[0];
    
    data.bom.forEach(b => {
      b.ID = generateID();
      b.ID_WO = woID;
      var rowBom = headersBom.map(h => b[h] || "");
      sheetBahan.appendRow(rowBom);
      
      if (isBerjalan) {
        var bbRowIdx = -1;
        var bbObj = {};
        for(var i=1; i<bbData.length; i++) {
           if(bbData[i][0] == b.IDBahan) {
             bbRowIdx = i + 1;
             for(var j=0; j<bbHeaders.length; j++) bbObj[bbHeaders[j]] = bbData[i][j];
             break;
           }
        }
        
        if (bbRowIdx !== -1) {
           var qtyPakai = parseFloat(b.JumlahDibutuhkan) || 0;
           // Mutasi Keluar
           var mutasi = {
             ID: generateID(),
             Tanggal: data.wo.Tanggal,
             IDBahan: b.IDBahan,
             PerubahanJumlah: qtyPakai,
             Tipe: "KELUAR",
             IDReferensi: woID,
             Keterangan: "Produksi WO: " + data.wo.NomorWO
           };
           var headersMut = sheetMutasi.getRange(1, 1, 1, sheetMutasi.getLastColumn()).getValues()[0];
           sheetMutasi.appendRow(headersMut.map(h => mutasi[h] || ""));
           
           // Kurangi Stok
           var currentStok = parseFloat(bbObj["StokSaatIni"]) || 0;
           bbObj["StokSaatIni"] = currentStok - qtyPakai;
           var updatedBBRow = bbHeaders.map(h => bbObj[h]);
           sheetBB.getRange(bbRowIdx, 1, 1, bbHeaders.length).setValues([updatedBBRow]);
        }
      }
    });
    
    return { success: true, message: "Work Order berhasil disimpan!" };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function applyMutasiKeluar(woData, bomList) {
  var sheetMutasi = getSheet("MutasiBahan");
  var sheetBB = getSheet("BahanBaku");
  var bbData = sheetBB.getDataRange().getValues();
  var bbHeaders = bbData[0];
  
  bomList.forEach(b => {
     var bbRowIdx = -1;
     var bbObj = {};
     for(var j=1; j<bbData.length; j++) {
        if(bbData[j][0] == b.IDBahan) {
           bbRowIdx = j + 1;
           for(var k=0; k<bbHeaders.length; k++) bbObj[bbHeaders[k]] = bbData[j][k];
           break;
        }
     }
     if (bbRowIdx !== -1) {
        var qtyPakai = parseFloat(b.JumlahDibutuhkan) || 0;
        var mutasi = {
          ID: generateID(),
          Tanggal: woData.Tanggal || getCurrentTime(),
          IDBahan: b.IDBahan,
          PerubahanJumlah: qtyPakai,
          Tipe: "KELUAR",
          IDReferensi: woData.ID,
          Keterangan: "Produksi WO: " + woData.NomorWO
        };
        var headersMut = sheetMutasi.getRange(1, 1, 1, sheetMutasi.getLastColumn()).getValues()[0];
        sheetMutasi.appendRow(headersMut.map(h => mutasi[h] || ""));
        
        var currentStok = parseFloat(bbObj["StokSaatIni"]) || 0;
        bbObj["StokSaatIni"] = currentStok - qtyPakai;
        sheetBB.getRange(bbRowIdx, 1, 1, bbHeaders.length).setValues([bbHeaders.map(h => bbObj[h])]);
        // Update memori lokal
        bbData[bbRowIdx-1][bbHeaders.indexOf("StokSaatIni")] = bbObj["StokSaatIni"];
     }
  });
}

function revertMutasiKeluar(woId, noWO) {
  var sheetMutasi = getSheet("MutasiBahan");
  var sheetBB = getSheet("BahanBaku");
  var mutData = sheetMutasi.getDataRange().getValues();
  var mutHeaders = mutData[0];
  var bbData = sheetBB.getDataRange().getValues();
  var bbHeaders = bbData[0];
  
  var rowsToDelete = [];
  for(var i=1; i<mutData.length; i++) {
    if(mutData[i][mutHeaders.indexOf("IDReferensi")] === woId && mutData[i][mutHeaders.indexOf("Tipe")] === "KELUAR") {
      rowsToDelete.push(i + 1);
      var idBahan = mutData[i][mutHeaders.indexOf("IDBahan")];
      var qty = parseFloat(mutData[i][mutHeaders.indexOf("PerubahanJumlah")]) || 0;
      
      // Kembalikan stok
      for(var j=1; j<bbData.length; j++) {
        if(bbData[j][0] == idBahan) {
          var current = parseFloat(bbData[j][bbHeaders.indexOf("StokSaatIni")]) || 0;
          var newStok = current + qty;
          sheetBB.getRange(j+1, bbHeaders.indexOf("StokSaatIni") + 1).setValue(newStok);
          bbData[j][bbHeaders.indexOf("StokSaatIni")] = newStok; // Update memori
          break;
        }
      }
    }
  }
  
  // Hapus dari bawah agar index tidak bergeser
  rowsToDelete.reverse().forEach(r => sheetMutasi.deleteRow(r));
}

function executeUpdateWO(data) {
  var sheetWO = getSheet("WorkOrder");
  var sheetDetail = getSheet("WODetail");
  var sheetBahan = getSheet("KebutuhanBahan");
  
  var woData = sheetWO.getDataRange().getValues();
  var headersWO = woData[0];
  var rowIndexWO = -1;
  var oldStatus = "";
  
  for (var i = 1; i < woData.length; i++) {
    if (woData[i][0] == data.wo.ID) {
      rowIndexWO = i + 1;
      oldStatus = woData[i][headersWO.indexOf("Status")];
      break;
    }
  }
  
  if (rowIndexWO === -1) throw new Error("WO tidak ditemukan.");
  
  var rowWO = headersWO.map(h => data.wo[h] !== undefined ? data.wo[h] : woData[rowIndexWO-1][headersWO.indexOf(h)]);
  sheetWO.getRange(rowIndexWO, 1, 1, headersWO.length).setValues([rowWO]);
  
  var isNewBerjalan = (oldStatus === "Draft" && data.wo.Status === "Berjalan");
  var isEditBerjalan = (oldStatus === "Berjalan" && data.wo.Status === "Berjalan");
  
  if (oldStatus === "Draft" || isEditBerjalan) {
     if (isEditBerjalan) revertMutasiKeluar(data.wo.ID, data.wo.NomorWO);
     
     // Delete old WODetail & BOM
     var detailData = sheetDetail.getDataRange().getValues();
     for (var i = detailData.length - 1; i >= 1; i--) {
       if (detailData[i][1] == data.wo.ID) sheetDetail.deleteRow(i + 1);
     }
     var bomData = sheetBahan.getDataRange().getValues();
     for (var i = bomData.length - 1; i >= 1; i--) {
       if (bomData[i][1] == data.wo.ID) sheetBahan.deleteRow(i + 1);
     }
     
     // Insert new WODetail
     var headersDetail = sheetDetail.getRange(1, 1, 1, sheetDetail.getLastColumn()).getValues()[0];
     data.details.forEach(det => {
        det.ID = generateID();
        det.ID_WO = data.wo.ID;
        sheetDetail.appendRow(headersDetail.map(h => det[h] || ""));
     });
     
     // Insert new BOM
     var headersBom = sheetBahan.getRange(1, 1, 1, sheetBahan.getLastColumn()).getValues()[0];
     data.bom.forEach(b => {
        b.ID = generateID();
        b.ID_WO = data.wo.ID;
        sheetBahan.appendRow(headersBom.map(h => b[h] || ""));
     });
     
     if (isNewBerjalan || isEditBerjalan) {
        applyMutasiKeluar(data.wo, data.bom);
     }
     
     // Jika WO diubah menjadi Selesai dan merupakan Stok Internal, tambahkan ke InventarisProduk
     if (oldStatus !== "Selesai" && data.wo.Status === "Selesai" && data.wo.JenisPesanan === "Stok Internal") {
        var sheetProduk = getSheet("InventarisProduk");
        if (sheetProduk) {
           var prodData = sheetProduk.getDataRange().getValues();
           var prodHeaders = prodData[0];
           
           data.details.forEach(det => {
              var foundRow = -1;
              for(var p=1; p<prodData.length; p++) {
                 // Asumsi mencari berdasarkan NamaProduk karena sebelumnya custom
                 if(prodData[p][prodHeaders.indexOf("NamaProduk")] === det.NamaCustom) {
                    foundRow = p + 1;
                    break;
                 }
              }
              if(foundRow !== -1) {
                 var stokCell = sheetProduk.getRange(foundRow, prodHeaders.indexOf("StokSaatIni") + 1);
                 stokCell.setValue(parseFloat(stokCell.getValue()) + parseFloat(det.JumlahProduksi || 0));
              } else {
                 var newId = generateID();
                 var row = prodHeaders.map(h => {
                    if(h === "ID") return newId;
                    if(h === "NamaProduk") return det.NamaCustom;
                    if(h === "Kategori") return "Produksi Internal";
                    if(h === "HargaJual") return 0; // Default 0
                    if(h === "StokSaatIni") return parseFloat(det.JumlahProduksi || 0);
                    return "";
                 });
                 sheetProduk.appendRow(row);
              }
           });
        }
     }
  }
}

function updateWorkOrder(data) {
  try {
    var sheetWO = getSheet("WorkOrder");
    var woData = sheetWO.getDataRange().getValues();
    var headersWO = woData[0];
    var rowIndexWO = -1;
    var oldStatus = "";
    
    for (var i = 1; i < woData.length; i++) {
      if (woData[i][0] == data.wo.ID) {
        rowIndexWO = i + 1;
        oldStatus = woData[i][headersWO.indexOf("Status")];
        break;
      }
    }
    if (rowIndexWO === -1) return { success: false, message: "WO tidak ditemukan." };
    if (oldStatus === "Selesai" || oldStatus === "Batal") return { success: false, message: "WO dengan status " + oldStatus + " tidak dapat diubah." };
    
    // APPROVAL LOGIC
    if (oldStatus === "Berjalan" && data.userRole !== "Pemilik (Owner)") {
       var sheetApp = getSheet("ApprovalRequest");
       sheetApp.appendRow([generateID(), data.wo.ID, JSON.stringify(data), data.username || "Staf", getCurrentTime(), "Pending"]);
       return { success: true, message: "Perubahan diajukan dan menunggu persetujuan Owner." };
    }
    
    executeUpdateWO(data);
    return { success: true, message: "Work Order berhasil diperbarui!" };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function approveWOEdit(data) {
  try {
    var sheetApp = getSheet("ApprovalRequest");
    var appData = sheetApp.getDataRange().getValues();
    var appHeaders = appData[0];
    var rowIdx = -1;
    for(var i=1; i<appData.length; i++) {
      if(appData[i][0] == data.id) { rowIdx = i+1; break; }
    }
    if(rowIdx === -1) return { success: false, message: "Request tidak ditemukan" };
    
    var payloadJSON = appData[rowIdx-1][appHeaders.indexOf("DataBaruJSON")];
    var payload = JSON.parse(payloadJSON);
    
    executeUpdateWO(payload);
    
    sheetApp.getRange(rowIdx, appHeaders.indexOf("StatusApproval") + 1).setValue("Disetujui");
    return { success: true, message: "Perubahan berhasil disetujui dan diaplikasikan." };
  } catch(err) { return { success: false, message: err.toString() }; }
}

function rejectWOEdit(data) {
  try {
    var sheetApp = getSheet("ApprovalRequest");
    var appData = sheetApp.getDataRange().getValues();
    var appHeaders = appData[0];
    var rowIdx = -1;
    for(var i=1; i<appData.length; i++) {
      if(appData[i][0] == data.id) { rowIdx = i+1; break; }
    }
    if(rowIdx === -1) return { success: false, message: "Request tidak ditemukan" };
    
    sheetApp.getRange(rowIdx, appHeaders.indexOf("StatusApproval") + 1).setValue("Ditolak");
    return { success: true, message: "Perubahan telah ditolak." };
  } catch(err) { return { success: false, message: err.toString() }; }
}

function createLaporanProduksi(data) {
  try {
    var sheet = getSheet("LaporanProduksi");
    data.ID = generateID();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(h => data[h] || "");
    sheet.appendRow(row);
    return { success: true, message: "Laporan produksi berhasil dicatat!" };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

// ==========================================
// AUTENTIKASI & KEAMANAN
// ==========================================

function loginUser(username, password) {
  try {
    var sheet = getSheet("Pengguna");
    if (!sheet) return { success: false, message: "Sheet Pengguna tidak ditemukan" };
    
    var hashedInput = hashSHA256(password);
    var data = sheet.getDataRange().getValues();
    
    // Asumsi urutan kolom: [ID, NamaPengguna, KataSandi, Peran, Status, TanggalDibuat]
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === username && data[i][2] === hashedInput) {
        if (data[i][4] !== "Aktif") {
          return { success: false, message: "Akun Anda dinonaktifkan." };
        }
        
        var token = Utilities.base64Encode(username + ":" + Date.now());
        logActivity(data[i][0], "Login", "Autentikasi", "Pengguna berhasil login ke sistem.");

        return { 
          success: true, 
          token: token,
          user: {
            id: String(data[i][0]),
            username: String(data[i][1]),
            role: String(data[i][3])
          }
        };
      }
    }
    return { success: false, message: "Nama Pengguna atau Kata Sandi salah." };
  } catch (err) {
    return { success: false, message: "Server Error: " + err.message };
  }
}

function validateToken(tokenInput) {
  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(tokenInput)).getDataAsString();
    var parts = decoded.split(':');
    var timestamp = parseInt(parts[1], 10);
    var now = Date.now();
    // 24 hours expiration
    if (now - timestamp > 86400000) {
      return false; 
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Memvalidasi token dan mengembalikan object user (untuk routing SSR)
function validateSession(tokenInput) {
  if (!tokenInput || !validateToken(tokenInput)) return null;
  
  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(tokenInput)).getDataAsString();
    var username = decoded.split(':')[0];
    
    var sheet = getSheet("Pengguna");
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === username && data[i][4] === "Aktif") {
        return {
          id: String(data[i][0]),
          username: String(data[i][1]),
          role: String(data[i][3])
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ==========================================
// FUNGSI UTILITY (BANTUAN)
// ==========================================

function logActivity(userId, action, module, description) {
  var sheet = getSheet("LogAktivitas");
  if(sheet) {
    // [ID, Waktu, IDPengguna, Aksi, Modul, Deskripsi]
    sheet.appendRow([generateID(), getCurrentTime(), userId, action, module, description]);
  }
}

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

function getDashboardStats(role) {
  try {
    var stats = {};
    
    // Total Penjualan Hari Ini & Keseluruhan (SOPenjualan)
    var dPenjualan = readData("Penjualan").data || [];
    var todayStr = new Date().toISOString().split('T')[0];
    
    stats.totalPenjualan = dPenjualan.reduce((sum, p) => sum + (parseFloat(p.TotalAkhir || p.TotalBiaya || p.TotalNilai || 0)), 0);
    stats.transaksiHariIni = dPenjualan.filter(p => p.Tanggal && p.Tanggal.split('T')[0] === todayStr).length;
    
    // Total Pelanggan Aktif
    var dPelanggan = readData("Pelanggan").data || [];
    stats.totalPelanggan = dPelanggan.filter(p => p.Status === "Aktif").length;
    var mapPelanggan = {};
    dPelanggan.forEach(p => { mapPelanggan[p.ID] = p.Nama; });
    
    // Bahan Baku Habis
    var dBahan = readData("BahanBaku").data || [];
    stats.bahanBakuHabis = dBahan.filter(b => parseFloat(b.StokSaatIni || 0) <= parseFloat(b.StokMinimum || 0)).length;
    
    // WO Aktif
    var dWO = readData("WorkOrder").data || [];
    stats.woAktif = dWO.filter(w => w.Status !== "Selesai" && w.Status !== "Batal").length;
    stats.woSelesaiHariIni = dWO.filter(w => w.Status === "Selesai" && w.Tanggal && w.Tanggal.split('T')[0] === todayStr).length;
    
    // PO Aktif
    var dPO = readData("POPembelian").data || [];
    stats.poAktif = dPO.filter(p => p.Status !== "Selesai" && p.Status !== "Batal").length;
    
    // Keuangan (Pengeluaran & Kas)
    var dKas = readData("KeuanganKas").data || [];
    stats.totalPengeluaran = dKas.filter(k => k.Tipe === "KELUAR").reduce((sum, k) => sum + (parseFloat(k.Nominal || 0)), 0);
    stats.kasHariIni = dKas.filter(k => k.Tanggal && k.Tanggal.split('T')[0] === todayStr).reduce((sum, k) => sum + (k.Tipe === "MASUK" ? parseFloat(k.Nominal || 0) : -parseFloat(k.Nominal || 0)), 0);
    stats.labaBersih = stats.totalPenjualan - stats.totalPengeluaran;
    
    // Progres Produksi Terbaru
    var dLaporan = readData("LaporanProduksi").data || [];
    stats.recentProgress = dLaporan.slice(-5).reverse();
    
    // DETAIL BAHAN BAKU MENIPIS (UNTUK SUMMARY TABLE)
    stats.bahanBakuMenipisList = dBahan.filter(b => parseFloat(b.StokSaatIni || 0) <= parseFloat(b.StokMinimum || 0)).map(b => ({
      ID: b.ID,
      NamaItem: b.Nama,
      StokSaatIni: b.StokSaatIni,
      StokMinimum: b.StokMinimum,
      Satuan: b["Satuan Pakai"] || b["Satuan Beli"]
    }));

    // TAMBAHAN: Total Produk & Bahan Baku
    var dProduk = readData("Produk").data || [];
    stats.totalProduk = dProduk.length;
    stats.totalBahanBaku = dBahan.length;
    stats.totalWO = dWO.length;

    // Penjualan Hari Ini (Rp)
    stats.penjualanHariIni = dPenjualan.filter(p => p.Tanggal && p.Tanggal.split('T')[0] === todayStr).reduce((sum, p) => sum + (parseFloat(p.TotalAkhir || p.TotalBiaya || p.TotalNilai || 0)), 0);

    // Transaksi Terbaru (5 terakhir)
    stats.recentTransaksi = dPenjualan.slice(-5).reverse().map(p => ({
      ID: p.NoInvoice || p.ID || '-',
      Pelanggan: p.IDPelanggan === 'UMUM' ? 'Pelanggan Umum' : (mapPelanggan[p.IDPelanggan] || p.IDPelanggan || '-'),
      Total: parseFloat(p.TotalAkhir || p.TotalBiaya || p.TotalNilai || 0),
      Tanggal: p.Tanggal ? p.Tanggal.split('T')[0] : '-',
      Status: p.StatusPembayaran || p.Status || '-'
    }));

    // GRAFIK DATA AGREGASI (14 Hari Terakhir)
    var today = new Date();
    var last14Days = [];
    for(var i=13; i>=0; i--) {
      var d = new Date();
      d.setDate(today.getDate() - i);
      last14Days.push(d.toISOString().split('T')[0]);
    }

    var salesMap = {};
    var cfMasukMap = {};
    var cfKeluarMap = {};

    last14Days.forEach(dateStr => {
      salesMap[dateStr] = 0;
      cfMasukMap[dateStr] = 0;
      cfKeluarMap[dateStr] = 0;
    });

    // Aggregate Sales
    dPenjualan.forEach(p => {
      if (p.Tanggal && p.StatusPembayaran !== "Batal") {
        var dt = p.Tanggal.split('T')[0];
        if (salesMap[dt] !== undefined) {
          salesMap[dt] += parseFloat(p.TotalAkhir || p.TotalBiaya || p.TotalNilai || 0);
        }
      }
    });

    // Aggregate CashFlow
    dKas.forEach(k => {
      if (k.Tanggal) {
        var dt = k.Tanggal.split('T')[0];
        if (cfMasukMap[dt] !== undefined) {
          if(k.Tipe === "MASUK") cfMasukMap[dt] += parseFloat(k.Nominal || 0);
          else cfKeluarMap[dt] += parseFloat(k.Nominal || 0);
        }
      }
    });

    stats.chartLabels = last14Days;
    stats.chartPenjualan = last14Days.map(d => salesMap[d]);
    stats.chartCFMasuk = last14Days.map(d => cfMasukMap[d]);
    stats.chartCFKeluar = last14Days.map(d => cfKeluarMap[d]);

    
    return { success: true, data: stats };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

// ==========================================
// TAHAP 8: API VISUALIZER
// ==========================================

function uploadImageBase64(filename, base64Data, folderName) {
  try {
    var folder;
    var folders = DriveApp.getFoldersByName(folderName || "BatikSeng_Visualizer");
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName || "BatikSeng_Visualizer");
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    // Hapus "data:image/png;base64," atau sejenisnya
    var base64 = base64Data.split(',')[1] || base64Data;
    var mimeType = base64Data.split(';')[0].split(':')[1] || "image/png";
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var directUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
    return { success: true, url: directUrl, fileId: file.getId() };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function customerApproveDesign(designId, status, komentar) {
  try {
    var sheet = getSheet("DesainVisualizer");
    if (!sheet) return { success: false, message: "Database Desain tidak ditemukan." };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == designId) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) return { success: false, message: "Desain tidak ditemukan." };
    
    var statusCol = headers.indexOf("StatusApproval") + 1;
    var komCol = headers.indexOf("KomentarPelanggan") + 1;
    
    if (statusCol > 0) sheet.getRange(rowIndex, statusCol).setValue(status);
    if(komentar && komCol > 0) sheet.getRange(rowIndex, komCol).setValue(komentar);
    
    return { success: true, message: "Persetujuan berhasil dikirim." };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function getDesignById(designId) {
  try {
    var data = readData("DesainVisualizer").data || [];
    var design = data.find(d => d.ID == designId);
    if(design) {
      if (design.URLMockup && design.URLMockup.indexOf('/file/d/') !== -1) {
        var idPart = design.URLMockup.split('/file/d/')[1].split('/')[0];
        design.URLMockup = "https://drive.google.com/thumbnail?id=" + idPart + "&sz=w1000";
      } else if (design.URLMockup && design.URLMockup.indexOf('uc?export=view&id=') !== -1) {
        var idPart = design.URLMockup.split('id=')[1];
        design.URLMockup = "https://drive.google.com/thumbnail?id=" + idPart + "&sz=w1000";
      }
      return { success: true, data: design };
    }
    return { success: false, message: "Desain tidak ditemukan" };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function saveSettings(settingsArr) {
  try {
    var sheet = getSheet("Pengaturan");
    if(!sheet) return { success: false, message: "Sheet Pengaturan tidak ditemukan." };
    
    var data = sheet.getDataRange().getValues();
    var existingKeys = {};
    for (var i = 1; i < data.length; i++) {
      existingKeys[data[i][0]] = i + 1;
    }
    
    settingsArr.forEach(setting => {
      if (existingKeys[setting.Kunci]) {
        sheet.getRange(existingKeys[setting.Kunci], 2).setValue(setting.Nilai);
      } else {
        sheet.appendRow([setting.Kunci, setting.Nilai, ""]);
      }
    });
    
    return { success: true, message: "Pengaturan berhasil disimpan." };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}
