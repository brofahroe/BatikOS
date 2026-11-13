import prisma from '@/lib/prisma';
import KeuanganClient from './KeuanganClient';

export default async function KeuanganPage() {
  const [cashFlows, totalIn, totalOut] = await Promise.all([
    prisma.cashFlow.findMany({
      take: 50,
      orderBy: { date: 'desc' },
      include: { salesOrder: true },
    }),
    prisma.cashFlow.aggregate({
      where: { type: 'IN' },
      _sum: { amount: true },
    }),
    prisma.cashFlow.aggregate({
      where: { type: 'OUT' },
      _sum: { amount: true },
    }),
  ]);

  const masuk = totalIn._sum.amount || 0;
  const keluar = totalOut._sum.amount || 0;
  const saldo = masuk - keluar;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Keuangan & Buku Kas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau arus kas masuk dari penjualan, kas keluar operasional, dan saldo bersih bisnis.
          </p>
        </div>
      </div>

      <KeuanganClient
        initialCashFlows={cashFlows}
        masuk={masuk}
        keluar={keluar}
        saldo={saldo}
      />
    </div>
  );
}

