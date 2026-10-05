"use client";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { boat, priceFormatted } from "@/data/boat";
export function ContactLink({
  children = "Contact owner",
  location,
  className = "button",
}: {
  children?: React.ReactNode;
  location:
    "header" | "hero" | "mobile" | "footer" | "overview" | "accommodations";
  className?: string;
}) {
  return (
    <a
      href="#contact"
      className={className}
      onClick={() =>
        trackEvent("contact_cta_click", { cta_location: location })
      }
    >
      {children}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}
export default function Header() {
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("overview");
    const observer = new IntersectionObserver(([entry]) =>
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    if (hero) observer.observe(hero);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const links = [
    ["Overview", "overview"],
    ["Gallery", "gallery"],
    ["Why this 895", "why-this-boat"],
    ["Performance", "performance"],
    ["Features", "features"],
    ["Accommodations", "accommodations"],
    ["Specifications", "specifications"],
    ["Service", "service"],
    ["FAQ", "faq"],
  ];
  return (
    <>
      <header className="site-header">
        <a
          className="wordmark"
          href="#overview"
          aria-label={boat.vesselName + " overview"}
        >
          EZ <em>Livin</em>
          <span>JEANNEAU NC 895</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links
            .filter(([, id]) =>
              ["gallery", "performance", "specifications"].includes(id),
            )
            .map(([name, id]) => (
              <a key={id} href={"#" + id}>
                {name}
              </a>
            ))}
        </nav>
        <div className="header-actions">
          <ContactLink location="header" className="button button-small" />
          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
        {open && (
          <nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="All sections"
          >
            {links.map(([name, id]) => (
              <a key={id} href={"#" + id} onClick={() => setOpen(false)}>
                {name}
              </a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)}>
              Contact owner
            </a>
          </nav>
        )}
      </header>
      {pastHero && (
        <div className="mobile-contact">
          <span>
            {boat.vesselName}
            <small>Private sale · {priceFormatted}</small>
          </span>
          <ContactLink location="mobile" className="button button-small" />
        </div>
      )}
    </>
  );
}
