import { useEffect } from "react";
import { useLocation } from "react-router";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("config", "G-ZMEBQE43ZW", {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}