"use client";
import { useState } from "react";
import type { BoatPhoto } from "@/data/photos";
import { trackEvent } from "@/lib/analytics";

export default function CabinStagedPhoto({
  stagedPhoto,
  unstagedPhoto,
}: {
  stagedPhoto: BoatPhoto;
  unstagedPhoto: BoatPhoto;
}) {
  const [isStaged, setIsStaged] = useState(true);
  const current = isStaged ? stagedPhoto : unstagedPhoto;

  return (
    <figure className="cabin-staging-figure">
      <div className="cabin-staging-container">
        <img
          src={current.src}
          srcSet={current.srcSet}
          sizes="(max-width: 600px) 100vw, (max-width: 1000px) 33vw, 25vw"
          width={current.width}
          height={current.height}
          alt={current.alt}
          loading="lazy"
        />
        <div
          className="cabin-staging-switch"
          role="group"
          aria-label="Master berth view toggle"
        >
          <button
            type="button"
            className={isStaged ? "active" : ""}
            onClick={() => {
              setIsStaged(true);
              trackEvent("cabin_toggle_staged", { mode: "staged" });
            }}
            aria-pressed={isStaged}
            title="View master berth with made bedding and accent pillows"
          >
            <span aria-hidden="true">✨</span> Staged
          </button>
          <button
            type="button"
            className={!isStaged ? "active" : ""}
            onClick={() => {
              setIsStaged(false);
              trackEvent("cabin_toggle_staged", { mode: "unstaged" });
            }}
            aria-pressed={!isStaged}
            title="View master berth with natural factory cushions"
          >
            <span aria-hidden="true">⚓</span> Natural
          </button>
        </div>
      </div>
      <figcaption>
        {isStaged
          ? "Owner’s forward master cabin · staged with made bed & pillows"
          : "Owner’s forward master cabin · natural factory cushions"}
      </figcaption>
    </figure>
  );
}
