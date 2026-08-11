/**
 * Validates external video embed URLs against an allowlist of allowed video hosts (YouTube, Vimeo, Loom).
 * Returns true if valid, false otherwise.
 */
const ALLOWED_VIDEO_HOSTNAMES = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "vimeo.com",
  "player.vimeo.com",
  "loom.com",
  "www.loom.com",
];

export function validateVideoUrl(urlStr?: string | null): { isValid: boolean; normalizedUrl?: string; error?: string } {
  if (!urlStr || urlStr.trim() === "") {
    return { isValid: true }; // Optional field
  }

  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: "Only http and https video URLs are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();
    const isAllowed = ALLOWED_VIDEO_HOSTNAMES.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );

    if (!isAllowed) {
      return {
        isValid: false,
        error: "Invalid video host. Only YouTube, Vimeo, and Loom video links are allowed.",
      };
    }

    return { isValid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { isValid: false, error: "Invalid URL format." };
  }
}
