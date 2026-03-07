// app/api/v1/questions/[id]/versions/[versionNumber]/route.ts
// Get a specific version with diff to previous version

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, ApiError, notFound } from '@/lib/api-handler';
import { getVersionDiff, getQuestionVersion } from '@/lib/version-control';
import { prisma } from '@/lib/prisma';

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) => {
  const { id, versionNumber } = await params;
  const version = parseInt(versionNumber, 10);

  if (isNaN(version) || version < 1) {
    throw new ApiError(400, 'Invalid version number');
  }

  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!question) {
    throw notFound('Question');
  }

  // Get the specific version
  const targetVersion = await getQuestionVersion(id, version);

  if (!targetVersion) {
    throw notFound('Version not found');
  }

  // Get previous version for diff
  const previousVersion = version > 1 ? await getQuestionVersion(id, version - 1) : null;

  return apiSuccess({
    version: {
      version_number: targetVersion.version_number,
      title: targetVersion.title,
      description: targetVersion.description,
      tags: targetVersion.tags,
      edited_by: {
        id: targetVersion.edited_by.id,
        username: targetVersion.edited_by.username,
      },
      edited_at: targetVersion.edited_at.toISOString(),
      edit_reason: targetVersion.edit_reason,
    },
    previous_version: previousVersion
      ? {
          version_number: previousVersion.version_number,
          edited_at: previousVersion.edited_at.toISOString(),
          edited_by: {
            id: previousVersion.edited_by.id,
            username: previousVersion.edited_by.username,
          },
        }
      : null,
  });
});
