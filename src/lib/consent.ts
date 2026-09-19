export const CONSENT_STORAGE_KEY = "dialectrek-cookie-consent";

export type ConsentChoice = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const getStoredConsent = (): ConsentChoice | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
};

export const storeConsent = (choice: ConsentChoice) => {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: choice }));
};

export const applyConsent = (choice: ConsentChoice) => {
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
  });
};

export const OPEN_COOKIE_PREFERENCES_EVENT = "dialectrek:open-cookie-preferences";

// Fired whenever the stored choice changes, so anything already on screen
// (e.g. a video waiting behind a click-to-load placeholder) can react without
// needing a page reload.
export const CONSENT_CHANGED_EVENT = "dialectrek:consent-changed";
