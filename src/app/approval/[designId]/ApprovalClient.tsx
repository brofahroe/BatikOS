'use client';

import { useState } from 'react';
import { submitPublicApproval } from '@/actions/visualizer';
import { formatDateTime } from '@/lib/utils';
import {
  CheckCircle2,
  AlertCircle,
  Palette,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface Props {
  approval: any;
}

export default function ApprovalClient({ approval: initialApproval }: Props) {
  const [approval, setApproval] = useState(initialApproval);
  const [feedback, setFeedback] = useState(initialApproval.feedback || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const design = approval.design;
  const isFinal = approval.status === 'APPROVED' || submitted;

  async function handleAction(status: 'APPROVED' | 'REVISION') {
    if (status === 'REVISION' && !feedback.trim()) {
      alert('Mohon cantumkan catatan revisi agar tim pembatik kami dapat menyesuaikan motif.');
      return;
    }

    setLoading(true);
    const res = await submitPublicApproval({
      approvalId: approval.id,
      status,
      feedback,
    });
    setLoading(false);

    if (res.success && res.data) {
      setApproval(res.data);
      setSubmitted(true);
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#8B2E25]/30 via-slate-900/90 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full bg-slate-800/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2 border-b border-white/10 pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8B2E25] text-white shadow-lg mb-1">
            <span className="font-serif font-bold text-lg">BS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Batik Seng Solo</h1>
          <p className="text-xs text-slate-400">Lembar Persetujuan Desain Pola Batik</p>
        </div>

        {/* Customer Greeting */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">Klien Yang Terhormat</p>
            <h2 className="text-base font-bold text-amber-400">
              {approval.customerName || 'Bapak/Ibu Pelanggan'}
            </h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              approval.status === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : approval.status === 'REVISION'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {approval.status === 'APPROVED'
              ? '✓ Telah Disetujui'
              : approval.status === 'REVISION'
              ? '✎ Revisi Diajukan'
              : 'Menunggu Persetujuan'}
          </span>
        </div>

        {/* Design Visual Card */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950 aspect-video flex items-center justify-center relative">
            {design.baseImageUrl ? (
              <img
                src={design.baseImageUrl}
                alt={design.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-500 flex flex-col items-center gap-2">
                <Palette className="w-10 h-10 text-slate-600" />
                <span className="text-xs">Gambar Pola Pratinjau</span>
              </div>
            )}
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-xs font-semibold text-white">
              {design.category}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{design.title}</h3>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">
              Motif Batik: {design.motifName}
            </p>
            {design.description && (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-white/5 p-3 rounded-xl">
                {design.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Panel */}
        {approval.status === 'APPROVED' ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-emerald-300 text-sm">Terima Kasih!</h4>
            <p className="text-xs text-slate-300">
              Desain ini telah Anda setujui pada {formatDateTime(approval.approvedAt)}. Tim pembatik kami akan segera memulai proses produksi.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Catatan atau Masukan Revisi (Opsional jika setuju):</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan catatan perubahan warna, tata letak, atau ukuran motif di sini..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-3 bg-slate-900/80 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('REVISION')}
                className="py-3 px-4 rounded-xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Minta Revisi Desain</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('APPROVED')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Desain Ini</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-white/10 text-[10px] text-slate-500">
          Butuh konsultasi langsung? Hubungi WhatsApp Batik Seng Solo di <span className="text-slate-300 font-semibold">0812-3456-7890</span>
        </div>
      </div>
    </div>
  );
}

