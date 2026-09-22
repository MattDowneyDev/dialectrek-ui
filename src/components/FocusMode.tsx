"use client";

import { useEffect, type ReactNode } from "react";

// Hides the site header/footer for as long as `active` is true (see
// body.focus-mode-open in App.css), so a practice/viewing screen can take
// over the whole viewport like a modal instead of sitting in the normal
// page flow with the rest of the site chrome around it. Also locks page
// scrolling, unless `scrollable` is set -- Watch's video view has to keep
// scrolling (its "More from this creator" rail sits below the player), so
// it opts out of the lock rather than fitting everything within one fixed
// screen like Flashcards/Conjugate do. Shared by every feature with a
// distraction-free "focus" screen (Flashcards, Conjugate, Watch, ...)
// instead of each one reimplementing the same body-class effect.
export const useFocusMode = (
  active: boolean,
  options?: { scrollable?: boolean },
) => {
  const scrollable = options?.scrollable ?? false;
  useEffect(() => {
    if (!active) return;
    document.body.classList.add("focus-mode-open");
    if (scrollable) document.body.classList.add("focus-mode-open--scrollable");
    return () => {
      document.body.classList.remove("focus-mode-open");
      document.body.classList.remove("focus-mode-open--scrollable");
    };
  }, [active, scrollable]);
};

type FocusModeProps = {
  children: ReactNode;
  // See useFocusMode's `scrollable` option above -- drops the fixed-
  // position, viewport-height-locked overlay (.focus-mode--scrollable in
  // App.css) so children render in normal, scrollable document flow with
  // their own layout untouched.
  scrollable?: boolean;
};

// The full-screen overlay itself. Render this only while the same `active`
// condition passed to useFocusMode is true. In the default (non-scrollable)
// mode, arrange a meter/body/stage(/panel) structure inside it -- see
// .focus-mode* in App.css for what each of those classes does.
const FocusMode = ({ children, scrollable }: FocusModeProps) => (
  <div className={`focus-mode${scrollable ? " focus-mode--scrollable" : ""}`}>
    {children}
  </div>
);

export default FocusMode;
