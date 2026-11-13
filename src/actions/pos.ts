'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CashFlowType, PaymentMethod, SOStatus } from '@prisma/client';

export interface CartItem {
  id: string;
  code: string;
  name: string;
  price: number;
  qty: number;
}

export async function processPosCheckout(payload: {
  customerId?: string;
  handledById?: string;
  items: CartItem[];
  discount: number;
  tax: number;
  paidAmount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS';
  notes?: string;
}) {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, message: 'Keranjang belanja kosong.' };
    }

    const subtotal = payload.items.reduce((acc, item) => acc + item.price * item.qty, 0);
    const netAmount = subtotal - payload.discount + payload.tax;
    const changeAmount = payload.paidAmount >= netAmount ? payload.paidAmount - netAmount : 0;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const soNumber = `SO-${todayStr}-${randomSuffix}`;
    const invNumber = `INV-${todayStr}-${randomSuffix}`;

    // Eksekusi transaksi atomik ACID
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat SalesOrder
      const salesOrder = await tx.salesOrder.create({
        data: {
          soNumber,
          customerId: payload.customerId || null,
          handledById: payload.handledById || null,
          totalAmount: subtotal,
          discount: payload.discount || 0,
          tax: payload.tax || 0,
          netAmount,
          paidAmount: payload.paidAmount,
          changeAmount,
          paymentMethod: payload.paymentMethod as PaymentMethod,
          status: SOStatus.COMPLETED,
          notes: payload.notes || null,
          details: {
            create: payload.items.map((item) => ({
              productId: item.id,
              quantity: item.qty,
              price: item.price,
              subtotal: item.price * item.qty,
            })),
          },
        },
        include: {
          details: {
            include: { product: true },
          },
          customer: true,
        },
      });

      // 2. Potong stok produk jadi
      for (const item of payload.items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: { decrement: item.qty },
          },
        });
      }

      // 3. Buat Tagihan / Invoice Lunas
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: invNumber,
          salesOrderId: salesOrder.id,
          total: netAmount,
          status: 'LUNAS',
          payments: {
            create: {
              method: payload.paymentMethod,
              amount: netAmount,
            },
          },
        },
      });

      // 4. Catat otomatis ke Arus Kas Masuk
      await tx.cashFlow.create({
        data: {
          type: CashFlowType.IN,
          category: 'Penjualan POS Batik',
          amount: netAmount,
          salesOrderId: salesOrder.id,
          description: `Penjualan ${soNumber} (${payload.paymentMethod})`,
        },
      });

      // 5. Update akumulasi belanja pelanggan jika terdaftar
      if (payload.customerId) {
        await tx.customer.update({
          where: { id: payload.customerId },
          data: {
            totalSpend: { increment: netAmount },
            lastOrderDate: new Date(),
          },
        });
      }

      return { salesOrder, invoice };
    });

    revalidatePath('/penjualan');
    revalidatePath('/inventaris');
    revalidatePath('/keuangan');
    revalidatePath('/');

    return {
      success: true,
      data: result.salesOrder,
      invoiceNumber: result.invoice.invoiceNumber,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

