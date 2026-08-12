import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const windowInstance = new JSDOM("<!DOCTYPE html><html><body></body></html>").window;
const DOMPurify = createDOMPurify(windowInstance as any);


/**
 * Server-side HTML sanitizer applied AFTER Zod validation.
 * Strips all dangerous tags, script injections, event handlers, and inline JS.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "span", "blockquote"],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}

/**
 * Strips all HTML formatting completely for plain text fields like author_name.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

