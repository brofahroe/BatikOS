import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ApprovalClient from './ApprovalClient';

export default async function PublicApprovalPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;

  const approval = await prisma.publicApproval.findUnique({
    where: { id: designId },
    include: { design: true },
  });

  if (!approval) {
    notFound();
  }

  return <ApprovalClient approval={approval} />;
}

