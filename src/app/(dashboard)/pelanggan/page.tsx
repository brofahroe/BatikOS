import prisma from '@/lib/prisma';
import PelangganClient from './PelangganClient';

export default async function PelangganPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { totalSpend: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pelanggan & CRM</h1>
          <p className="text-sm text-slate-500 mt-1">
            Data relasi pelanggan instansi, pembeli grosir, dan riwayat loyalitas belanja.
          </p>
        </div>
      </div>

      <PelangganClient initialCustomers={customers} />
    </div>
  );
}

