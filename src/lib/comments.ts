import { CommentListItem } from '@/types/api';

export type FlatCommentNode = Omit<CommentListItem, 'replies'>;

const mentionPattern = /(^|[^a-zA-Z0-9_-])@([a-zA-Z0-9_-]{3,30})\b/g;

export function extractMentionUsernames(content: string): string[] {
    const usernames = new Set<string>();

    for (const match of content.matchAll(mentionPattern)) {
        const username = match[2];
        if (username) {
            usernames.add(username);
        }
    }

    return Array.from(usernames);
}

export function buildCommentTree(comments: FlatCommentNode[]): CommentListItem[] {
    const sorted = [...comments].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const byId = new Map<string, CommentListItem>();
    const roots: CommentListItem[] = [];

    for (const comment of sorted) {
        byId.set(comment.id, {
            ...comment,
            replies: [],
        });
    }

    for (const comment of sorted) {
        const current = byId.get(comment.id);
        if (!current) continue;

        if (comment.parent_id) {
            const parent = byId.get(comment.parent_id);
            if (parent) {
                parent.replies.push(current);
                continue;
            }
        }

        roots.push(current);
    }

    return roots;
}
