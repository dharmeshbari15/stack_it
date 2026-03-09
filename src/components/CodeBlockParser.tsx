'use client';

import CodeSnippetRenderer from './CodeSnippetRenderer';

interface CodeBlockParserProps {
  content: string;
  allowExecution?: boolean;
}

/**
 * Parses markdown with code blocks and renders them with syntax highlighting
 * Supports:
 * ```language
 * code here
 * ```
 */
export default function CodeBlockParser({
  content,
  allowExecution = false,
}: CodeBlockParserProps) {
  const segments: Array<
    | { type: 'text'; value: string }
    | { type: 'code'; language: string; value: string }
  > = [];

  const pattern = /```([\w-]+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;

  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({
        type: 'text',
        value: content.slice(lastIndex, index).trim(),
      });
    }

    segments.push({
      type: 'code',
      language: match[1] || 'plaintext',
      value: match[2] || '',
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      value: content.slice(lastIndex).trim(),
    });
  }

  return (
    <div className="space-y-4">
      {segments.map((segment, index) => {
        if (segment.type === 'text' && segment.value) {
          return (
            <div key={index} className="prose prose-invert max-w-none">
              {segment.value}
            </div>
          );
        }

        if (segment.type === 'code' && segment.value) {
          return (
            <CodeSnippetRenderer
              key={index}
              code={segment.value}
              language={segment.language}
              allowExecution={allowExecution}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
