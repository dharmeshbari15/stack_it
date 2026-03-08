// app/api/v1/versions/diff/route.ts
// GET: Calculate diff between two versions (question or answer)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, notFound } from '@/lib/api-handler';
import { getQuestionVersion, getAnswerVersion } from '@/lib/version-control';
import { calculateDiff, getChangeSummary } from '@/lib/diff-util';
import * as z from 'zod';

const diffSchema = z.object({
  type: z.enum(['question', 'answer']),
  entity_id: z.string().uuid(),
  from_version: z.number().int().min(1),
  to_version: z.number().int().min(1),
});

export const GET = apiHandler(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;

  const type = searchParams.get('type');
  const entityId = searchParams.get('entity_id');
  const fromVersion = searchParams.get('from_version');
  const toVersion = searchParams.get('to_version');

  if (!type || !entityId || !fromVersion || !toVersion) {
    throw badRequest('Missing required parameters: type, entity_id, from_version, to_version');
  }

  try {
    diffSchema.parse({
      type,
      entity_id: entityId,
      from_version: parseInt(fromVersion),
      to_version: parseInt(toVersion),
    });
  } catch (error) {
    throw badRequest('Invalid parameters');
  }

  const fromVer = parseInt(fromVersion);
  const toVer = parseInt(toVersion);

  try {
    if (type === 'question') {
      const fromVersionData = await getQuestionVersion(entityId, fromVer);
      const toVersionData = await getQuestionVersion(entityId, toVer);

      if (!fromVersionData || !toVersionData) {
        throw notFound('Version not found');
      }

      const titleDiff = calculateDiff(fromVersionData.title, toVersionData.title);
      const descriptionDiff = calculateDiff(
        fromVersionData.description,
        toVersionData.description
      );

      const titleSummary = getChangeSummary(
        fromVersionData.title,
        toVersionData.title
      );
      const descriptionSummary = getChangeSummary(
        fromVersionData.description,
        toVersionData.description
      );

      return apiSuccess({
        type: 'question',
        from_version: fromVersionData.version_number,
        to_version: toVersionData.version_number,
        from_date: fromVersionData.edited_at,
        to_date: toVersionData.edited_at,
        edited_by: toVersionData.edited_by,
        edit_reason: toVersionData.edit_reason,
        title: {
          diff: titleDiff,
          summary: titleSummary,
        },
        description: {
          diff: descriptionDiff,
          summary: descriptionSummary,
        },
        tags: {
          from: fromVersionData.tags,
          to: toVersionData.tags,
        },
      });
    } else if (type === 'answer') {
      const fromVersionData = await getAnswerVersion(entityId, fromVer);
      const toVersionData = await getAnswerVersion(entityId, toVer);

      if (!fromVersionData || !toVersionData) {
        throw notFound('Version not found');
      }

      const bodyDiff = calculateDiff(fromVersionData.body, toVersionData.body);
      const bodySummary = getChangeSummary(fromVersionData.body, toVersionData.body);

      return apiSuccess({
        type: 'answer',
        from_version: fromVersionData.version_number,
        to_version: toVersionData.version_number,
        from_date: fromVersionData.edited_at,
        to_date: toVersionData.edited_at,
        edited_by: toVersionData.edited_by,
        edit_reason: toVersionData.edit_reason,
        body: {
          diff: bodyDiff,
          summary: bodySummary,
        },
      });
    }

    throw badRequest('Invalid type');
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw notFound('Version not found');
    }
    throw error;
  }
});
