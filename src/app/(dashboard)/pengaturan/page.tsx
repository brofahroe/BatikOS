import prisma from '@/lib/prisma';
import PengaturanClient from './PengaturanClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function PengaturanPage() {
  const session = await auth();

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'OWNER') {
    redirect('/');
  }

  const rawSettings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  rawSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem & Toko</h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi identitas toko, format struk kasir, dan preferensi aplikasi BatikOS.
          </p>
        </div>
      </div>

      <PengaturanClient initialSettings={settingsMap} />
    </div>
  );
}

