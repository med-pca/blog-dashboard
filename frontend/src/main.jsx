import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.jsx";
import { getAdsConfig } from "./api/ads";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
    sendDefaultPii: false,
  });
}

const umamiUrl = import.meta.env.VITE_UMAMI_URL;
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (umamiUrl && umamiId) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = `${umamiUrl}/script.js`;
  s.setAttribute("data-website-id", umamiId);
  document.head.appendChild(s);
}

// AdSense site verification needs this meta tag on every page. The publisher id
// is managed from the admin panel, so it is read at runtime; the AdSense script
// itself is loaded lazily by AdSenseBlock, only on pages that actually show ads.
getAdsConfig().then((ads) => {
  if (!ads.enabled || !ads.clientId) return;
  if (document.querySelector('meta[name="google-adsense-account"]')) return;
  const m = document.createElement("meta");
  m.setAttribute("name", "google-adsense-account");
  m.setAttribute("content", ads.clientId);
  document.head.appendChild(m);
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
