import sanitizeHtmlLib from 'sanitize-html';

/**
 * Universal server-side HTML sanitizer.
 * Strips malicious content while preserving safe formatting tags.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    return sanitizeHtmlLib(html, {
        allowedTags: [
            'p', 'b', 'i', 'em', 'strong', 'code', 'pre',
            'ul', 'ol', 'li', 'br', 'hr', 'a',
            'h1', 'h2', 'h3', 'blockquote'
        ],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
            code: ['class'],
            pre: ['class']
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        disallowedTagsMode: 'discard',
    });
}

/**
 * Helper to identify if content is purely malicious or empty after sanitization.
 */
export function isValidContent(sanitizedHtml: string): boolean {
    return !!sanitizedHtml && sanitizedHtml.trim() !== '';
}
