(function () {
  const script = document.currentScript;
  if (!script) return;

  const widgetSlug = script.getAttribute("data-widget-slug");
  if (!widgetSlug) {
    console.error("[ClientEcho] Missing data-widget-slug attribute on widget script tag.");
    return;
  }

  // Known widget domain determined from script source or current origin
  const scriptUrl = new URL(script.src);
  const widgetHost = scriptUrl.origin;

  const container = document.createElement("div");
  container.className = "clientecho-widget-container";
  container.style.width = "100%";
  container.style.overflow = "hidden";

  const iframe = document.createElement("iframe");
  iframe.src = `${widgetHost}/embed/${encodeURIComponent(widgetSlug)}`;
  // Strict sandboxing: allow-scripts and allow-same-origin ONLY for iframe execution
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.style.width = "100%";
  iframe.style.height = "350px";
  iframe.style.border = "none";
  iframe.style.scrolling = "no";
  iframe.style.transition = "height 0.2s ease-in-out";

  container.appendChild(iframe);
  script.parentNode.insertBefore(container, script.nextSibling);

  // Listen strictly for auto-resize postMessage from widget domain
  window.addEventListener("message", function (event) {
    // Validate event.origin against the expected widget serving domain!
    if (event.origin !== widgetHost) return;

    if (event.data && event.data.type === "clientecho-resize" && typeof event.data.height === "number") {
      iframe.style.height = `${Math.max(150, event.data.height)}px`;
    }
  });
})();
