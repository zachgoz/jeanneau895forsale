"use client";
import { useEffect, useRef, useState } from "react";
import { boat } from "@/data/boat";
import { STAGED_PHOTO_MAP } from "@/data/staging";
import { trackEvent } from "@/lib/analytics";

type StagingMode = "staged" | "unstaged" | "all";

export default function Gallery() {
  const [category, setCategory] = useState("All");
  const [stagingMode, setStagingMode] = useState<StagingMode>("staged");
  const [cardSwaps, setCardSwaps] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const touch = useRef<number | null>(null);

  const categories = [
    "All",
    ...new Set(boat.gallery.map((photo) => photo.category)),
  ];

  // Base list filtered by staging mode
  const modeFiltered = boat.gallery.filter((photo) => {
    const pair = STAGED_PHOTO_MAP[photo.id];
    if (!pair) return true; // Exterior, helm, and systems photos are always included
    if (category !== "Interior") {
      // In non-interior views (like "All"), show staged photos by default (unless card is swapped)
      return pair.isStaged;
    }
    if (stagingMode === "all") return true;
    if (stagingMode === "staged") return pair.isStaged;
    if (stagingMode === "unstaged") return !pair.isStaged;
    return true;
  });

  // Apply card-level user swaps
  const swapped = modeFiltered.map((photo) => {
    const swappedId = cardSwaps[photo.id];
    if (swappedId) {
      const target = boat.gallery.find((p) => p.id === swappedId);
      if (target) return target;
    }
    return photo;
  });

  const filtered = swapped.filter(
    (photo) => category === "All" || photo.category === category,
  );

  const visible = expanded ? filtered : filtered.slice(0, 6);
  const activeIndex = filtered.findIndex((photo) => photo.id === activeId);
  const active =
    (activeIndex >= 0 ? filtered[activeIndex] : null) ||
    boat.gallery.find((photo) => photo.id === activeId);
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
    if (!filtered.length) return;
    const nextIndex =
      (activeIndex + direction + filtered.length) % filtered.length;
    const photo = filtered[nextIndex];
    if (photo) setActiveId(photo.id);
  }

  function toggleCardPhoto(photoId: string, event: React.MouseEvent) {
    event.stopPropagation();
    const pair = STAGED_PHOTO_MAP[photoId];
    if (!pair) return;
    setCardSwaps((prev) => ({
      ...prev,
      [photoId]: pair.counterpartId,
      [pair.counterpartId]: pair.counterpartId,
    }));
    trackEvent("gallery_toggle_card", {
      photo_id: photoId,
      target_id: pair.counterpartId,
    });
  }

  function toggleLightboxPhoto() {
    if (!active) return;
    const pair = STAGED_PHOTO_MAP[active.id];
    if (!pair) return;
    setActiveId(pair.counterpartId);
    trackEvent("gallery_toggle_lightbox", {
      photo_id: active.id,
      target_id: pair.counterpartId,
    });
  }

  const activePair = active ? STAGED_PHOTO_MAP[active.id] : null;

  return (
    <>
      <div className="gallery-toolbar">
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
      </div>

      {category === "Interior" && (
        <div
          className="interior-staging-bar"
          role="region"
          aria-label="Interior staging view options"
        >
          <div className="interior-staging-label">
            <span className="interior-badge">✨ Staging View</span>
            <span>Living spaces toggle:</span>
          </div>
          <div
            className="staging-toggle-group"
            role="radiogroup"
            aria-label="Interior staging mode"
          >
            <button
              type="button"
              className={stagingMode === "staged" ? "active" : ""}
              onClick={() => {
                setStagingMode("staged");
                setCardSwaps({});
                trackEvent("gallery_mode", { mode: "staged" });
              }}
              aria-checked={stagingMode === "staged"}
              role="radio"
              title="Show made beds, linens, pillows and staged salon dining"
            >
              <span aria-hidden="true">✨</span> Staged Living Spaces
            </button>
            <button
              type="button"
              className={stagingMode === "unstaged" ? "active" : ""}
              onClick={() => {
                setStagingMode("unstaged");
                setCardSwaps({});
                trackEvent("gallery_mode", { mode: "unstaged" });
              }}
              aria-checked={stagingMode === "unstaged"}
              role="radio"
              title="Show raw factory cushions and bare mattresses"
            >
              <span aria-hidden="true">⚓</span> Factory Cushions
            </button>
            <button
              type="button"
              className={stagingMode === "all" ? "active" : ""}
              onClick={() => {
                setStagingMode("all");
                trackEvent("gallery_mode", { mode: "all" });
              }}
              aria-checked={stagingMode === "all"}
              role="radio"
              title="Show all interior photos including both staged and factory cushion versions"
            >
              <span aria-hidden="true">▦</span> Show Both
            </button>
          </div>
        </div>
      )}

      <div className="gallery-grid">
        {visible.map((photo, i) => {
          const pair = STAGED_PHOTO_MAP[photo.id];
          return (
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
              {pair && (
                <span
                  role="button"
                  tabIndex={0}
                  className="card-staging-badge"
                  onClick={(e) => toggleCardPhoto(photo.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCardPhoto(photo.id, e as unknown as React.MouseEvent);
                    }
                  }}
                  title={`Click to flip to ${pair.counterpartLabel}`}
                >
                  <span aria-hidden="true">{pair.isStaged ? "✨" : "⚓"}</span>
                  {pair.isStaged ? "Staged" : "Natural"} · <strong>Flip 🔄</strong>
                </span>
              )}
              <span className="gallery-caption">
                {photo.caption}
                <span aria-hidden="true"> ↗</span>
              </span>
            </button>
          );
        })}
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
            View all {filtered.length} photos in this view <span aria-hidden="true">↗</span>
          </button>
          <span>
            {category === "Interior"
              ? stagingMode === "staged"
                ? "Showing staged living spaces with made beds and dining decor."
                : stagingMode === "unstaged"
                  ? "Showing natural factory cushions and layouts."
                  : "Showing all interior photos including both staged and natural versions."
              : "Showing curated exterior, interior, and systems photographs."}
          </span>
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
          if (e.key === "t" || e.key === "T" || e.key === "c" || e.key === "C") {
            e.preventDefault();
            toggleLightboxPhoto();
          }
        }}
      >
        {active && (
          <>
            <div className="lightbox-top">
              <span aria-live="polite">
                {activeIndex >= 0 ? activeIndex + 1 : 1} / {filtered.length}
              </span>
              {activePair && (
                <button
                  type="button"
                  className="lightbox-compare-btn"
                  onClick={toggleLightboxPhoto}
                  title={`Toggle between staged and natural view (press 'T')`}
                >
                  <span aria-hidden="true">🔄</span>
                  {activePair.isStaged
                    ? "Compare: View Natural Cushions"
                    : "Compare: View Staged with Bedding"}
                </button>
              )}
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
                <small>
                  {activePair
                    ? "Press 'T' or click button to toggle Staged / Natural · Arrows to browse · Esc to close"
                    : "Use arrow keys to browse · Escape to close"}
                </small>
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
