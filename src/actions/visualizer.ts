'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ApprovalStatus } from '@prisma/client';

export async function createBatikDesign(data: {
  code: string;
  title: string;
  motifName: string;
  category: string;
  baseImageUrl?: string;
  description?: string;
}) {
  try {
    const design = await prisma.batikDesign.create({
      data: {
        code: data.code,
        title: data.title,
        motifName: data.motifName,
        category: data.category,
        baseImageUrl: data.baseImageUrl,
        description: data.description,
        status: 'Aktif',
      },
    });

    revalidatePath('/visualizer');
    return { success: true, data: design };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function generateApprovalLink(data: {
  designId: string;
  customerName: string;
  customerPhone?: string;
}) {
  try {
    const approval = await prisma.publicApproval.create({
      data: {
        designId: data.designId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        status: ApprovalStatus.PENDING,
      },
    });

    revalidatePath('/visualizer');
    return { success: true, approvalId: approval.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function submitPublicApproval(data: {
  approvalId: string;
  status: 'APPROVED' | 'REVISION';
  feedback?: string;
}) {
  try {
    const approval = await prisma.publicApproval.update({
      where: { id: data.approvalId },
      data: {
        status: data.status as ApprovalStatus,
        feedback: data.feedback,
        approvedAt: new Date(),
      },
      include: { design: true },
    });

    revalidatePath(`/approval/${data.approvalId}`);
    revalidatePath('/visualizer');
    return { success: true, data: approval };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

