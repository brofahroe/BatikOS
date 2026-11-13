'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { createWorkOrder, updateStageProgress } from '@/actions/production';
import {
  Hammer,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Check,
} from 'lucide-react';

interface Props {
  workOrders: any[];
  products: any[];
  currentUser?: any;
}

export default function ProduksiClient({ workOrders, products, currentUser }: Props) {
  const [showAddWO, setShowAddWO] = useState(false);
  const [productId, setProductId] = useState('');
  const [targetQty, setTargetQty] = useState(10);
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Stage update modal
  const [selectedStage, setSelectedStage] = useState<any | null>(null);
  const [picName, setPicName] = useState('');
  const [stageNotes, setStageNotes] = useState('');

  async function handleCreateWO(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      alert('Pilih produk yang akan diproduksi.');
      return;
    }
    setLoading(true);
    const res = await createWorkOrder({
      productId,
      targetQty: Number(targetQty),
      deadline: deadline || undefined,
      notes,
      managedById: currentUser?.id,
    });
    setLoading(false);
    if (res.success) {
      setShowAddWO(false);
      window.location.reload();
    } else {
      alert(res.message);
    }
  }

  async function handleUpdateStage(status: 'IN_PROGRESS' | 'COMPLETED') {
    if (!selectedStage) return;
    setLoading(true);
    const res = await updateStageProgress({
      stageId: selectedStage.id,
      status,
      picName,
      notes: stageNotes,
    });
    setLoading(false);
    if (res.success) {
      setSelectedStage(null);
      window.location.reload();
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Hammer className="w-5 h-5 text-[#8B2E25]" />
          <span className="font-bold text-slate-800 text-sm">
            Total {workOrders.length} Order Produksi
          </span>
        </div>
        <button
          onClick={() => setShowAddWO(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Work Order Baru</span>
        </button>
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {workOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
            <Hammer className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">Belum Ada Work Order</p>
            <p className="text-xs text-slate-400 mt-1">
              Buat WO baru untuk memulai proses pembatikan dan alokasi bahan.
            </p>
          </div>
        ) : (
          workOrders.map((wo) => {
            const completedCount = wo.stages.filter((s: any) => s.status === 'COMPLETED').length;
            const progressPercent = Math.round((completedCount / wo.stages.length) * 100);

            return (
              <div
                key={wo.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* WO Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {wo.woNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          wo.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : wo.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#8B2E25] mt-1">
                      {wo.product.name} (Motif: {wo.product.motif || '-'}) &bull; Target: {wo.targetQty} Pcs
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="flex items-center sm:justify-end gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Deadline: {formatDate(wo.deadline)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Dibuat oleh: {wo.managedBy?.fullName || 'Admin'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Progres Pengerjaan</span>
                    <span className="text-[#8B2E25]">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B2E25] transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stages Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
                  {wo.stages.map((stage: any, idx: number) => {
                    const isDone = stage.status === 'COMPLETED';
                    const isCurrent = stage.status === 'IN_PROGRESS';
                    return (
                      <div
                        key={stage.id}
                        onClick={() => {
                          setSelectedStage(stage);
                          setPicName(stage.picName || '');
                          setStageNotes(stage.notes || '');
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          isDone
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : isCurrent
                            ? 'bg-amber-50/60 border-amber-300 text-amber-900 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Tahap {idx + 1}
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : isCurrent ? (
                              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <p className="font-bold leading-tight">{stage.stageName}</p>
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-200/40 text-[10px] text-slate-500 flex justify-between items-center">
                          <span>PIC: {stage.picName || '-'}</span>
                          <span className="font-bold underline">Ubah &rarr;</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add WO */}
      {showAddWO && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Buat Work Order Baru</h3>
            <form onSubmit={handleCreateWO} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Produk</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="">Pilih Produk Batik...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - {p.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Jumlah (Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetQty}
                    onChange={(e) => setTargetQty(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Khusus</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pastikan pewarnaan sogan klasik lebih pekat"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddWO(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#8B2E25] text-white rounded-xl font-semibold hover:bg-[#71221B]"
                >
                  {loading ? 'Menyimpan...' : 'Rilis Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Update Stage */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Update: {selectedStage.stageName}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Penanggung Jawab (PIC / Pembatik)
                </label>
                <input
                  type="text"
                  placeholder="Nama pengrajin / staf..."
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Progres</label>
                <input
                  type="text"
                  placeholder="e.g. Selesai 10 lembar kain"
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdateStage('IN_PROGRESS')}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Set Sedang Dikerjakan</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdateStage('COMPLETED')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Tandai Selesai (Completed)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStage(null)}
                  className="w-full py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-medium mt-1"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

