// lib/version-control.ts
// Service for managing edit history and version control

import { prisma } from './prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuestVersionWithEditor {
  id: string;
  question_id: string;
  version_number: number;
  title: string;
  description: string;
  tags: string[];
  edited_at: Date;
  edit_reason: string | null;
  edited_by: {
    id: string;
    username: string;
  };
}

export interface AnswerVersionWithEditor {
  id: string;
  answer_id: string;
  version_number: number;
  body: string;
  edited_at: Date;
  edit_reason: string | null;
  edited_by: {
    id: string;
    username: string;
  };
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
}

// ─── Question Versions ──────────────────────────────────────────────────────

/**
 * Create a new version when question is edited
 */
export async function createQuestionVersion(
  questionId: string,
  title: string,
  description: string,
  tags: string[],
  editedByUserId: string,
  editReason?: string
): Promise<void> {
  // Get next version number
  const lastVersion = await prisma.questionVersion.findFirst({
    where: { question_id: questionId },
    orderBy: { version_number: 'desc' },
    select: { version_number: true },
  });

  const nextVersionNumber = (lastVersion?.version_number ?? 0) + 1;

  await prisma.questionVersion.create({
    data: {
      question_id: questionId,
      version_number: nextVersionNumber,
      title,
      description,
      tags,
      edited_by_id: editedByUserId,
      edit_reason: editReason || null,
    },
  });
}

/**
 * Get all versions of a question (sorted newest first)
 */
export async function getQuestionVersions(
  questionId: string
): Promise<QuestVersionWithEditor[]> {
  const versions = await prisma.questionVersion.findMany({
    where: { question_id: questionId },
    include: {
      edited_by: {
        select: { id: true, username: true },
      },
    },
    orderBy: { version_number: 'desc' },
  });

  return versions;
}

/**
 * Get a specific version of a question
 */
export async function getQuestionVersion(
  questionId: string,
  versionNumber: number
): Promise<QuestVersionWithEditor | null> {
  const version = await prisma.questionVersion.findUnique({
    where: {
      question_id_version_number: {
        question_id: questionId,
        version_number: versionNumber,
      },
    },
    include: {
      edited_by: {
        select: { id: true, username: true },
      },
    },
  });

  return version;
}

/**
 * Rollback a question to a previous version
 */
export async function rollbackQuestion(
  questionId: string,
  versionNumber: number,
  rolledBackByUserId: string
): Promise<void> {
  // Verify the question exists and user has permission
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { author_id: true, deleted_at: true },
  });

  if (!question || question.deleted_at) {
    throw new Error('Question not found');
  }

  if (question.author_id !== rolledBackByUserId) {
    throw new Error('Only the question author can rollback');
  }

  // Get the version to rollback to
  const targetVersion = await getQuestionVersion(questionId, versionNumber);

  if (!targetVersion) {
    throw new Error('Version not found');
  }

  // Create a new version with the old content
  await createQuestionVersion(
    questionId,
    targetVersion.title,
    targetVersion.description,
    targetVersion.tags,
    rolledBackByUserId,
    `Rolled back to version ${versionNumber}`
  );

  // Update the question with old content
  await prisma.question.update({
    where: { id: questionId },
    data: {
      title: targetVersion.title,
      description: targetVersion.description,
      tags: {
        deleteMany: {}, // Remove all tags first
      },
    },
  });

  // Re-add tags
  for (const tagName of targetVersion.tags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });

    await prisma.questionTag.create({
      data: {
        question_id: questionId,
        tag_id: tag.id,
      },
    });
  }
}

// ─── Answer Versions ──────────────────────────────────────────────────────

/**
 * Create a new version when answer is edited
 */
export async function createAnswerVersion(
  answerId: string,
  body: string,
  editedByUserId: string,
  editReason?: string
): Promise<void> {
  // Get next version number
  const lastVersion = await prisma.answerVersion.findFirst({
    where: { answer_id: answerId },
    orderBy: { version_number: 'desc' },
    select: { version_number: true },
  });

  const nextVersionNumber = (lastVersion?.version_number ?? 0) + 1;

  await prisma.answerVersion.create({
    data: {
      answer_id: answerId,
      version_number: nextVersionNumber,
      body,
      edited_by_id: editedByUserId,
      edit_reason: editReason || null,
    },
  });
}

/**
 * Get all versions of an answer (sorted newest first)
 */
export async function getAnswerVersions(answerId: string): Promise<AnswerVersionWithEditor[]> {
  const versions = await prisma.answerVersion.findMany({
    where: { answer_id: answerId },
    include: {
      edited_by: {
        select: { id: true, username: true },
      },
    },
    orderBy: { version_number: 'desc' },
  });

  return versions;
}

/**
 * Get a specific version of an answer
 */
export async function getAnswerVersion(
  answerId: string,
  versionNumber: number
): Promise<AnswerVersionWithEditor | null> {
  const version = await prisma.answerVersion.findUnique({
    where: {
      answer_id_version_number: {
        answer_id: answerId,
        version_number: versionNumber,
      },
    },
    include: {
      edited_by: {
        select: { id: true, username: true },
      },
    },
  });

  return version;
}

/**
 * Rollback an answer to a previous version
 */
export async function rollbackAnswer(
  answerId: string,
  versionNumber: number,
  rolledBackByUserId: string
): Promise<void> {
  // Verify the answer exists and user has permission
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { author_id: true, deleted_at: true },
  });

  if (!answer || answer.deleted_at) {
    throw new Error('Answer not found');
  }

  if (answer.author_id !== rolledBackByUserId) {
    throw new Error('Only the answer author can rollback');
  }

  // Get the version to rollback to
  const targetVersion = await getAnswerVersion(answerId, versionNumber);

  if (!targetVersion) {
    throw new Error('Version not found');
  }

  // Create a new version with the old content
  await createAnswerVersion(
    answerId,
    targetVersion.body,
    rolledBackByUserId,
    `Rolled back to version ${versionNumber}`
  );

  // Update the answer with old content
  await prisma.answer.update({
    where: { id: answerId },
    data: { body: targetVersion.body },
  });
}

// ─── Diff Generation ───────────────────────────────────────────────────────

/**
 * Simple line-by-line diff algorithm (Myers-inspired)
 * Returns a unified diff-like structure
 */
export function generateDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diff: DiffLine[] = [];

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Remaining new lines
      diff.push({ type: 'add', content: newLines[j], lineNumber: j + 1 });
      j++;
    } else if (j >= newLines.length) {
      // Remaining old lines
      diff.push({ type: 'remove', content: oldLines[i], lineNumber: i + 1 });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      // Lines match
      diff.push({ type: 'context', content: oldLines[i], lineNumber: i + 1 });
      i++;
      j++;
    } else {
      // Lines differ - find best match
      let foundMatch = false;

      // Look ahead in new lines
      for (let k = j + 1; k < Math.min(j + 5, newLines.length); k++) {
        if (oldLines[i] === newLines[k]) {
          // Found old line later in new text, mark intervening as additions
          for (let m = j; m < k; m++) {
            diff.push({ type: 'add', content: newLines[m], lineNumber: m + 1 });
          }
          j = k;
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // Treat as modification (remove + add)
        diff.push({ type: 'remove', content: oldLines[i], lineNumber: i + 1 });
        i++;
      }
    }
  }

  return diff;
}

/**
 * Get formatted diff between two versions
 */
export async function getVersionDiff(
  questionId: string,
  fromVersion: number,
  toVersion: number
): Promise<{
  from: QuestVersionWithEditor | null;
  to: QuestVersionWithEditor | null;
  titleDiff: DiffLine[];
  descriptionDiff: DiffLine[];
}> {
  const [fromVer, toVer] = await Promise.all([
    fromVersion > 0 ? getQuestionVersion(questionId, fromVersion) : null,
    getQuestionVersion(questionId, toVersion),
  ]);

  return {
    from: fromVer,
    to: toVer,
    titleDiff: fromVer ? generateDiff(fromVer.title, toVer?.title || '') : [],
    descriptionDiff: fromVer
      ? generateDiff(fromVer.description, toVer?.description || '')
      : [],
  };
}

/**
 * Format diff for display
 */
export function formatDiffForDisplay(diff: DiffLine[]): string {
  return diff
    .map((line) => {
      const prefix =
        line.type === 'add'
          ? '+ '
          : line.type === 'remove'
          ? '- '
          : '  ';
      return prefix + line.content;
    })
    .join('\n');
}

/**
 * Check if content has meaningful changes (not just whitespace)
 */
export function hasContentChanges(oldContent: string, newContent: string): boolean {
  const oldNormalized = oldContent.trim();
  const newNormalized = newContent.trim();
  return oldNormalized !== newNormalized;
}
