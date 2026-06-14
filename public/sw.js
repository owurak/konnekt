const SW_VERSION = "konnekt-pwa-v2-logo";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "KONNEKT_SW_VERSION") {
    event.source?.postMessage({ type: "KONNEKT_SW_VERSION", version: SW_VERSION });
  }
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
