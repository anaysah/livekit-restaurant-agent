// hooks/useNavigationSync.ts
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { PAGES, UI_TO_AGENT_EVENTS } from "@/lib/constants";

export function useNavigationSync() {
  const pathname = usePathname();
  const setPage = useAppStore((s) => s.setPage);
  const dispatchOutboundSignal = useAppStore((s) => s.dispatchOutboundSignal);

  // URL -> Store (One Way) + Notify Agent
  useEffect(() => {
    const matchingPage = Object.values(PAGES).find(p => p.path === pathname);

    if (matchingPage) {
      setPage(matchingPage.id);
      // Notify agent about navigation
      dispatchOutboundSignal(UI_TO_AGENT_EVENTS.PAGE_CHANGED, {
        page: matchingPage.id,
        path: matchingPage.path,
      });
    } else {
      console.warn("Unknown path, defaulting to home");
      setPage(PAGES.HOME.id);
    }
  }, [pathname, setPage, dispatchOutboundSignal]);
}