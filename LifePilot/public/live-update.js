(() => {
  const CHECK_EVERY_MS = 5000;
  const STORAGE_KEY = "lifepilot-live-version";
  let checking = false;

  async function checkVersion() {
    if (checking || document.visibilityState === "hidden") return;
    checking = true;
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!response.ok) return;

      const data = await response.json();
      const version = String(data?.version || "").trim();
      if (!version) return;

      const previous = sessionStorage.getItem(STORAGE_KEY);
      if (!previous) {
        sessionStorage.setItem(STORAGE_KEY, version);
        return;
      }
      if (previous === version) return;

      sessionStorage.setItem(STORAGE_KEY, version);
      // Reload the exact same URL. index.html is no-store, so the browser obtains the newest app shell.
      window.location.reload();
    } catch {
      // A temporary network failure must never break the running app.
    } finally {
      checking = false;
    }
  }

  checkVersion();
  window.setInterval(checkVersion, CHECK_EVERY_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkVersion();
  });
})();
