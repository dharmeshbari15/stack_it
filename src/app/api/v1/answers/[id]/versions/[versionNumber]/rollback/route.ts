// app/api/v1/answers/[id]/versions/[versionNumber]/rollback/route.ts
// Rollback answer to a previous version

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { apiHandler, apiSuccess, ApiError, unauthorized, forbidden, notFound } from '@/lib/api-handler';
import { rollbackAnswer } from '@/lib/version-control';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const rollbackSchema = z.object({
  reason: z.string().optional().nullable(),
});

const handler = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) => {
  const session = await auth();

  if (!session?.user?.id) {
    throw unauthorized('Authentication required');
  }

  const { id, versionNumber } = await params;
  const version = parseInt(versionNumber, 10);

  if (isNaN(version) || version < 1) {
    throw new ApiError(400, 'Invalid version number');
  }

  // Parse request body
  const body = await request.json();
  const validation = rollbackSchema.safeParse(body);

  if (!validation.success) {
    throw new ApiError(400, 'Invalid request body');
  }

  // Verify answer exists and get author
  const answer = await prisma.answer.findUnique({
    where: { id },
    select: { author_id: true, deleted_at: true },
  });

  if (!answer || answer.deleted_at) {
    throw notFound('Answer');
  }

  // Check authorization: only author or admin can rollback
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isAuthor = answer.author_id === session.user.id;
  const isAdmin = user?.role === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    throw forbidden('Only the answer author or admin can rollback');
  }

  // Perform rollback
  await rollbackAnswer(id, version, session.user.id);

  return apiSuccess({
    message: 'Answer rolled back successfully',
    version_number: version,
  });
});

export const POST = handler;
