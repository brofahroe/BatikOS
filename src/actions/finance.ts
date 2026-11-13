'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { CashFlowType } from '@prisma/client';

export async function createManualCashFlow(data: {
  type: 'IN' | 'OUT';
  category: string;
  amount: number;
  description?: string;
}) {
  try {
    const entry = await prisma.cashFlow.create({
      data: {
        type: data.type as CashFlowType,
        category: data.category,
        amount: data.amount,
        description: data.description,
      },
    });

    revalidatePath('/keuangan');
    return { success: true, data: entry };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

