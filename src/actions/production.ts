'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { WOStatus } from '@prisma/client';

export async function createWorkOrder(data: {
  productId: string;
  targetQty: number;
  deadline?: string;
  notes?: string;
  managedById?: string;
}) {
  try {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const woNumber = `WO-${todayStr}-${randomSuffix}`;

    const stages = [
      'Pola & Desain Cetak',
      'Pencantingan / Pengecapan Lilin',
      'Pewarnaan (Pencelupan)',
      'Pelorodan (Pelepasan Malam)',
      'Finishing & Quality Control',
    ];

    const wo = await prisma.workOrder.create({
      data: {
        woNumber,
        productId: data.productId,
        targetQty: data.targetQty,
        deadline: data.deadline ? new Date(data.deadline) : null,
        notes: data.notes,
        managedById: data.managedById || null,
        status: WOStatus.PLANNED,
        stages: {
          create: stages.map((stageName) => ({
            stageName,
            status: 'PENDING',
          })),
        },
      },
    });

    revalidatePath('/produksi');
    revalidatePath('/');
    return { success: true, data: wo };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateStageProgress(data: {
  stageId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  picName?: string;
  notes?: string;
}) {
  try {
    const stage = await prisma.workOrderDetail.update({
      where: { id: data.stageId },
      data: {
        status: data.status,
        picName: data.picName,
        notes: data.notes,
        completedAt: data.status === 'COMPLETED' ? new Date() : null,
      },
      include: { workOrder: true },
    });

    // Periksa apakah semua tahapan sudah selesai
    const allStages = await prisma.workOrderDetail.findMany({
      where: { workOrderId: stage.workOrderId },
    });

    const isAllCompleted = allStages.every((s) => s.status === 'COMPLETED');
    const isAnyInProgress = allStages.some((s) => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED');

    await prisma.workOrder.update({
      where: { id: stage.workOrderId },
      data: {
        status: isAllCompleted
          ? WOStatus.COMPLETED
          : isAnyInProgress
          ? WOStatus.IN_PROGRESS
          : WOStatus.PLANNED,
      },
    });

    revalidatePath('/produksi');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

