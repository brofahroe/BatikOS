'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCustomer(data: {
  name: string;
  agency?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  address?: string;
  category?: string;
}) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        agency: data.agency,
        whatsapp: data.whatsapp,
        email: data.email,
        city: data.city,
        address: data.address,
        category: data.category || 'Reguler',
      },
    });

    revalidatePath('/pelanggan');
    revalidatePath('/penjualan');
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

