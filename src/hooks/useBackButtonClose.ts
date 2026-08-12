"use client";

import { useEffect, useRef } from "react";

/**
 * Makes an open dialog/drawer close on the phone's back button/gesture
 * instead of navigating the underlying page away. Radix/vaul overlays
 * don't participate in browser history by default, so on mobile a
 * back-press would exit the whole game instead of just dismissing
 * whatever's on top of it (Rangliste, Regeln, confirmations, …).
 */
export function useBackButtonClose(
  open: boolean,
  onOpenChange: (open: boolean) => void
) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (open && !pushedRef.current) {
      pushedRef.current = true;
      window.history.pushState({ __overlay: true }, "");
    } else if (!open && pushedRef.current) {
      pushedRef.current = false;
      // Closed via something other than the back button (X, outside
      // click, selecting an option) — consume the entry we pushed so it
      // doesn't linger as a dangling extra back-press later.
      if (window.history.state?.__overlay) {
        window.history.back();
      }
    }
  }, [open]);

  useEffect(() => {
    function handlePopState() {
      if (pushedRef.current) {
        pushedRef.current = false;
        onOpenChange(false);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onOpenChange]);
}
