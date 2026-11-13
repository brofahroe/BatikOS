'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { MutationType } from '@prisma/client';

export async function createRawMaterial(data: {
  code: string;
  name: string;
  category: string;
  buyUnit: string;
  useUnit: string;
  conversionRatio: number;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
  currentStock: number;
  supplierId?: string;
}) {
  try {
    const item = await prisma.rawMaterial.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        buyUnit: data.buyUnit,
        useUnit: data.useUnit,
        conversionRatio: data.conversionRatio || 1,
        buyPrice: data.buyPrice || 0,
        sellPrice: data.sellPrice || 0,
        minStock: data.minStock || 0,
        currentStock: data.currentStock || 0,
        supplierId: data.supplierId || null,
      },
    });

    if (data.currentStock > 0) {
      await prisma.materialMutation.create({
        data: {
          rawMaterialId: item.id,
          changeQty: data.currentStock,
          type: MutationType.IN,
          note: 'Saldo awal bahan baku',
        },
      });
    }

    revalidatePath('/inventaris');
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createProduct(data: {
  code: string;
  name: string;
  category: string;
  motif?: string;
  color?: string;
  size?: string;
  hpp: number;
  sellPrice: number;
  stock: number;
  photoUrl?: string;
}) {
  try {
    const product = await prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        motif: data.motif,
        color: data.color,
        size: data.size,
        hpp: data.hpp || 0,
        sellPrice: data.sellPrice || 0,
        stock: data.stock || 0,
        photoUrl: data.photoUrl,
      },
    });

    revalidatePath('/inventaris');
    revalidatePath('/penjualan');
    return { success: true, data: product };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function addStockMutation(data: {
  rawMaterialId: string;
  changeQty: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  note?: string;
}) {
  try {
    const rawMaterial = await prisma.rawMaterial.findUnique({
      where: { id: data.rawMaterialId },
    });
    if (!rawMaterial) throw new Error('Bahan baku tidak ditemukan');

    const delta = data.type === 'IN' ? data.changeQty : -data.changeQty;
    const newStock = rawMaterial.currentStock + delta;

    await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id: data.rawMaterialId },
        data: { currentStock: newStock },
      }),
      prisma.materialMutation.create({
        data: {
          rawMaterialId: data.rawMaterialId,
          changeQty: data.changeQty,
          type: data.type as MutationType,
          note: data.note || 'Mutasi manual',
        },
      }),
    ]);

    revalidatePath('/inventaris');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

