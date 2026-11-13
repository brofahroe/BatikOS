'use client';

import { useState, useRef } from 'react';
import { createBatikDesign, generateApprovalLink } from '@/actions/visualizer';
import { upload } from '@vercel/blob/client';
import {
  Palette,
  Plus,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  initialDesigns: any[];
}

export default function VisualizerClient({ initialDesigns }: Props) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [showAdd, setShowAdd] = useState(false);
  const [showShareModal, setShowShareModal] = useState<any | null>(null);

  // Form New Design
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [motifName, setMotifName] = useState('');
  const [category, setCategory] = useState('Batik Tulis');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Share Approval
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Direct browser-to-blob upload bypasses 4.5MB Serverless Function limits
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      setImageUrl(newBlob.url);
    } catch (err: any) {
      console.warn('Vercel Blob token not configured locally or error, asking for URL fallback:', err);
      const manualUrl = prompt(
        'Upload Vercel Blob memerlukan BLOB_READ_WRITE_TOKEN di .env. Anda dapat memasukkan URL gambar langsung:'
      );
      if (manualUrl) setImageUrl(manualUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateDesign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createBatikDesign({
      code,
      title,
      motifName,
      category,
      baseImageUrl: imageUrl,
      description,
    });
    setLoading(false);
    if (res.success && res.data) {
      setDesigns([res.data, ...designs]);
      setShowAdd(false);
      setCode('');
      setTitle('');
      setMotifName('');
      setImageUrl('');
      setDescription('');
    } else {
      alert(res.message);
    }
  }

  async function handleGenerateApproval(e: React.FormEvent) {
    e.preventDefault();
    if (!showShareModal) return;
    setLoading(true);
    const res = await generateApprovalLink({
      designId: showShareModal.id,
      customerName,
      customerPhone,
    });
    setLoading(false);
    if (res.success && res.approvalId) {
      const fullUrl = `${window.location.origin}/approval/${res.approvalId}`;
      setGeneratedLink(fullUrl);
    } else {
      alert(res.message);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#8B2E25]" />
          <span className="font-bold text-slate-800 text-sm">
            Total {designs.length} Pola Desain
          </span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Desain Baru</span>
        </button>
      </div>

      {/* Grid Designs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {designs.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:border-[#8B2E25] transition-all group"
          >
            <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {d.baseImageUrl ? (
                <img
                  src={d.baseImageUrl}
                  alt={d.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-1">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">Belum ada foto</span>
                </div>
              )}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-sm">
                {d.category}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {d.code}
                </p>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{d.title}</h4>
                <p className="text-xs font-semibold text-[#8B2E25] mt-0.5">Motif: {d.motifName}</p>
                {d.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{d.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {d.approvals?.length || 0} Approval
                </span>
                <button
                  onClick={() => {
                    setShowShareModal(d);
                    setCustomerName('');
                    setCustomerPhone('');
                    setGeneratedLink('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kirim Approval</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Design */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Upload Desain Motif Baru</h3>
            <form onSubmit={handleCreateDesign} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Desain</label>
                  <input
                    type="text"
                    required
                    placeholder="DSN-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Motif</label>
                  <input
                    type="text"
                    required
                    placeholder="Parang Barong"
                    value={motifName}
                    onChange={(e) => setMotifName(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Desain</label>
                <input
                  type="text"
                  required
                  placeholder="Kain Panjang Parang Barong Sogan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="Batik Tulis">Batik Tulis</option>
                  <option value="Batik Cap">Batik Cap</option>
                  <option value="Batik Kombinasi">Batik Kombinasi</option>
                  <option value="Kemeja Custom">Kemeja Custom Seragam</option>
                </select>
              </div>

              {/* Upload Foto */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gambar Desain (Vercel Blob Storage)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center cursor-pointer hover:border-[#8B2E25] transition-all bg-slate-50"
                >
                  {uploading ? (
                    <p className="text-slate-500">Mengupload ke Vercel Blob...</p>
                  ) : imageUrl ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Gambar Berhasil Dipilih</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-slate-700">Klik untuk upload foto</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, atau WEBP</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi & Makna Filosofis</label>
                <textarea
                  rows={2}
                  placeholder="Makna filosofis motif parang barong..."
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
                  {loading ? 'Menyimpan...' : 'Simpan Desain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Share Approval Link */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Kirim Persetujuan Klien: {showShareModal.title}
            </h3>

            {!generatedLink ? (
              <form onSubmit={handleGenerateApproval} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Klien / Pembeli</label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Hendra (Dinas Kebudayaan)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. WhatsApp Klien (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(null)}
                    className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#8B2E25] text-white rounded-xl font-semibold hover:bg-[#71221B]"
                  >
                    {loading ? 'Membuat Tautan...' : 'Buat Tautan Approval'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <p className="font-bold">Tautan Persetujuan Siap Dikirim!</p>
                  <p className="text-[11px] mt-0.5">
                    Klien dapat membuka tautan ini di HP tanpa perlu login untuk menyetujui desain atau mengajukan catatan revisi.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-slate-700 text-xs font-mono select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 flex items-center gap-1 font-semibold flex-shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                {customerPhone && (
                  <a
                    href={`https://wa.me/${
                      customerPhone.startsWith('0') ? '62' + customerPhone.slice(1) : customerPhone
                    }?text=${encodeURIComponent(
                      `Halo Bapak/Ibu ${customerName}, berikut adalah tautan persetujuan desain motif batik Anda dari Batik Seng:\n\n${generatedLink}\n\nMohon ditinjau dan klik setujui atau kirimkan catatan revisi. Terima kasih!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim Langsung via WhatsApp</span>
                  </a>
                )}

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B2E25] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tautan Klien</span>
                  </a>
                  <button
                    onClick={() => setShowShareModal(null)}
                    className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

