// lib/diff-util.ts
// Utilities for calculating and displaying text diffs

/**
 * Simple character-based diff calculation (LCS - Longest Common Subsequence)
 * Returns operations needed to transform 'old' into 'new'
 */
export function calculateDiff(
  oldText: string,
  newText: string
): Array<{
  type: 'add' | 'remove' | 'context';
  content: string;
}> {
  if (oldText === newText) {
    return [{ type: 'context', content: oldText }];
  }

  // Split text into lines for better diff
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const diff: Array<{
    type: 'add' | 'remove' | 'context';
    content: string;
  }> = [];

  // Simple line-based diff
  const oldSet = new Map<string, number[]>();
  const newSet = new Map<string, number[]>();

  oldLines.forEach((line, idx) => {
    if (!oldSet.has(line)) oldSet.set(line, []);
    oldSet.get(line)!.push(idx);
  });

  newLines.forEach((line, idx) => {
    if (!newSet.has(line)) newSet.set(line, []);
    newSet.get(line)!.push(idx);
  });

  // Create diff by checking which lines exist in both
  const processed = new Set<number>();

  for (let i = 0; i < oldLines.length; i++) {
    const line = oldLines[i];
    if (newSet.has(line)) {
      diff.push({ type: 'context', content: line });
      processed.add(i);
    } else {
      diff.push({ type: 'remove', content: line });
    }
  }

  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i];
    if (!oldSet.has(line)) {
      diff.push({ type: 'add', content: line });
    }
  }

  return diff;
}

/**
 * Calculate summary of changes
 */
export function getChangeSummary(
  oldText: string,
  newText: string
): { added: number; removed: number; modified: boolean } {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let added = 0;
  let removed = 0;

  // Count added lines
  for (const line of newLines) {
    if (!oldSet.has(line)) added++;
  }

  // Count removed lines
  for (const line of oldLines) {
    if (!newSet.has(line)) removed++;
  }

  return {
    added,
    removed,
    modified: added > 0 || removed > 0,
  };
}
