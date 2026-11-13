'use client';

import { useState } from 'react';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { createManualCashFlow } from '@/actions/finance';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
  Search,
  DollarSign,
} from 'lucide-react';

interface Props {
  initialCashFlows: any[];
  masuk: number;
  keluar: number;
  saldo: number;
}

export default function KeuanganClient({
  initialCashFlows,
  masuk,
  keluar,
  saldo,
}: Props) {
  const [cashFlows, setCashFlows] = useState(initialCashFlows);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [category, setCategory] = useState('Operasional Workshop');
  const [amount, setAmount] = useState<number>(50000);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createManualCashFlow({
      type,
      category,
      amount: Number(amount),
      description,
    });
    setLoading(false);
    if (res.success && res.data) {
      setCashFlows([res.data, ...cashFlows]);
      setShowAdd(false);
      setDescription('');
      window.location.reload();
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas Masuk
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(masuk)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas Keluar
            </p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(keluar)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Kas Tersedia
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatRupiah(saldo)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm">Riwayat Catatan Kas</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Kas Manual</span>
        </button>
      </div>

      {/* Cash Flow Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Tanggal & Waktu</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Keterangan / Transaksi</th>
                <th className="py-3.5 px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashFlows.map((cf) => {
                const isIncome = cf.type === 'IN';
                return (
                  <tr key={cf.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {formatDateTime(cf.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      {isIncome ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ArrowDownRight className="w-3 h-3" />
                          Kas Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          <ArrowUpRight className="w-3 h-3" />
                          Kas Keluar
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{cf.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {cf.description || cf.salesOrder?.soNumber || '-'}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold ${
                        isIncome ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(cf.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Manual Cash */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Catat Kas Manual</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Arus Kas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('OUT');
                      setCategory('Operasional Workshop');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition-all ${
                      type === 'OUT'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Kas Keluar (Biaya)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('IN');
                      setCategory('Pendapatan Lain-lain');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition-all ${
                      type === 'IN'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Kas Masuk (Lain)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pembelian lilin tambahan di pasar malam"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
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
                  {loading ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

