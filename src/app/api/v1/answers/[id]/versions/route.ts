// app/api/v1/answers/[id]/versions/route.ts
// Get version history for an answer

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';
import { getAnswerVersions } from '@/lib/version-control';
import { prisma } from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const session = await auth();

  // Verify answer exists
  const answer = await prisma.answer.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!answer) {
    throw notFound('Answer');
  }

  // Get versions
  const versions = await getAnswerVersions(id);

  return apiSuccess({
    versions: versions.map((v) => ({
      version_number: v.version_number,
      body: v.body,
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
