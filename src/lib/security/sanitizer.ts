/**
 * Serverless-safe HTML sanitizer.
 * Strips all dangerous tags, script injections, event handlers, and inline JS without heavy JSDOM dependencies.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // 1. Remove script tags and contents
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove style tags and contents
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // 3. Remove iframe, object, embed, form, input, textarea, button, applet, meta, link tags
  clean = clean.replace(/<\/?(iframe|object|embed|form|input|textarea|button|applet|meta|link)\b[^>]*>/gi, "");

  // 4. Remove all on* event handlers (e.g. onerror=..., onclick=..., onload=...)
  clean = clean.replace(/\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 5. Remove javascript: URIs
  clean = clean.replace(/(?:href|src)\s*=\s*(?:['"]javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, "");

  // 6. Filter tags to allowed whitelist: b, i, em, strong, a, p, br, ul, ol, li, span, blockquote
  clean = clean.replace(/<\/?([a-z0-9]+)\b([^>]*)>/gi, (match, tagName, attrs) => {
    const lower = tagName.toLowerCase();
    const allowed = ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "span", "blockquote"];
    if (!allowed.includes(lower)) {
      return "";
    }
    if (attrs) {
      const filteredAttrs = attrs.replace(/([a-z0-9_-]+)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+))/gi, (_: string, attrName: string, q1: string, q2: string, unq: string) => {
        const lowerAttr = attrName.toLowerCase();
        if (["href", "target", "rel", "class"].includes(lowerAttr)) {
          const val = q1 || q2 || unq || "";
          return ` ${lowerAttr}="${val.replace(/"/g, "&quot;")}"`;
        }
        return "";
      });
      return `<${match.startsWith("</") ? "/" : ""}${lower}${filteredAttrs}>`;
    }
    return `<${match.startsWith("</") ? "/" : ""}${lower}>`;
  });

  return clean.trim();
}

/**
 * Strips all HTML formatting completely for plain text fields like author_name.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

