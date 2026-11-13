import prisma from '@/lib/prisma';
import VisualizerClient from './VisualizerClient';

export default async function VisualizerPage() {
  const designs = await prisma.batikDesign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      approvals: { orderBy: { createdAt: 'desc' } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Katalog Desain & Visualizer Batik
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Koleksi motif pola batik, preview visual, dan pembuatan tautan persetujuan desain (*Public Approval*) untuk klien.
          </p>
        </div>
      </div>

      <VisualizerClient initialDesigns={designs} />
    </div>
  );
}

