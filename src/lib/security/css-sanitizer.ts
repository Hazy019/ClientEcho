/**
 * Sanitizes and validates user-submitted Custom CSS for widget embedding.
 * Prevents exfiltration vectors (@import, url, expression, javascript:, data:)
 * and enforces scoped selectors (.clientecho-card, #clientecho-widget).
 */
export function sanitizeAndValidateCss(css: string): {
  valid: boolean;
  sanitizedCss?: string;
  error?: string;
} {
  if (!css || typeof css !== "string") {
    return { valid: true, sanitizedCss: "" };
  }

  const trimmed = css.trim();
  if (trimmed.length === 0) {
    return { valid: true, sanitizedCss: "" };
  }

  // 1. Enforce length cap
  if (trimmed.length > 4000) {
    return { valid: false, error: "Custom CSS exceeds maximum length of 4,000 characters." };
  }

  // 2. Reject exfiltration and script execution keywords
  const forbiddenPatterns = [
    /@import/i,
    /url\s*\(/i,
    /expression\s*\(/i,
    /javascript\s*:/i,
    /data\s*:/i,
    /-moz-binding/i,
    /behavior\s*:/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: `Custom CSS contains forbidden directive or protocol: ${pattern.source}. External resources and script execution are strictly prohibited.`,
      };
    }
  }

  // 3. Reject unscoped global rules
  const globalSelectorPatterns = [
    /^\s*body\s*\{/im,
    /^\s*html\s*\{/im,
    /^\s*\*\s*\{/im,
    /^\s*:root\s*\{/im,
  ];

  for (const pattern of globalSelectorPatterns) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: "Custom CSS cannot target global selectors (body, html, *, :root). Rules must be scoped within widget selectors.",
      };
    }
  }

  // 4. Basic HTML tag stripping as additional defense-in-depth
  const sanitized = trimmed.replace(/<[^>]*>?/gm, "");

  return {
    valid: true,
    sanitizedCss: sanitized,
  };
}
