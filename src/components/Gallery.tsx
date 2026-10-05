"use client";
import { useEffect, useRef, useState } from "react";
import { boat } from "@/data/boat";
import { trackEvent } from "@/lib/analytics";

export default function Gallery() {
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const touch = useRef<number | null>(null);
  const categories = [
    "All",
    ...new Set(boat.gallery.map((photo) => photo.category)),
  ];
  const filtered = boat.gallery.filter(
    (photo) => category === "All" || photo.category === category,
  );
  const visible = expanded ? filtered : filtered.slice(0, 6);
  const activeIndex = filtered.findIndex((photo) => photo.id === activeId);
  const active = filtered[activeIndex];
  const isOpen = activeId !== null;
  useEffect(() => {
    if (!isOpen || !dialog.current) return;
    const element = dialog.current;
    restore.current = document.activeElement as HTMLElement;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previous;
      restore.current?.focus();
    };
  }, [isOpen]);
  function step(direction: number) {
    const photo =
      filtered[(activeIndex + direction + filtered.length) % filtered.length];
    if (photo) setActiveId(photo.id);
  }
  return (
    <>
      <div
        className="gallery-filters"
        role="group"
        aria-label="Photo categories"
      >
        {categories.map((value) => (
          <button
            key={value}
            className={category === value ? "selected" : ""}
            aria-pressed={category === value}
            onClick={() => {
              setCategory(value);
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {visible.map((photo, i) => (
          <button
            className="gallery-photo"
            key={photo.id}
            onClick={() => {
              setActiveId(photo.id);
              trackEvent("gallery_open", { photo_id: photo.id });
            }}
            aria-label={"Open photo: " + photo.alt}
          >
            <img
              src={photo.src}
              srcSet={photo.srcSet}
              sizes={
                i === 0
                  ? "(max-width: 600px) 100vw, (max-width: 1000px) 66vw, 50vw"
                  : "(max-width: 600px) 50vw, 25vw"
              }
              width={photo.width}
              height={photo.height}
              loading="lazy"
              alt={photo.alt}
            />
            <span className="gallery-caption">
              {photo.caption}
              <span aria-hidden="true"> ↗</span>
            </span>
          </button>
        ))}
      </div>
      {!expanded && filtered.length > 6 && (
        <div className="gallery-more">
          <button
            className="button button-outline"
            onClick={() => {
              setExpanded(true);
              trackEvent("gallery_view_all");
            }}
          >
            View all {filtered.length} photos <span aria-hidden="true">↗</span>
          </button>
          <span>Exterior, interiors & the details that matter.</span>
        </div>
      )}
      <dialog
        className="lightbox"
        ref={dialog}
        aria-label="Boat photo viewer"
        onCancel={() => setActiveId(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setActiveId(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
      >
        {active && (
          <>
            <div className="lightbox-top">
              <span aria-live="polite">
                {activeIndex + 1} / {filtered.length}
              </span>
              <button
                autoFocus
                aria-label="Close photo viewer"
                onClick={() => setActiveId(null)}
              >
                ✕
              </button>
            </div>
            <div
              className="lightbox-image"
              onPointerDown={(e) => {
                if (e.isPrimary) touch.current = e.clientX;
              }}
              onPointerUp={(e) => {
                if (touch.current !== null) {
                  const delta = e.clientX - touch.current;
                  if (Math.abs(delta) > 45) step(delta < 0 ? 1 : -1);
                }
                touch.current = null;
              }}
              onPointerCancel={() => {
                touch.current = null;
              }}
            >
              <img
                draggable={false}
                src={active.src}
                srcSet={active.srcSet}
                sizes="100vw"
                width={active.width}
                height={active.height}
                alt={active.alt}
              />
            </div>
            <div className="lightbox-bottom">
              <button aria-label="Previous photo" onClick={() => step(-1)}>
                ←
              </button>
              <p aria-live="polite">
                {active.caption}
                <small>Use arrow keys to browse · Escape to close</small>
              </p>
              <button aria-label="Next photo" onClick={() => step(1)}>
                →
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
