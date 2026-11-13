'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateStoreSettings(settings: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    revalidatePath('/pengaturan');
    revalidatePath('/penjualan');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

