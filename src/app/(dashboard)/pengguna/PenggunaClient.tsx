'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { createUser, toggleUserStatus } from '@/actions/users';
import { ShieldCheck, Plus, User, Key, CheckCircle, XCircle } from 'lucide-react';
import { Role } from '@prisma/client';

interface Props {
  initialUsers: any[];
}

export default function PenggunaClient({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.CASHIER);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createUser({ username, fullName, password, role });
    setLoading(false);

    if (res.success && res.data) {
      setUsers([res.data, ...users]);
      setShowAdd(false);
      setUsername('');
      setFullName('');
      setPassword('');
    } else {
      alert(res.message);
    }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    const res = await toggleUserStatus(id, currentStatus);
    if (res.success) {
      setUsers(
        users.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
      );
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#8B2E25]" />
          <span className="font-bold text-slate-800 text-sm">
            Total {users.length} Akun Terdaftar
          </span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap & Username</th>
                <th className="py-3.5 px-4">Peran (Role RBAC)</th>
                <th className="py-3.5 px-4">Tanggal Dibuat</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800">{u.fullName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 px-4 text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggle(u.id, u.isActive)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        u.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Akun Pengguna Baru</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="kasir_sore"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Siti Aminah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value={Role.CASHIER}>Kasir (POS & Penjualan)</option>
                  <option value={Role.PRODUCTION}>Staff Produksi (Work Order & BoM)</option>
                  <option value={Role.INVENTORY}>Staff Inventaris (Bahan & Stok)</option>
                  <option value={Role.OWNER}>Pemilik (Owner - Akses Laporan & Approval)</option>
                  <option value={Role.ADMIN}>Administrator (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#8B2E25] text-white rounded-xl font-semibold hover:bg-[#71221B]"
                >
                  {loading ? 'Menyimpan...' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

