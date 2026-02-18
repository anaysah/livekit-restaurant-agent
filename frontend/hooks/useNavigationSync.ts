// hooks/useNavigationSync.ts
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { PAGES } from "@/lib/constants";

export function useNavigationSync() {
  const pathname = usePathname();
  const setPage = useAppStore((s) => s.setPage);

  // URL -> Store (One Way)
  useEffect(() => {
    const matchingPage = Object.values(PAGES).find(p => p.path === pathname);
    
    // Agar URL valid hai, toh store update karo
    if (matchingPage) {
      setPage(matchingPage.id);
    } else {
      // Agar URL match nahi karta (404 page), default to home
      console.warn("Unknown path, defaulting to home");
      setPage(PAGES.HOME.id);
    }
  }, [pathname, setPage]); 
  // Dependency sirf pathname hai. 
  // Store ki state yahan depend nahi hai.
}