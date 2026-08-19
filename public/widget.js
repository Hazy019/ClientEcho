(function () {
  const script = document.currentScript;
  if (!script) return;

  const widgetSlug = script.getAttribute("data-widget-slug");
  if (!widgetSlug) {
    console.error("[ClientEcho] Missing data-widget-slug attribute on widget script tag.");
    return;
  }

  const initialTheme = script.getAttribute("data-theme") || "light";

  // Known widget domain determined from script source or current origin
  const scriptUrl = new URL(script.src);
  const widgetHost = scriptUrl.origin;

  const container = document.createElement("div");
  container.className = "clientecho-widget-container";
  container.style.width = "100%";
  container.style.overflow = "hidden";

  const iframe = document.createElement("iframe");
  const embedUrl = new URL(`${widgetHost}/embed/${encodeURIComponent(widgetSlug)}`);
  if (initialTheme) {
    embedUrl.searchParams.set("theme", initialTheme);
  }
  iframe.src = embedUrl.toString();

  // Strict sandboxing: allow-scripts, allow-same-origin, and allow-popups for verification page links
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
  iframe.style.width = "100%";
  iframe.style.height = "350px";
  iframe.style.border = "none";
  iframe.style.scrolling = "no";
  iframe.style.transition = "height 0.2s ease-in-out";

  container.appendChild(iframe);
  script.parentNode.insertBefore(container, script.nextSibling);

  // Listen for auto-resize postMessage from widget domain & host-page live theme updates
  window.addEventListener("message", function (event) {
    // Resize message sent from iframe
    if (event.origin === widgetHost && event.data && event.data.type === "clientecho-resize" && typeof event.data.height === "number") {
      iframe.style.height = `${Math.max(150, event.data.height)}px`;
    }

    // Host page theme change notification (relay to iframe)
    if (event.data && event.data.type === "clientecho-set-theme" && typeof event.data.theme === "string") {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "clientecho-set-theme", theme: event.data.theme },
          "*"
        );
      }
    }
  });
})();

