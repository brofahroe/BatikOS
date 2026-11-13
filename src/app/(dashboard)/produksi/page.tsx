import prisma from '@/lib/prisma';
import ProduksiClient from './ProduksiClient';
import { auth } from '@/auth';

export default async function ProduksiPage() {
  const session = await auth();

  const [workOrders, products] = await Promise.all([
    prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        stages: { orderBy: { id: 'asc' } },
        managedBy: true,
      },
    }),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Produksi & Work Order (WO)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau 5 tahapan produksi batik (Pola, Canting, Pewarnaan, Pelorodan, dan Finishing).
          </p>
        </div>
      </div>

      <ProduksiClient
        workOrders={workOrders}
        products={products}
        currentUser={session?.user}
      />
    </div>
  );
}

