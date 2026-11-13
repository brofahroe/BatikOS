import prisma from '@/lib/prisma';
import { formatRupiah } from '@/lib/utils';
import InventarisClient from './InventarisClient';

export default async function InventarisPage() {
  const [rawMaterials, products, suppliers] = await Promise.all([
    prisma.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Inventaris</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau stok kain mori, lilin malam, bahan kimia pewarna, dan stok produk batik jadi.
          </p>
        </div>
      </div>

      <InventarisClient
        initialMaterials={rawMaterials}
        initialProducts={products}
        suppliers={suppliers}
      />
    </div>
  );
}

