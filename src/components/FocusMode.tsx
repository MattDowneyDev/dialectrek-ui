"use client";

import { useEffect, type ReactNode } from "react";

// Hides the site header/footer and locks page scrolling for as long as
// `active` is true (see body.focus-mode-open in App.css), so a practice
// screen can take over the whole viewport like a modal instead of sitting
// in the normal scrollable page flow. Shared by every feature with a
// distraction-free "focus" practice mode (Flashcards, Conjugate, ...)
// instead of each one reimplementing the same body-class effect.
export const useFocusMode = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("focus-mode-open");
    return () => document.body.classList.remove("focus-mode-open");
  }, [active]);
};

type FocusModeProps = {
  children: ReactNode;
};

// The full-screen fixed overlay itself. Render this only while the same
// `active` condition passed to useFocusMode is true, and arrange a
// meter/body/stage(/panel) structure inside it -- see .focus-mode* in
// App.css for what each of those classes does.
const FocusMode = ({ children }: FocusModeProps) => (
  <div className="focus-mode">{children}</div>
);

export default FocusMode;
