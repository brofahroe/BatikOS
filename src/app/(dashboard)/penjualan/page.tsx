import prisma from '@/lib/prisma';
import PosClient from './PosClient';
import { auth } from '@/auth';

export default async function PenjualanPage() {
  const session = await auth();

  const [products, customers, recentOrders] = await Promise.all([
    prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.salesOrder.findMany({
      take: 20,
      orderBy: { date: 'desc' },
      include: {
        customer: true,
        details: { include: { product: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kasir & Penjualan (POS)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Transaksi cepat point-of-sale, pemotongan stok otomatis, dan cetak struk nota belanja.
          </p>
        </div>
      </div>

      <PosClient
        products={products}
        customers={customers}
        recentOrders={recentOrders}
        currentUser={session?.user}
      />
    </div>
  );
}

