import prisma from '@/lib/prisma';
import PenggunaClient from './PenggunaClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function PenggunaPage() {
  const session = await auth();

  // Role guard: Only ADMIN or OWNER can view/manage users
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'OWNER') {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna & Hak Akses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akun staf, kasir, bagian produksi, dan hak akses sistem (Role-Based Access Control).
          </p>
        </div>
      </div>

      <PenggunaClient initialUsers={users} />
    </div>
  );
}

