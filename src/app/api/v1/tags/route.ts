// app/api/v1/tags/route.ts
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess } from '@/lib/api-handler';
import { z } from 'zod';

const getTagsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const { limit } = getTagsQuerySchema.parse({
        limit: searchParams.get('limit') ?? undefined,
    });

    const tags = await prisma.tag.findMany({
        take: limit,
        include: {
            _count: {
                select: { questions: true }
            }
        },
        orderBy: {
            questions: {
                _count: 'desc'
            }
        }
    });

    const formattedTags = tags.map(t => ({
        id: t.id,
        name: t.name,
        questionCount: t._count.questions
    }));

    return apiSuccess({ tags: formattedTags });
});
