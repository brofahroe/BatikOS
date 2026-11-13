'use client';

import { useState } from 'react';
import { updateStoreSettings } from '@/actions/settings';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

export default function PengaturanClient({ initialSettings }: Props) {
  const [storeName, setStoreName] = useState(
    initialSettings['STORE_NAME'] || 'Batik Seng Surakarta'
  );
  const [storeAddress, setStoreAddress] = useState(
    initialSettings['STORE_ADDRESS'] || 'Jl. Laweyan No. 45, Solo, Jawa Tengah'
  );
  const [storePhone, setStorePhone] = useState(
    initialSettings['STORE_PHONE'] || '081234567890'
  );
  const [receiptFooter, setReceiptFooter] = useState(
    initialSettings['RECEIPT_FOOTER'] || 'Matur Nuwun sampun blonjo wonten Batik Seng.'
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const res = await updateStoreSettings({
      STORE_NAME: storeName,
      STORE_ADDRESS: storeAddress,
      STORE_PHONE: storePhone,
      RECEIPT_FOOTER: receiptFooter,
    });

    setLoading(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert(res.message);
    }
  }

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2 border-b pb-4 border-slate-100">
        <Settings className="w-5 h-5 text-[#8B2E25]" />
        <h3 className="font-bold text-slate-800 text-base">Identitas Usaha & Struk POS</h3>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan toko berhasil diperbarui!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Nama Butik / Usaha Batik</label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full p-2.5 border rounded-xl"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Alamat Workshop / Toko</label>
          <input
            type="text"
            required
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            className="w-full p-2.5 border rounded-xl"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Nomor Kontak WhatsApp Resmi
          </label>
          <input
            type="text"
            required
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            className="w-full p-2.5 border rounded-xl"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Pesan Catatan Kaki Struk Kasir (Thermal Receipt Footer)
          </label>
          <textarea
            rows={3}
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            className="w-full p-2.5 border rounded-xl font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Teks ini akan otomatis dicetak pada bagian bawah nota transaksi kasir.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#8B2E25] hover:bg-[#71221B] text-white font-bold rounded-xl shadow-md shadow-[#8B2E25]/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

