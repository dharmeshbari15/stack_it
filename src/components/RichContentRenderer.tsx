'use client';

import { useEffect, useRef } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';

interface RichContentRendererProps {
    html: string;
}

function detectLanguage(codeElement: HTMLElement) {
    const classNames = codeElement.className.split(/\s+/);

    for (const className of classNames) {
        if (className.startsWith('language-')) {
            return className.replace('language-', '').toLowerCase();
        }
        if (className.startsWith('lang-')) {
            return className.replace('lang-', '').toLowerCase();
        }
    }

    return 'plaintext';
}

export function RichContentRenderer({ html }: RichContentRendererProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        container.innerHTML = DOMPurify.sanitize(html);

        const codeBlocks = container.querySelectorAll('pre code');

        codeBlocks.forEach((node) => {
            const codeElement = node as HTMLElement;
            const preElement = codeElement.parentElement;

            if (!preElement || preElement.dataset.enhanced === 'true') {
                return;
            }

            const language = detectLanguage(codeElement);
            const sourceCode = codeElement.textContent || '';
            const activeLanguage = hljs.getLanguage(language) ? language : 'plaintext';

            try {
                codeElement.innerHTML = hljs.highlight(sourceCode, { language: activeLanguage }).value;
            } catch {
                codeElement.textContent = sourceCode;
            }

            codeElement.classList.add('hljs', `language-${activeLanguage}`);
            preElement.dataset.enhanced = 'true';
            preElement.classList.add('snippet-pre');

            const wrapper = document.createElement('div');
            wrapper.className = 'snippet-wrapper';

            const header = document.createElement('div');
            header.className = 'snippet-toolbar';

            const badge = document.createElement('span');
            badge.className = 'snippet-language';
            badge.textContent = activeLanguage;

            const copyButton = document.createElement('button');
            copyButton.type = 'button';
            copyButton.className = 'snippet-copy';
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(sourceCode);
                    copyButton.textContent = 'Copied';
                    window.setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 1500);
                } catch {
                    copyButton.textContent = 'Failed';
                    window.setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 1500);
                }
            });

            header.appendChild(badge);
            header.appendChild(copyButton);
            preElement.parentNode?.insertBefore(wrapper, preElement);
            wrapper.appendChild(header);
            wrapper.appendChild(preElement);
        });
    }, [html]);

    return <div ref={containerRef} className="rich-content prose prose-blue max-w-none text-gray-800" />;
}