# BatikOS - Enterprise Mini-ERP Batik Modern

Aplikasi Mini-ERP untuk industri batik (Batik Seng) yang telah dimodernisasi dari Google Apps Script ke **Next.js (App Router)**, **Neon Serverless Postgres**, **Prisma ORM**, **NextAuth.js**, dan **Vercel Blob Storage**.

---

## 🚀 Fitur Utama

1. **Dasbor Operasional**: Pemantauan omzet bulanan, jumlah Work Order aktif, katalog produk, dan peringatan dini stok bahan baku menipis.
2. **Inventaris & Bahan Baku**: Katalog kain mori, lilin malam, pewarna kimia/alami, mutasi stok, serta konversi satuan beli ke pakai.
3. **Produksi & Work Order (WO)**: Pelacakan 5 tahapan produksi batik tradisional (Pola -> Canting/Cap -> Pewarnaan -> Pelorodan -> Finishing), alokasi penanggung jawab (PIC), dan progress bar.
4. **Penjualan & Kasir (POS)**: Pencarian cepat produk batik, perhitungan diskon/kembalian otomatis, multi-metode bayar (Tunai, Transfer, QRIS), dan cetak struk thermal 58mm/80mm (`window.print()`).
5. **Pelanggan (CRM)**: Database pelanggan instansi/grosir dengan tautan chat langsung ke WhatsApp (`wa.me`).
6. **Keuangan & Buku Kas**: Pencatatan kas masuk otomatis dari POS dan kas keluar operasional, beserta saldo kas bersih.
7. **Katalog Desain & Visualizer**: Upload foto motif batik via Vercel Blob dan pembuatan tautan **Public Approval** untuk persetujuan klien (`/approval/[id]`).
8. **Pengguna & RBAC**: Manajemen pengguna dengan pembagian peran (*Admin*, *Owner*, *Kasir*, *Staff Produksi*, *Staff Inventaris*).
9. **Pengaturan**: Konfigurasi identitas toko, nomor kontak, dan teks footer struk belanja.

---

## 🛠️ Langkah Menghubungkan ke Neon Postgres

### 1. Buat Database di Neon (Gratis)
1. Buka [neon.tech](https://neon.tech) dan login / daftar.
2. Buat proyek baru (misal: `batikos-prod`).
3. Pada halaman **Dashboard** Neon, salin connection string:
   * **Pooled Connection**: Gunakan opsi `Connection pooling` diaktifkan untuk `DATABASE_URL`.
   * **Direct Connection**: Gunakan opsi tanpa pooling untuk `DIRECT_URL`.

### 2. Konfigurasi File `.env`
Isi file `.env` di komputer lokal Anda:
```env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[ENDPOINT]-pooler.[REGION].aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[ENDPOINT].[REGION].aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="buat-string-acak-panjang-disini-minimal-32-karakter"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_token_anda"
```

### 3. Eksekusi Skema & Seed Data
Jalankan perintah berikut di terminal:
```bash
# Push skema tabel Prisma ke database Neon
npx prisma db push

# Masukkan akun default dan data master contoh
npx prisma db seed
```

**Akun Bawaan Seeding:**
* **Administrator**: `admin` / `admin123`
* **Pemilik (Owner)**: `owner` / `owner123`
* **Kasir**: `kasir` / `kasir123`

---

## 🌐 Panduan Deploy ke Vercel

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete migration of BatikOS to Next.js and Neon"
   git remote add origin https://github.com/username/batikos.git
   git push -u origin master
   ```

2. **Import ke Vercel**:
   * Buka [vercel.com](https://vercel.com) > **Add New Project** > Pilih repositori `batikos`.
   * Di bagian **Environment Variables**, tambahkan:
     * `DATABASE_URL` (dari Neon)
     * `DIRECT_URL` (dari Neon)
     * `NEXTAUTH_SECRET` (string acak aman)
     * `NEXTAUTH_URL` (`https://nama-proyek-anda.vercel.app`)
   * Buka tab **Storage** pada proyek Vercel Anda, klik **Create Database** > **Blob**, lalu hubungkan ke proyek (environment variable `BLOB_READ_WRITE_TOKEN` akan otomatis terisi).
   * Klik **Deploy**!

---

## 📂 Struktur Repositori

```
BatikOS/
├── legacy-gas/            # Arsip seluruh file Google Apps Script lama
├── docs/                  # PRD dan dokumen perencanaan
├── prisma/
│   ├── schema.prisma      # Definisi 19 model relasional
│   └── seed.ts            # Skrip seed akun dan data awal
├── src/
│   ├── actions/           # Server Actions untuk operasi CRUD aman
│   ├── app/
│   │   ├── (auth)/login/  # Halaman login batik
│   │   ├── (dashboard)/   # Seluruh modul ERP terproteksi
│   │   ├── approval/      # Halaman publik persetujuan klien
│   │   └── api/           # Route handler Auth & Upload
│   ├── components/        # Komponen UI modular
│   ├── lib/               # Prisma client, auth, formatters
│   └── middleware.ts      # Pengamanan rute dan RBAC guard
```
