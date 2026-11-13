'use client';

import { useState } from 'react';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { processPosCheckout, CartItem } from '@/actions/pos';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  History,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  User,
  X,
} from 'lucide-react';

interface Props {
  products: any[];
  customers: any[];
  recentOrders: any[];
  currentUser?: any;
}

export default function PosClient({
  products,
  customers,
  recentOrders,
  currentUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal Struk Thermal
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Hitung Nilai Belanja
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const netTotal = Math.max(0, subtotal - discount);
  const change = Math.max(0, paidAmount - netTotal);

  function addToCart(p: any) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id);
      if (existing) {
        if (existing.qty >= p.stock) {
          alert('Jumlah melebihi stok yang tersedia.');
          return prev;
        }
        return prev.map((item) =>
          item.id === p.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: p.id,
          code: p.code,
          name: p.name,
          price: p.sellPrice,
          qty: 1,
        },
      ];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong.');
      return;
    }
    if (paymentMethod === 'CASH' && paidAmount < netTotal) {
      alert('Nominal uang diterima kurang dari total pembayaran.');
      return;
    }

    setLoading(true);
    const finalPaid = paymentMethod === 'CASH' ? paidAmount : netTotal;

    const res = await processPosCheckout({
      customerId: selectedCustomerId || undefined,
      handledById: currentUser?.id,
      items: cart,
      discount,
      tax: 0,
      paidAmount: finalPaid,
      paymentMethod,
      notes,
    });

    setLoading(false);

    if (res.success && res.data) {
      setReceiptData({
        order: res.data,
        invoiceNumber: res.invoiceNumber,
        items: [...cart],
        subtotal,
        discount,
        netTotal,
        paidAmount: finalPaid,
        change: finalPaid - netTotal,
        customerName:
          customers.find((c) => c.id === selectedCustomerId)?.name || 'Pelanggan Umum',
        date: new Date(),
      });
      setCart([]);
      setPaidAmount(0);
      setDiscount(0);
      setNotes('');
    } else {
      alert(res.message);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.motif && p.motif.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200/80 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'pos'
              ? 'bg-[#8B2E25] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Kasir POS</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-[#8B2E25] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Penjualan ({recentOrders.length})</span>
        </button>
      </div>

      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Product Catalog Grid */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari motif batik, kemeja, sarung, kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-[#8B2E25] hover:shadow-md transition-all cursor-pointer flex flex-col group"
                >
                  <div className="h-32 bg-slate-100 relative overflow-hidden">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-serif text-2xl font-bold bg-amber-50/50">
                        BS
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-sm">
                      Stok: {p.stock}
                    </span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        {p.code}
                      </p>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#8B2E25]">
                        {p.name}
                      </h4>
                      {p.motif && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Motif: {p.motif}</p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#8B2E25]">
                        {formatRupiah(p.sellPrice)}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-[#8B2E25] group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Checkout & Cart Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#8B2E25]" />
                <span>Keranjang Transaksi</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {cart.reduce((a, b) => a + b.qty, 0)} Item
              </span>
            </div>

            {/* Customer Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Pelanggan
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Pelanggan Umum (Tanpa Data)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.agency ? `(${c.agency})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Klik produk di sebelah kiri untuk menambahkan ke keranjang.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatRupiah(item.price)} &times; {item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Payment */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Diskon / Potongan</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 p-1 text-right border rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t">
                <span>Total Bayar</span>
                <span className="text-base text-[#8B2E25] font-extrabold">{formatRupiah(netTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CASH');
                    setPaidAmount(netTotal);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-[#8B2E25] bg-red-50/50 text-[#8B2E25]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('TRANSFER');
                    setPaidAmount(netTotal);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-[#8B2E25] bg-red-50/50 text-[#8B2E25]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('QRIS');
                    setPaidAmount(netTotal);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'border-[#8B2E25] bg-red-50/50 text-[#8B2E25]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>
              </div>
            </div>

            {/* Cash Paid & Change Input */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 pt-1 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min={netTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full p-2 border rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-[#8B2E25]"
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-semibold p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
                  <span>Kembalian:</span>
                  <span className="text-sm font-extrabold">{formatRupiah(change)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3 px-4 bg-[#8B2E25] hover:bg-[#71221B] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#8B2E25]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Memproses Transaksi...' : 'Bayar & Selesai'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sales History View */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">No. Order & Tanggal</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4">Item Terjual</th>
                  <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 font-mono">{order.soNumber}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(order.date)}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {order.customer?.name || 'Pelanggan Umum'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {order.details.map((d: any) => `${d.product.name} (${d.quantity})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#8B2E25]">
                      {formatRupiah(order.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal (58mm/80mm compatible) */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-900">Nota Pembayaran Berhasil</h4>
              <button
                onClick={() => setReceiptData(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div
              id="printable-receipt"
              className="p-4 bg-slate-50 border rounded-xl font-mono text-[11px] space-y-2 text-slate-800 leading-tight"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <p className="font-bold text-sm">BATIK SENG</p>
                <p className="text-[10px]">Jl. Laweyan No. 45, Solo</p>
                <p className="text-[10px]">WA: 0812-3456-7890</p>
              </div>

              <div className="text-[10px] space-y-0.5 py-1">
                <div className="flex justify-between">
                  <span>No: {receiptData.order.soNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tgl: {formatDateTime(receiptData.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plg: {receiptData.customerName}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-1.5 space-y-1">
                {receiptData.items.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {i.name} x{i.qty}
                    </span>
                    <span>{formatRupiah(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(receiptData.subtotal)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{formatRupiah(receiptData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t">
                  <span>TOTAL</span>
                  <span>{formatRupiah(receiptData.netTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({receiptData.order.paymentMethod})</span>
                  <span>{formatRupiah(receiptData.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>{formatRupiah(receiptData.change)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px]">
                <p>Matur Nuwun sampun blonjo</p>
                <p>wonten Batik Seng</p>
              </div>
            </div>

            {/* Print and Close Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#8B2E25] hover:bg-[#71221B] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Thermal</span>
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2.5 border rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

