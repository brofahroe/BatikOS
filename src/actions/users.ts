'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

export async function createUser(data: {
  username: string;
  fullName: string;
  password: string;
  role: Role;
}) {
  try {
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      return { success: false, message: 'Username sudah digunakan.' };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        fullName: data.fullName,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    revalidatePath('/pengguna');
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/pengguna');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

