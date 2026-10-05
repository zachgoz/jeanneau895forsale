"use client";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getMeasurementId, trackEvent } from "@/lib/analytics";
export default function Analytics() {
  const id = getMeasurementId();
  const pathname = usePathname();
  useEffect(() => {
    if (!id) return;
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer!.push(args);
      };
      window.gtag("js", new Date());
    }
    // Only known public paths: strip arbitrary queries/fragments and unknown paths.
    const pagePath =
      pathname === "/privacy/" || pathname === "/privacy" ? "/privacy/" : "/";
    window.gtag("config", id, {
      page_location: "https://895forsale.com" + pagePath,
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !seen.has(entry.target.id)) {
            seen.add(entry.target.id);
            if (entry.target.id === "owner-story")
              trackEvent("owner_story_view");
            if (entry.target.id === "specifications") trackEvent("view_specs");
            if (entry.target.id === "service")
              trackEvent("view_service_history");
          }
        });
      },
      { threshold: 0.2 },
    );
    ["owner-story", "specifications", "service"].forEach((section) => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [id, pathname]);
  if (!id) return null;
  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      strategy="afterInteractive"
    />
  );
}
