"use client";

import { useLayoutEffect, useState } from "react";

// Starts false (matches server-rendered output) and syncs to the real value
// right after mount, same pattern as ThemeContext's matchMedia read.
// useLayoutEffect (not useEffect) so it resolves before paint -- otherwise
// conjugate practice would flash typed input before switching to multiple
// choice on a phone or tablet.
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};
