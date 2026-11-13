import prisma from '@/lib/prisma';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Hammer,
  ArrowUpRight,
  ShoppingCart,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  // Ambil statistik real-time dari database Neon via Prisma
  let totalSalesMonth = 0;
  let activeWOCount = 0;
  let rawMaterialsWarning: any[] = [];
  let recentSales: any[] = [];
  let totalProducts = 0;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [salesAggregate, activeWOs, lowStockMaterials, salesList, productsCount] =
      await Promise.all([
        prisma.salesOrder.aggregate({
          where: { date: { gte: startOfMonth } },
          _sum: { netAmount: true },
        }),
        prisma.workOrder.count({
          where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
        }),
        prisma.rawMaterial.findMany({
          where: {
            currentStock: { lte: prisma.rawMaterial.fields.minStock },
          },
          take: 5,
        }),
        prisma.salesOrder.findMany({
          take: 5,
          orderBy: { date: 'desc' },
          include: { customer: true },
        }),
        prisma.product.count(),
      ]);

    totalSalesMonth = salesAggregate._sum.netAmount || 0;
    activeWOCount = activeWOs;
    rawMaterialsWarning = lowStockMaterials;
    recentSales = salesList;
    totalProducts = productsCount;
  } catch (err) {
    console.error('Error fetching dashboard stats (database might be unseeded yet):', err);
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dasbor Operasional</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan performa penjualan, produksi, dan kondisi inventaris Batik Seng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/penjualan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-sm font-semibold shadow-md shadow-[#8B2E25]/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </Link>
          <Link
            href="/produksi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Buat WO Baru</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Omzet Bulan Ini */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Omzet Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{formatRupiah(totalSalesMonth)}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                Bulan Berjalan <ArrowUpRight className="w-3 h-3" />
              </span>
            </p>
          </div>
        </div>

        {/* Produksi Aktif */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Work Order Aktif
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Hammer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{activeWOCount} Order</h3>
            <p className="text-xs text-slate-500 mt-1">Dalam proses pengerjaan</p>
          </div>
        </div>

        {/* Total Katalog Produk */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Katalog Produk Batik
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{totalProducts} Item</h3>
            <p className="text-xs text-slate-500 mt-1">Siap dipajang & dipasarkan</p>
          </div>
        </div>

        {/* Bahan Baku Menipis */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bahan Baku Kritis
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{rawMaterialsWarning.length} Item</h3>
            <p className="text-xs text-red-600 font-medium mt-1">Perlu pengadaan / PO baru</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peringatan Stok Bahan Baku Menipis */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-bold text-slate-900 text-sm">Peringatan Bahan Baku Menipis</h2>
            </div>
            <Link href="/inventaris" className="text-xs font-semibold text-[#8B2E25] hover:underline">
              Kelola Stok &rarr;
            </Link>
          </div>
          <div className="p-5 flex-1">
            {rawMaterialsWarning.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium text-slate-700">Semua Stok Bahan Baku Aman</p>
                <p className="text-xs text-slate-400 mt-0.5">Tidak ada bahan baku di bawah ambang batas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rawMaterialsWarning.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-red-50/60 border border-red-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kode: {item.code} &bull; Kategori: {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                        Sisa {item.currentStock} {item.useUnit}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">Min: {item.minStock} {item.useUnit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Riwayat Penjualan Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-sm">Transaksi Penjualan Terkini</h2>
            </div>
            <Link href="/penjualan" className="text-xs font-semibold text-[#8B2E25] hover:underline">
              Semua Transaksi &rarr;
            </Link>
          </div>
          <div className="p-5 flex-1">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">Belum Ada Transaksi</p>
                <p className="text-xs text-slate-400 mt-0.5">Buka kasir untuk memulai penjualan pertama.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{sale.soNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sale.customer?.name || 'Pelanggan Umum'} &bull; {formatDate(sale.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{formatRupiah(sale.netAmount)}</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 mt-0.5">
                        {sale.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

