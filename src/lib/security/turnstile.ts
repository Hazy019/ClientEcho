/**
 * Verifies Cloudflare Turnstile token on the server side.
 * Returns true if valid, false if invalid or missing token.
 */
export async function verifyTurnstileToken(token?: string, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In local development/testing environment without TURNSTILE_SECRET_KEY, allow bypass if token is provided or mocked
  if (!secretKey) {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      return true;
    }
  }

  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey || "");
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
