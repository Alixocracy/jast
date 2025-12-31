let initialized = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initializes Google Analytics if a measurement ID is provided.
 * Uses a client-side check to avoid running during SSR.
 */
export function initAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId || typeof document === "undefined" || initialized) {
    return;
  }

  const existingScript = document.querySelector(
    `script[src^="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`,
  );

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });

  initialized = true;
}
