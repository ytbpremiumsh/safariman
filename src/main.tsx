import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// Auto-reload saat chunk lama (setelah deploy baru) gagal dimuat.
const RELOAD_KEY = "__chunk_reload_ts";
function safeReload() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    const now = Date.now();
    // Hindari infinite loop: hanya reload sekali tiap 10 detik.
    if (now - last < 10_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    /* ignore */
  }
  window.location.reload();
}

function isChunkLoadError(msg: string): boolean {
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Unable to preload CSS")
  );
}

window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  safeReload();
});

window.addEventListener("error", (event) => {
  if (isChunkLoadError(event?.message || "")) safeReload();
});

window.addEventListener("unhandledrejection", (event) => {
  const reason: unknown = event?.reason;
  const msg =
    (reason instanceof Error ? reason.message : String(reason ?? "")) || "";
  if (isChunkLoadError(msg)) {
    event.preventDefault();
    safeReload();
  }
});

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
