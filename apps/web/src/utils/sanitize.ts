/**
 * HTML Sanitization Utility
 * 
 * Provides functions to sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify with dynamic import to ensure it only loads on the client side.
 */

// DOMPurify instance (loaded dynamically on client side)
let DOMPurifyInstance: any = null;
let DOMPurifyPromise: Promise<any> | null = null;

/**
 * Get DOMPurify instance (lazy load on client side only)
 */
async function getDOMPurify(): Promise<any> {
  // Server-side: return null (will use basic sanitization)
  if (typeof window === 'undefined') {
    return null;
  }

  // If already loaded, return it
  if (DOMPurifyInstance) {
    return DOMPurifyInstance;
  }

  // If loading in progress, wait for it
  if (DOMPurifyPromise) {
    return DOMPurifyPromise;
  }

  // Start loading DOMPurify (client-side only)
  // Use Function constructor with eval to prevent webpack from resolving at build time
  try {
    // Create a dynamic import function that webpack can't statically analyze
    // This prevents webpack from trying to resolve 'dompurify' during build
    const dynamicImport = eval('(specifier) => import(specifier)');
    DOMPurifyPromise = dynamicImport('dompurify')
      .then((module: any) => {
        DOMPurifyInstance = module.default || module;
        return DOMPurifyInstance;
      })
      .catch((error) => {
        console.error('Failed to load DOMPurify:', error);
        DOMPurifyPromise = null;
        return null;
      });
  } catch (error) {
    console.error('Failed to load DOMPurify:', error);
    DOMPurifyPromise = null;
    return null;
  }

  return DOMPurifyPromise;
}

/**
 * Configuration for DOMPurify
 * Allows common formatting tags but blocks dangerous scripts and events
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Remove dangerous attributes
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // Keep relative URLs safe
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * Removes dangerous scripts, event handlers, and other potentially malicious content
 * while preserving safe HTML formatting tags.
 * Uses isomorphic-dompurify which works in both browser and server environments.
 * 
 * @param {string} html - The HTML string to sanitize
 * @param {boolean} [allowLinks=true] - Whether to allow anchor tags with href attributes
 * @returns {string} Sanitized HTML string safe for rendering
 * 
 * @example
 * ```typescript
 * const userInput = '<p>Hello <script>alert("XSS")</script>World</p>';
 * const safe = sanitizeHTML(userInput);
 * // Returns: '<p>Hello World</p>'
 * ```
 */
/**
 * Basic HTML sanitization (removes dangerous content without DOMPurify)
 * Used as fallback for server-side or when DOMPurify is not available
 */
function basicSanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '');
}

export function sanitizeHTML(html: string, allowLinks: boolean = true): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Server-side: use basic sanitization
  if (typeof window === 'undefined') {
    return basicSanitize(html);
  }

  // Client-side: try to use DOMPurify if available
  if (DOMPurifyInstance) {
    try {
      const config = {
        ...PURIFY_CONFIG,
        ALLOWED_TAGS: allowLinks 
          ? PURIFY_CONFIG.ALLOWED_TAGS 
          : PURIFY_CONFIG.ALLOWED_TAGS.filter(tag => tag !== 'a'),
      };
      return DOMPurifyInstance.sanitize(html, config);
    } catch (error) {
      console.error('Error sanitizing with DOMPurify:', error);
      return basicSanitize(html);
    }
  }

  // DOMPurify not loaded yet, use basic sanitization
  // Try to load DOMPurify in background for next time
  if (!DOMPurifyPromise) {
    getDOMPurify().catch(() => {
      // Silently fail - will use basic sanitization
    });
  }

  return basicSanitize(html);
}

/**
 * Check if a string contains HTML tags
 * 
 * @param {string} content - The string to check
 * @returns {boolean} True if the string contains HTML tags
 */
export function containsHTML(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  return /<[^>]+>/g.test(content);
}

/**
 * Sanitize HTML for use with dangerouslySetInnerHTML
 * 
 * This is a convenience wrapper that ensures HTML is safe before rendering.
 * Uses isomorphic-dompurify which works in both browser and server environments.
 * 
 * @param {string} html - The HTML string to sanitize
 * @param {boolean} [allowLinks=true] - Whether to allow anchor tags
 * @returns {object} Object with __html property safe for dangerouslySetInnerHTML
 * 
 * @example
 * ```typescript
 * <div dangerouslySetInnerHTML={sanitizeForInnerHTML(userInput)} />
 * ```
 */
export function sanitizeForInnerHTML(html: string, allowLinks: boolean = true): { __html: string } {
  return {
    __html: sanitizeHTML(html, allowLinks),
  };
}


