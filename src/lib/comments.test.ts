import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommentTree, extractMentionUsernames } from './comments';

test('extractMentionUsernames returns unique, valid usernames', () => {
    const content = 'Hi @alice, looping in @bob_2 and @alice again. Ignore mail@test.com and @x';
    const mentions = extractMentionUsernames(content);

    assert.deepEqual(mentions.sort(), ['alice', 'bob_2']);
});

test('buildCommentTree builds nested structure and preserves order', () => {
    const createdAt = new Date('2026-03-07T10:00:00.000Z');

    const tree = buildCommentTree([
        {
            id: 'c3',
            body: 'second root',
            created_at: new Date('2026-03-07T10:02:00.000Z'),
            updated_at: new Date('2026-03-07T10:02:00.000Z'),
            parent_id: null,
            author: { id: 'u3', username: 'charlie' },
            mentions: [],
        },
        {
            id: 'c2',
            body: 'reply to c1',
            created_at: new Date('2026-03-07T10:01:00.000Z'),
            updated_at: new Date('2026-03-07T10:01:00.000Z'),
            parent_id: 'c1',
            author: { id: 'u2', username: 'bob' },
            mentions: [],
        },
        {
            id: 'c1',
            body: 'root',
            created_at: createdAt,
            updated_at: createdAt,
            parent_id: null,
            author: { id: 'u1', username: 'alice' },
            mentions: [],
        },
    ]);

    assert.equal(tree.length, 2);
    assert.equal(tree[0].id, 'c1');
    assert.equal(tree[1].id, 'c3');
    assert.equal(tree[0].replies.length, 1);
    assert.equal(tree[0].replies[0].id, 'c2');
});

test('buildCommentTree treats orphan comments as roots', () => {
    const tree = buildCommentTree([
        {
            id: 'orphan',
            body: 'orphan',
            created_at: new Date('2026-03-07T10:00:00.000Z'),
            updated_at: new Date('2026-03-07T10:00:00.000Z'),
            parent_id: 'missing-parent',
            author: { id: 'u1', username: 'alice' },
            mentions: [],
        },
    ]);

    assert.equal(tree.length, 1);
    assert.equal(tree[0].id, 'orphan');
    assert.equal(tree[0].replies.length, 0);
});
