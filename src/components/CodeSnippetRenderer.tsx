'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import hljs from 'highlight.js';
import { Check, Copy, Play } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CodeSnippetRendererProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  allowExecution?: boolean;
  showCopyButton?: boolean;
}

function normalizeLanguage(language: string) {
  if (language === 'auto') {
    return language;
  }

  const normalized = language.toLowerCase();

  if (normalized === 'js') return 'javascript';
  if (normalized === 'ts') return 'typescript';
  if (normalized === 'sh') return 'bash';
  if (normalized === 'html') return 'xml';

  return normalized;
}

function canExecuteLanguage(language: string) {
  return ['javascript', 'js'].includes(language.toLowerCase());
}

export default function CodeSnippetRenderer({
  code,
  language = 'javascript',
  title,
  showLineNumbers = true,
  allowExecution = false,
  showCopyButton = true,
}: CodeSnippetRendererProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const runTokenRef = useRef(0);
  const { showToast } = useToast();
  const resolvedLanguage = normalizeLanguage(language);

  const highlightedCode = useMemo(() => {
    try {
      if (resolvedLanguage === 'auto') {
        return hljs.highlightAuto(code).value;
      }

      const activeLanguage = hljs.getLanguage(resolvedLanguage)
        ? resolvedLanguage
        : 'plaintext';

      return hljs.highlight(code, { language: activeLanguage }).value;
    } catch {
      return hljs.highlight(code, { language: 'plaintext' }).value;
    }
  }, [code, resolvedLanguage]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data as {
        type?: string;
        token?: number;
        output?: string[];
        error?: string;
      };

      if (payload?.type !== 'code-snippet-result' || payload.token !== runTokenRef.current) {
        return;
      }

      setIsExecuting(false);

      if (payload.error) {
        setExecutionError(payload.error);
        showToast(`Execution error: ${payload.error}`, 'error');
        return;
      }

      const output = payload.output?.length
        ? payload.output.join('\n')
        : 'Code executed successfully (no output)';

      setExecutionOutput(output);
      showToast('Code executed successfully', 'success');
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showToast]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      showToast('Code copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy code', 'error');
    }
  };

  const handleExecute = async () => {
    if (!canExecuteLanguage(resolvedLanguage)) {
      showToast('Code execution only supported for JavaScript', 'error');
      return;
    }

    setIsExecuting(true);
    setExecutionOutput(null);
    setExecutionError(null);

    runTokenRef.current += 1;
    const token = runTokenRef.current;

    const serializedCode = JSON.stringify(code);

    const srcDoc = `<!doctype html>
<html>
  <body>
    <script>
      const token = ${token};
      const code = ${serializedCode};
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const output = [];
      const normalize = (value) => {
        try {
          if (typeof value === 'string') return value;
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const send = (payload) => {
        parent.postMessage({ type: 'code-snippet-result', token, ...payload }, '*');
      };

      const customConsole = {
        log: (...args) => output.push(args.map(normalize).join(' ')),
        warn: (...args) => output.push('WARN: ' + args.map(normalize).join(' ')),
        error: (...args) => output.push('ERROR: ' + args.map(normalize).join(' ')),
      };

      window.console = customConsole;

      const timeout = setTimeout(() => {
        send({ error: 'Code execution timeout (5 seconds)' });
      }, 5000);

      Promise.resolve()
        .then(async () => {
          const run = new AsyncFunction('console', code);
          return run(customConsole);
        })
        .then(() => {
          clearTimeout(timeout);
          send({ output });
        })
        .catch((error) => {
          clearTimeout(timeout);
          send({ error: error instanceof Error ? error.message : String(error) });
        });
    </script>
  </body>
</html>`;

    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc;
    }
  };

  const lines = code.split('\n');

  return (
    <div className="my-4 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
      {(title || showCopyButton || allowExecution) && (
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-4">
            {title ? <span className="text-sm font-semibold text-slate-200">{title}</span> : null}
            <span className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-400">
              {resolvedLanguage}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {allowExecution && canExecuteLanguage(resolvedLanguage) && (
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                title="Run code"
              >
                <Play size={16} />
                {isExecuting ? 'Running...' : 'Run'}
              </button>
            )}
            {showCopyButton && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
                title="Copy code"
              >
                {isCopied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <pre className="m-0 p-4">
          <div className="flex">
            {showLineNumbers && (
              <div className="select-none pr-6 text-right font-mono text-sm text-slate-500">
                {lines.map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 w-full">
              <code
                className={`hljs block font-mono text-sm leading-6 text-slate-100 language-${resolvedLanguage}`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </div>
          </div>
        </pre>
      </div>

      {(executionOutput || executionError) && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3">
          <div className="mb-2 text-xs font-semibold text-slate-400">
            {executionError ? 'Error' : 'Output'}
          </div>
          <pre className="max-h-40 overflow-x-auto overflow-y-auto rounded bg-slate-900 p-3 font-mono text-xs text-slate-300">
            {executionError || executionOutput}
          </pre>
        </div>
      )}

      <iframe
        ref={iframeRef}
        title="Code execution sandbox"
        sandbox="allow-scripts"
        className="hidden"
      />
    </div>
  );
}
