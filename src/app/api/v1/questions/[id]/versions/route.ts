// app/api/v1/questions/[id]/versions/route.ts
// Get version history for a question

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';
import { getQuestionVersions } from '@/lib/version-control';
import { prisma } from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await auth();

  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!question) {
    throw notFound('Question');
  }

  // Get versions
  const versions = await getQuestionVersions(id);

  return apiSuccess({
    versions: versions.map((v) => ({
      version_number: v.version_number,
      title: v.title,
      description: v.description,
      tags: v.tags,
      edited_by: {
        id: v.edited_by.id,
        username: v.edited_by.username,
      },
      edited_at: v.edited_at.toISOString(),
      edit_reason: v.edit_reason,
    })),
    total: versions.length,
  });
});
