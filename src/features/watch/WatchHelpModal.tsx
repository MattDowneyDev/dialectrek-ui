"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Button from "../../components/Button";

type WatchHelpModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

// Generic dialog chrome (portal, overlay, close button, a11y wiring) shared
// by two *different* popups: the daily auto-reminder (WatchIntroModal) and
// the on-demand "how rankings work" explainer (WatchHelpButton). Only the
// chrome is shared -- each caller supplies its own title/copy.
//
// Portalled to the body rather than rendered inline -- the page-load
// animation on .page leaves it with a (no-op) transform, which makes it a
// containing block for position: fixed descendants and would pin this
// overlay to the page's scrolled height instead of the viewport.
const WatchHelpModal = ({ title, children, onClose }: WatchHelpModalProps) =>
  createPortal(
    <div className="watch-intro-overlay" onClick={onClose}>
      <div
        className="watch-intro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watch-intro-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="watch-intro-close"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 id="watch-intro-heading">{title}</h3>
        {children}
        <Button onClick={onClose}>Got it</Button>
      </div>
    </div>,
    document.body,
  );

export default WatchHelpModal;
