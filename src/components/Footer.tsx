"use client";

import Link from "next/link";
import { OPEN_COOKIE_PREFERENCES_EVENT } from "../lib/consent";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-tagline">
        <span className="footer-brand">
          DialecTrek
          <span className="brand-dots" aria-hidden="true">
            <span className="brand-dot" />
            <span className="brand-dot" />
            <span className="brand-dot" />
          </span>
        </span>{" "}
        — learn a language, your way
      </div>
      <div className="footer-copyright">© {new Date().getFullYear()} DialecTrek</div>
      <div className="footer-links">
        <Link href="/privacy" className="footer-link-btn">
          Privacy policy
        </Link>
        <span className="footer-sep" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="footer-link-btn"
          onClick={() =>
            window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))
          }
        >
          Cookie preferences
        </button>
      </div>
    </footer>
  );
};

export default Footer;
