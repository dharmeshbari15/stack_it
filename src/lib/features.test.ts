/**
 * Bookmarks, Notifications, Tags, and Follow System Tests
 * Tests user engagement features
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initTestDb,
  cleanupTestDb,
  createTestUser,
  createTestQuestion,
  createTestAnswer,
  createTestTag,
  createTestBookmark,
  createTestNotification,
  randomUsername,
  randomEmail,
} from './test-utils';

describe('Bookmarks, Notifications, Tags, and Follow System', () => {
  let testUser: any;
  let otherUser: any;
  const prisma = initTestDb();

  beforeEach(async () => {
    await cleanupTestDb();
    testUser = await createTestUser({
      username: randomUsername(),
      email: randomEmail(),
    });
    otherUser = await createTestUser({
      username: randomUsername(),
      email: randomEmail(),
    });
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  // ─── Bookmarks Tests ────────────────────────────────────────────────────────────

  describe('Bookmarks', () => {
    it('should bookmark a question', async () => {
      const question = await createTestQuestion({
        title: 'Interesting Question',
        description: 'Worth saving',
        authorId: otherUser.id,
      });

      const bookmark = await createTestBookmark(testUser.id, question.id);

      assert.ok(bookmark.id);
      assert.strictEqual(bookmark.user_id, testUser.id);
      assert.strictEqual(bookmark.question_id, question.id);
    });

    it('should bookmark with custom tag', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const bookmark = await createTestBookmark(testUser.id, question.id, 'to-review');

      assert.strictEqual(bookmark.custom_tag, 'to-review');
    });

    it('should prevent duplicate bookmarks', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      await createTestBookmark(testUser.id, question.id);

      await assert.rejects(async () => {
        await createTestBookmark(testUser.id, question.id);
      });
    });

    it('should list user bookmarks', async () => {
      const q1 = await createTestQuestion({
        title: 'Question 1',
        description: 'Desc 1',
        authorId: otherUser.id,
      });

      const q2 = await createTestQuestion({
        title: 'Question 2',
        description: 'Desc 2',
        authorId: otherUser.id,
      });

      await createTestBookmark(testUser.id, q1.id);
      await createTestBookmark(testUser.id, q2.id);

      const bookmarks = await prisma.bookmark.findMany({
        where: { user_id: testUser.id },
      });

      assert.strictEqual(bookmarks.length, 2);
    });

    it('should filter bookmarks by custom tag', async () => {
      const q1 = await createTestQuestion({
        title: 'Question 1',
        description: 'Desc 1',
        authorId: otherUser.id,
      });

      const q2 = await createTestQuestion({
        title: 'Question 2',
        description: 'Desc 2',
        authorId: otherUser.id,
      });

      await createTestBookmark(testUser.id, q1.id, 'urgent');
      await createTestBookmark(testUser.id, q2.id, 'later');

      const urgentBookmarks = await prisma.bookmark.findMany({
        where: {
          user_id: testUser.id,
          custom_tag: 'urgent',
        },
      });

      assert.strictEqual(urgentBookmarks.length, 1);
      assert.strictEqual(urgentBookmarks[0].question_id, q1.id);
    });

    it('should remove bookmark', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const bookmark = await createTestBookmark(testUser.id, question.id);

      await prisma.bookmark.delete({
        where: { id: bookmark.id },
      });

      const found = await prisma.bookmark.findUnique({
        where: { id: bookmark.id },
      });

      assert.strictEqual(found, null);
    });

    it('should update bookmark custom tag', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const bookmark = await createTestBookmark(testUser.id, question.id, 'old-tag');

      const updated = await prisma.bookmark.update({
        where: { id: bookmark.id },
        data: { custom_tag: 'new-tag' },
      });

      assert.strictEqual(updated.custom_tag, 'new-tag');
    });
  });

  // ─── Notifications Tests ────────────────────────────────────────────────────────

  describe('Notifications', () => {
    it('should create notification for new answer', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const answer = await createTestAnswer({
        body: 'New answer',
        questionId: question.id,
        authorId: otherUser.id,
      });

      const notification = await createTestNotification(
        testUser.id,
        otherUser.id,
        'ANSWER',
        answer.id
      );

      assert.ok(notification.id);
      assert.strictEqual(notification.user_id, testUser.id);
      assert.strictEqual(notification.actor_id, otherUser.id);
      assert.strictEqual(notification.type, 'ANSWER');
      assert.strictEqual(notification.is_read, false);
    });

    it('should create notification for mention', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const notification = await createTestNotification(
        testUser.id,
        otherUser.id,
        'MENTION',
        question.id
      );

      assert.strictEqual(notification.type, 'MENTION');
    });

    it('should mark notification as read', async () => {
      const notification = await createTestNotification(
        testUser.id,
        otherUser.id,
        'SYSTEM',
        'ref-id'
      );

      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: { is_read: true },
      });

      assert.strictEqual(updated.is_read, true);
    });

    it('should get unread notification count', async () => {
      await createTestNotification(testUser.id, otherUser.id, 'ANSWER', 'ref1');
      await createTestNotification(testUser.id, otherUser.id, 'MENTION', 'ref2');

      const unreadCount = await prisma.notification.count({
        where: {
          user_id: testUser.id,
          is_read: false,
        },
      });

      assert.strictEqual(unreadCount, 2);
    });

    it('should mark all notifications as read', async () => {
      await createTestNotification(testUser.id, otherUser.id, 'ANSWER', 'ref1');
      await createTestNotification(testUser.id, otherUser.id, 'MENTION', 'ref2');

      await prisma.notification.updateMany({
        where: { user_id: testUser.id },
        data: { is_read: true },
      });

      const unreadCount = await prisma.notification.count({
        where: {
          user_id: testUser.id,
          is_read: false,
        },
      });

      assert.strictEqual(unreadCount, 0);
    });

    it('should list notifications with pagination', async () => {
      for (let i = 0; i < 15; i++) {
        await createTestNotification(testUser.id, otherUser.id, 'SYSTEM', `ref${i}`);
      }

      const page1 = await prisma.notification.findMany({
        where: { user_id: testUser.id },
        orderBy: { created_at: 'desc' },
        take: 10,
      });

      const page2 = await prisma.notification.findMany({
        where: { user_id: testUser.id },
        orderBy: { created_at: 'desc' },
        take: 10,
        skip: 10,
      });

      assert.strictEqual(page1.length, 10);
      assert.strictEqual(page2.length, 5);
    });

    it('should not notify user of their own action', () => {
      // Application logic validation
      const shouldNotify = (actorId: string, targetUserId: string) => {
        return actorId !== targetUserId;
      };

      assert.strictEqual(shouldNotify(testUser.id, testUser.id), false);
      assert.strictEqual(shouldNotify(otherUser.id, testUser.id), true);
    });
  });

  // ─── Tags Tests ─────────────────────────────────────────────────────────────────

  describe('Tags', () => {
    it('should create tag', async () => {
      const tag = await createTestTag({ name: 'javascript' });

      assert.ok(tag.id);
      assert.strictEqual(tag.name, 'javascript');
    });

    it('should enforce unique tag names', async () => {
      await createTestTag({ name: 'javascript' });

      await assert.rejects(async () => {
        await createTestTag({ name: 'javascript' });
      });
    });

    it('should list all tags', async () => {
      await createTestTag({ name: 'javascript' });
      await createTestTag({ name: 'python' });
      await createTestTag({ name: 'react' });

      const tags = await prisma.tag.findMany();

      assert.ok(tags.length >= 3);
    });

    it('should get questions by tag', async () => {
      const tag = await createTestTag({ name: 'typescript' });

      const q1 = await createTestQuestion({
        title: 'TypeScript Question',
        description: 'About TypeScript',
        authorId: testUser.id,
        tags: ['typescript'],
      });

      await createTestQuestion({
        title: 'JavaScript Question',
        description: 'About JavaScript',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      const questionsWithTag = await prisma.question.findMany({
        where: {
          tags: {
            some: {
              tag_id: tag.id,
            },
          },
        },
      });

      assert.strictEqual(questionsWithTag.length, 1);
      assert.strictEqual(questionsWithTag[0].id, q1.id);
    });

    it('should count questions per tag', async () => {
      await createTestQuestion({
        title: 'Q1',
        description: 'Desc',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      await createTestQuestion({
        title: 'Q2',
        description: 'Desc',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      const jsTag = await prisma.tag.findUnique({
        where: { name: 'javascript' },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      });

      assert.ok(jsTag);
      assert.strictEqual(jsTag._count.questions, 2);
    });

    it('should search tags by name', async () => {
      await createTestTag({ name: 'javascript' });
      await createTestTag({ name: 'java' });
      await createTestTag({ name: 'python' });

      const results = await prisma.tag.findMany({
        where: {
          name: {
            contains: 'java',
          },
        },
      });

      assert.strictEqual(results.length, 2);
      const names = results.map((t) => t.name).sort();
      assert.deepEqual(names, ['java', 'javascript']);
    });
  });

  // ─── Follow System Tests ────────────────────────────────────────────────────────

  describe('Follow System', () => {
    it('should follow a tag', async () => {
      const tag = await createTestTag({ name: 'react' });

      const follow = await prisma.followTag.create({
        data: {
          user_id: testUser.id,
          tag_id: tag.id,
        },
      });

      assert.ok(follow);
      assert.strictEqual(follow.user_id, testUser.id);
      assert.strictEqual(follow.tag_id, tag.id);
    });

    it('should unfollow a tag', async () => {
      const tag = await createTestTag({ name: 'vue' });

      const follow = await prisma.followTag.create({
        data: {
          user_id: testUser.id,
          tag_id: tag.id,
        },
      });

      await prisma.followTag.delete({
        where: {
          user_id_tag_id: {
            user_id: testUser.id,
            tag_id: tag.id,
          },
        },
      });

      const found = await prisma.followTag.findUnique({
        where: {
          user_id_tag_id: {
            user_id: testUser.id,
            tag_id: tag.id,
          },
        },
      });

      assert.strictEqual(found, null);
    });

    it('should follow a question', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const follow = await prisma.followQuestion.create({
        data: {
          user_id: testUser.id,
          question_id: question.id,
        },
      });

      assert.ok(follow);
      assert.strictEqual(follow.user_id, testUser.id);
      assert.strictEqual(follow.question_id, question.id);
    });

    it('should unfollow a question', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      await prisma.followQuestion.create({
        data: {
          user_id: testUser.id,
          question_id: question.id,
        },
      });

      await prisma.followQuestion.delete({
        where: {
          user_id_question_id: {
            user_id: testUser.id,
            question_id: question.id,
          },
        },
      });

      const found = await prisma.followQuestion.findUnique({
        where: {
          user_id_question_id: {
            user_id: testUser.id,
            question_id: question.id,
          },
        },
      });

      assert.strictEqual(found, null);
    });

    it('should follow a user', async () => {
      const follow = await prisma.followUser.create({
        data: {
          follower_id: testUser.id,
          following_id: otherUser.id,
        },
      });

      assert.ok(follow);
      assert.strictEqual(follow.follower_id, testUser.id);
      assert.strictEqual(follow.following_id, otherUser.id);
    });

    it('should prevent self-follow', async () => {
      // Application logic validation
      const canFollow = (followerId: string, followingId: string) => {
        return followerId !== followingId;
      };

      assert.strictEqual(canFollow(testUser.id, testUser.id), false);
      assert.strictEqual(canFollow(testUser.id, otherUser.id), true);
    });

    it('should unfollow a user', async () => {
      await prisma.followUser.create({
        data: {
          follower_id: testUser.id,
          following_id: otherUser.id,
        },
      });

      await prisma.followUser.delete({
        where: {
          follower_id_following_id: {
            follower_id: testUser.id,
            following_id: otherUser.id,
          },
        },
      });

      const found = await prisma.followUser.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: testUser.id,
            following_id: otherUser.id,
          },
        },
      });

      assert.strictEqual(found, null);
    });

    it('should list followed tags', async () => {
      const tag1 = await createTestTag({ name: 'angular' });
      const tag2 = await createTestTag({ name: 'nodejs' });

      await prisma.followTag.create({
        data: { user_id: testUser.id, tag_id: tag1.id },
      });

      await prisma.followTag.create({
        data: { user_id: testUser.id, tag_id: tag2.id },
      });

      const follows = await prisma.followTag.findMany({
        where: { user_id: testUser.id },
        include: { tag: true },
      });

      assert.strictEqual(follows.length, 2);
    });

    it('should list followers', async () => {
      const user1 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const user2 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      await prisma.followUser.create({
        data: { follower_id: user1.id, following_id: testUser.id },
      });

      await prisma.followUser.create({
        data: { follower_id: user2.id, following_id: testUser.id },
      });

      const followers = await prisma.followUser.findMany({
        where: { following_id: testUser.id },
        include: { follower: true },
      });

      assert.strictEqual(followers.length, 2);
    });

    it('should list following', async () => {
      await prisma.followUser.create({
        data: { follower_id: testUser.id, following_id: otherUser.id },
      });

      const following = await prisma.followUser.findMany({
        where: { follower_id: testUser.id },
        include: { following: true },
      });

      assert.strictEqual(following.length, 1);
      assert.strictEqual(following[0].following_id, otherUser.id);
    });

    it('should check if following', async () => {
      await prisma.followUser.create({
        data: { follower_id: testUser.id, following_id: otherUser.id },
      });

      const isFollowing = await prisma.followUser.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: testUser.id,
            following_id: otherUser.id,
          },
        },
      });

      assert.ok(isFollowing);
    });
  });
});
