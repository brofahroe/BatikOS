'use client';

import { useState } from 'react';
import { formatRupiah, formatDate } from '@/lib/utils';
import { createCustomer } from '@/actions/customer';
import { Users2, Plus, MessageCircle, Mail, MapPin, Search } from 'lucide-react';

interface Props {
  initialCustomers: any[];
}

export default function PelangganClient({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    agency: '',
    whatsapp: '',
    email: '',
    city: 'Surakarta',
    address: '',
    category: 'Reguler',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createCustomer(form);
    setLoading(false);
    if (res.success && res.data) {
      setCustomers([res.data, ...customers]);
      setShowAdd(false);
      setForm({
        name: '',
        agency: '',
        whatsapp: '',
        email: '',
        city: 'Surakarta',
        address: '',
        category: 'Reguler',
      });
    } else {
      alert(res.message);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.agency && c.agency.toLowerCase().includes(search.toLowerCase())) ||
      (c.whatsapp && c.whatsapp.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, instansi, nomor WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B2E25]"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Instansi & Kategori</th>
                <th className="py-3.5 px-4">Kontak WhatsApp</th>
                <th className="py-3.5 px-4">Kota & Alamat</th>
                <th className="py-3.5 px-4 text-right">Total Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const waClean = c.whatsapp ? c.whatsapp.replace(/\D/g, '') : '';
                const waLink = waClean
                  ? `https://wa.me/${waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean}`
                  : null;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      {c.email && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 font-medium">{c.agency || '-'}</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 mt-0.5">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{c.whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.city || '-'}</span>
                      </p>
                      {c.address && (
                        <p className="text-[11px] text-slate-400 line-clamp-1">{c.address}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#8B2E25]">
                      {formatRupiah(c.totalSpend)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Customer */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Pelanggan Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Bpk. Bambang Soeprapto"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instansi / Perusahaan</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank Jateng Cab. Solo"
                    value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Instansi / VIP">Instansi / VIP</option>
                    <option value="Reseller / Grosir">Reseller / Grosir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kota</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alamat Singkat</label>
                  <input
                    type="text"
                    placeholder="Jl. Slamet Riyadi..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
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
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

