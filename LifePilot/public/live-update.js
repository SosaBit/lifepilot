(() => {
  const CHECK_EVERY_MS = 5000;
  const VERSION_URL = `/version.json?_=${Date.now()}`;
  const STORAGE_KEY = "lifepilot-live-version";
  let checking = false;

  async function checkVersion() {
    if (checking || document.visibilityState === "hidden") return;
    checking = true;
    try {
      const response = await fetch(`${VERSION_URL}&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" }
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
      // Force a fresh HTML + JS graph from the same public URL.
      const url = new URL(window.location.href);
      url.searchParams.set("lpv", version.slice(0, 12));
      window.location.replace(url.toString());
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
