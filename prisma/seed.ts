import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database BatikOS...');

  // 1. Akun Pengguna Default
  const adminPassword = await bcrypt.hash('admin123', 10);
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'Administrator BatikOS',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      passwordHash: ownerPassword,
      fullName: 'Bapak Pemilik (Owner)',
      role: Role.OWNER,
      isActive: true,
    },
  });

  const kasir = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      passwordHash: kasirPassword,
      fullName: 'Staf Kasir Utama',
      role: Role.CASHIER,
      isActive: true,
    },
  });

  console.log('✅ Pengguna default siap: admin, owner, kasir (password: <user>123)');

  // 2. Pengaturan Toko / Sistem
  const settings = [
    { key: 'STORE_NAME', value: 'Batik Seng Surakarta', description: 'Nama resmi toko/bisnis batik' },
    { key: 'STORE_ADDRESS', value: 'Jl. Laweyan No. 45, Solo, Jawa Tengah', description: 'Alamat workshop & butik' },
    { key: 'STORE_PHONE', value: '081234567890', description: 'Nomor kontak WhatsApp resmi' },
    { key: 'RECEIPT_FOOTER', value: 'Matur Nuwun sampun blonjo wonten Batik Seng.', description: 'Catatan kaki pada cetak struk POS' },
    { key: 'TAX_PERCENT', value: '0', description: 'Persentase PPN default (%)' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✅ Pengaturan sistem berhasil disematkan.');

  // 3. Pemasok Awal
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'CV Kain Mori Nusantara',
      picName: 'H. Sudarsono',
      address: 'Pekalongan, Jawa Tengah',
      whatsapp: '081399887766',
      email: 'sales@kainmorinusantara.co.id',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Toko Kimia Pewarna Alami Solo',
      picName: 'Ibu Ratna',
      address: 'Pasar Klewer Blok B, Surakarta',
      whatsapp: '081255443322',
      email: 'ratna.pewarna@gmail.com',
    },
  });

  // 4. Bahan Baku Awal
  const bahan1 = await prisma.rawMaterial.create({
    data: {
      code: 'BHN-001',
      name: 'Kain Mori Primissima Cap Sen',
      category: 'Kain Putih',
      buyUnit: 'Gulung (50m)',
      useUnit: 'Meter',
      conversionRatio: 50,
      buyPrice: 1500000,
      sellPrice: 35000,
      minStock: 20,
      currentStock: 150,
      supplierId: supplier1.id,
    },
  });

  const bahan2 = await prisma.rawMaterial.create({
    data: {
      code: 'BHN-002',
      name: 'Malam / Lilin Batik Coklat Super',
      category: 'Malam',
      buyUnit: 'Karung (25kg)',
      useUnit: 'Kg',
      conversionRatio: 25,
      buyPrice: 750000,
      sellPrice: 35000,
      minStock: 10,
      currentStock: 45,
      supplierId: supplier2.id,
    },
  });

  const bahan3 = await prisma.rawMaterial.create({
    data: {
      code: 'BHN-003',
      name: 'Pewarna Napthol Merah B',
      category: 'Pewarna Kimia',
      buyUnit: 'Kaleng (1kg)',
      useUnit: 'Gram',
      conversionRatio: 1000,
      buyPrice: 180000,
      sellPrice: 250,
      minStock: 500,
      currentStock: 2500,
      supplierId: supplier2.id,
    },
  });

  console.log('✅ Master data pemasok & bahan baku berhasil dibuat.');

  // 5. Produk Jadi Awal
  const produk1 = await prisma.product.create({
    data: {
      code: 'PRD-001',
      name: 'Kemeja Pria Motif Parang Kusumo',
      category: 'Pakaian Pria',
      motif: 'Parang Kusumo',
      color: 'Sogan Coklat Klasik',
      size: 'L',
      hpp: 140000,
      sellPrice: 285000,
      stock: 25,
      photoUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    },
  });

  const produk2 = await prisma.product.create({
    data: {
      code: 'PRD-002',
      name: 'Kain Panjang Tulis Halus Truntum',
      category: 'Kain Panjang',
      motif: 'Truntum Garuda',
      color: 'Hitam Emas',
      size: '2.5m x 1.15m',
      hpp: 450000,
      sellPrice: 850000,
      stock: 12,
      photoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    },
  });

  const produk3 = await prisma.product.create({
    data: {
      code: 'PRD-003',
      name: 'Blouse Wanita Megamendung Modern',
      category: 'Pakaian Wanita',
      motif: 'Megamendung',
      color: 'Biru Gradasi',
      size: 'M',
      hpp: 110000,
      sellPrice: 225000,
      stock: 18,
      photoUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    },
  });

  // 6. Resep BoM Contoh
  await prisma.productRecipeBOM.create({
    data: {
      productId: produk1.id,
      rawMaterialId: bahan1.id,
      quantityNeeded: 2.2, // 2.2 meter mori per kemeja
    },
  });

  // 7. Pelanggan Contoh
  await prisma.customer.create({
    data: {
      name: 'Bpk. Hendra Gunawan',
      agency: 'Dinas Kebudayaan Kota Solo',
      address: 'Slamet Riyadi No. 120, Surakarta',
      whatsapp: '081233445566',
      email: 'hendra.gunawan@solo.go.id',
      city: 'Surakarta',
      category: 'Instansi / VIP',
      totalSpend: 1500000,
    },
  });

  console.log('✅ Produk, Resep BoM, dan Data Pelanggan siap digunakan.');
  console.log('🎉 Seeding database BatikOS berhasil diselesaikan!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

