"use client";

import { useMediaQuery } from "./useMediaQuery";

// Below this width the on-screen keyboard eats too much of the practice
// card, so conjugate practice swaps typed input for multiple-choice answers
// -- matches a breakpoint already used elsewhere in the app for
// tablet-and-down layouts.
const COMPACT_QUERY = "(max-width: 900px)";

// A plain (non-reactive) check for use inside async handlers, where reading
// the useIsCompactViewport() hook's state would risk a stale value if the
// handler fires in the same render pass the hook's own effect hasn't
// resolved in yet (e.g. a fetch kicked off from a mount effect).
export const isCompactViewport = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(COMPACT_QUERY).matches;

export const useIsCompactViewport = (): boolean => useMediaQuery(COMPACT_QUERY);
