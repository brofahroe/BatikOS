'use client';

import { useState } from 'react';
import { formatRupiah } from '@/lib/utils';
import { createRawMaterial, createProduct, addStockMutation } from '@/actions/inventory';
import {
  Boxes,
  Package,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Search,
  CheckCircle,
} from 'lucide-react';

interface Props {
  initialMaterials: any[];
  initialProducts: any[];
  suppliers: any[];
}

export default function InventarisClient({
  initialMaterials,
  initialProducts,
  suppliers,
}: Props) {
  const [tab, setTab] = useState<'materials' | 'products'>('materials');
  const [search, setSearch] = useState('');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMutation, setShowMutation] = useState<any | null>(null);

  // Form States
  const [matForm, setMatForm] = useState({
    code: '',
    name: '',
    category: 'Kain Putih',
    buyUnit: 'Gulung',
    useUnit: 'Meter',
    conversionRatio: 50,
    buyPrice: 0,
    sellPrice: 0,
    minStock: 10,
    currentStock: 0,
    supplierId: '',
  });

  const [prodForm, setProdForm] = useState({
    code: '',
    name: '',
    category: 'Pakaian Pria',
    motif: '',
    color: '',
    size: 'L',
    hpp: 0,
    sellPrice: 0,
    stock: 0,
    photoUrl: '',
  });

  const [mutForm, setMutForm] = useState({
    changeQty: 1,
    type: 'IN' as 'IN' | 'OUT',
    note: '',
  });

  const [loading, setLoading] = useState(false);

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createRawMaterial({
      ...matForm,
      conversionRatio: Number(matForm.conversionRatio),
      buyPrice: Number(matForm.buyPrice),
      sellPrice: Number(matForm.sellPrice),
      minStock: Number(matForm.minStock),
      currentStock: Number(matForm.currentStock),
    });
    setLoading(false);
    if (res.success) {
      setShowAddMaterial(false);
      window.location.reload();
    } else {
      alert(res.message);
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createProduct({
      ...prodForm,
      hpp: Number(prodForm.hpp),
      sellPrice: Number(prodForm.sellPrice),
      stock: Number(prodForm.stock),
    });
    setLoading(false);
    if (res.success) {
      setShowAddProduct(false);
      window.location.reload();
    } else {
      alert(res.message);
    }
  }

  async function handleMutation(e: React.FormEvent) {
    e.preventDefault();
    if (!showMutation) return;
    setLoading(true);
    const res = await addStockMutation({
      rawMaterialId: showMutation.id,
      changeQty: Number(mutForm.changeQty),
      type: mutForm.type,
      note: mutForm.note,
    });
    setLoading(false);
    if (res.success) {
      setShowMutation(null);
      window.location.reload();
    } else {
      alert(res.message);
    }
  }

  const filteredMaterials = initialMaterials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = initialProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.motif && p.motif.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Filter and Tab Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setTab('materials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'materials'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-[#8B2E25]" />
            <span>Bahan Baku ({initialMaterials.length})</span>
          </button>
          <button
            onClick={() => setTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'products'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-[#8B2E25]" />
            <span>Produk Jadi ({initialProducts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama, motif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B2E25] focus:bg-white"
            />
          </div>
          {tab === 'materials' ? (
            <button
              onClick={() => setShowAddMaterial(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddProduct(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B2E25] hover:bg-[#71221B] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* Materials Table View */}
      {tab === 'materials' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Kode & Nama</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Pemasok</th>
                  <th className="py-3.5 px-4 text-right">Sisa Stok</th>
                  <th className="py-3.5 px-4 text-right">Harga Beli</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((mat) => {
                  const isLow = mat.currentStock <= mat.minStock;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{mat.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{mat.code}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{mat.category}</td>
                      <td className="py-3.5 px-4 text-slate-600">{mat.supplier?.name || '-'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                          {mat.currentStock} {mat.useUnit}
                        </span>
                        <p className="text-[10px] text-slate-400">Min: {mat.minStock}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatRupiah(mat.buyPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            Kritis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3" />
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setShowMutation(mat);
                            setMutForm({ changeQty: 1, type: 'IN', note: '' });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-all"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          <span>Mutasi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products Table View */}
      {tab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Produk & Motif</th>
                  <th className="py-3.5 px-4">Kategori & Ukuran</th>
                  <th className="py-3.5 px-4 text-right">Stok Jadi</th>
                  <th className="py-3.5 px-4 text-right">HPP</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-right">Margin Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const margin = prod.sellPrice - prod.hpp;
                  const marginPercent =
                    prod.sellPrice > 0 ? Math.round((margin / prod.sellPrice) * 100) : 0;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{prod.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {prod.code} {prod.motif ? `• Motif: ${prod.motif}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {prod.category} {prod.size ? `(${prod.size})` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        {prod.stock} Pcs
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                        {formatRupiah(prod.hpp)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">
                        {formatRupiah(prod.sellPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-700">{formatRupiah(margin)}</span>
                        <span className="ml-1 text-[10px] text-emerald-600 font-medium">
                          ({marginPercent}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Raw Material */}
      {showAddMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Bahan Baku Baru</h3>
            <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Bahan</label>
                  <input
                    type="text"
                    required
                    placeholder="BHN-004"
                    value={matForm.code}
                    onChange={(e) => setMatForm({ ...matForm, code: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#8B2E25]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Bahan</label>
                  <input
                    type="text"
                    required
                    placeholder="Kain Mori Sutra"
                    value={matForm.name}
                    onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#8B2E25]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={matForm.category}
                    onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="Kain Putih">Kain Putih</option>
                    <option value="Malam">Malam / Lilin</option>
                    <option value="Pewarna Kimia">Pewarna Kimia</option>
                    <option value="Pewarna Alami">Pewarna Alami</option>
                    <option value="Aksesoris">Aksesoris / Kancing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pemasok</label>
                  <select
                    value={matForm.supplierId}
                    onChange={(e) => setMatForm({ ...matForm, supplierId: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Pilih Pemasok...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Beli</label>
                  <input
                    type="text"
                    value={matForm.buyUnit}
                    onChange={(e) => setMatForm({ ...matForm, buyUnit: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Pakai</label>
                  <input
                    type="text"
                    value={matForm.useUnit}
                    onChange={(e) => setMatForm({ ...matForm, useUnit: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli</label>
                  <input
                    type="number"
                    value={matForm.buyPrice}
                    onChange={(e) => setMatForm({ ...matForm, buyPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={matForm.currentStock}
                    onChange={(e) => setMatForm({ ...matForm, currentStock: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stok</label>
                  <input
                    type="number"
                    value={matForm.minStock}
                    onChange={(e) => setMatForm({ ...matForm, minStock: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMaterial(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#8B2E25] text-white rounded-xl font-semibold hover:bg-[#71221B]"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Product */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Produk Batik Baru</h3>
            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="PRD-004"
                    value={prodForm.code}
                    onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Kemeja Batik Sekar Jagad"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Motif</label>
                  <input
                    type="text"
                    placeholder="Sekar Jagad"
                    value={prodForm.motif}
                    onChange={(e) => setProdForm({ ...prodForm, motif: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ukuran</label>
                  <input
                    type="text"
                    placeholder="XL"
                    value={prodForm.size}
                    onChange={(e) => setProdForm({ ...prodForm, size: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HPP (Modal)</label>
                  <input
                    type="number"
                    value={prodForm.hpp}
                    onChange={(e) => setProdForm({ ...prodForm, hpp: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    value={prodForm.sellPrice}
                    onChange={(e) => setProdForm({ ...prodForm, sellPrice: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#8B2E25] text-white rounded-xl font-semibold hover:bg-[#71221B]"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stock Mutation */}
      {showMutation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Mutasi Stok: {showMutation.name}
            </h3>
            <p className="text-xs text-slate-500">
              Stok saat ini: <strong className="text-slate-800">{showMutation.currentStock} {showMutation.useUnit}</strong>
            </p>
            <form onSubmit={handleMutation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipe Mutasi</label>
                <select
                  value={mutForm.type}
                  onChange={(e) => setMutForm({ ...mutForm, type: e.target.value as any })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="IN">Stok Masuk (Barang Masuk / Pembelian)</option>
                  <option value="OUT">Stok Keluar (Pemakaian / Rusak)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah ({showMutation.useUnit})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={mutForm.changeQty}
                  onChange={(e) => setMutForm({ ...mutForm, changeQty: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="e.g. Pembelian tambahan di Klewer"
                  value={mutForm.note}
                  onChange={(e) => setMutForm({ ...mutForm, note: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMutation(null)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#8B2E25] text-white rounded-xl font-semibold hover:bg-[#71221B]"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

