import DOMPurify from 'isomorphic-dompurify';

/**
 * Universal server-side HTML sanitizer.
 * Strips malicious content while preserving safe formatting tags.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'b', 'i', 'em', 'strong', 'code', 'pre',
            'ul', 'ol', 'li', 'br', 'hr', 'a',
            'h1', 'h2', 'h3', 'blockquote'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });
}

/**
 * Helper to identify if content is purely malicious or empty after sanitization.
 */
export function isValidContent(sanitizedHtml: string): boolean {
    return !!sanitizedHtml && sanitizedHtml.trim() !== '';
}
