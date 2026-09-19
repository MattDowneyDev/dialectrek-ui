"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  applyConsent,
  getStoredConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  storeConsent,
  type ConsentChoice,
} from "../lib/consent";

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, reopen);
    return () =>
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, reopen);
  }, []);

  const choose = (choice: ConsentChoice) => {
    storeConsent(choice);
    applyConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="cookie-consent-banner"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <p className="cookie-consent-text">
        We use Google Analytics to understand how DialecTrek is used, and the
        Watch feature loads videos directly from YouTube -- both set cookies
        from Google. They only run if you say yes, and you can change your
        mind anytime from the link in the footer. If you decline, you can
        still load an individual video with a click. See our{" "}
        <Link href="/privacy">privacy policy</Link> for details.
      </p>
      <div className="cookie-consent-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => choose("denied")}
        >
          Decline
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => choose("granted")}
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
