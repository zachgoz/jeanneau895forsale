# Owner photo inventory and curation

Source: `/Users/zgosling/Pictures/Jeanneau/Pics`. Inspected all still photographs in a contact sheet and individually checked the hero, cabins, helm, systems and owner photo. All 37 originals were hashed before and after processing and remain unchanged. No source files were moved, renamed or edited.

- 36 JPEG/JPG still photos and 1 MOV video; no PNG, HEIC, HEIF or WebP originals in this source set.
- 22 gallery photos; 14 stills excluded. No exact byte-identical duplicates. Near-duplicates were assessed visually.
- Hero: `DA18D8EE20EE67A1783F0C55B0D60CDF.jpg` → `/images/boat/2018-jeanneau-nc-895-ez-livin-port-profile-1600.webp`. Broadside port profile, landscape, 2050 × 1536 source pixels.
- Social preview: actual hero photograph → `/images/og/jeanneau-nc895-for-sale-og.jpg`, verified 1200 × 630 JPEG.
- The technical/detail images include galley equipment, shower, installed head, helm controls, marine A/C controller and cabin layout. There is no dedicated generator compartment photograph in the supplied set. The stern aerial supplies the real engines/cockpit/swim-platform view.
- Most originals are 2048 × 1536 or 1536 × 2048; six aerials are 2048/2050 × 1536, four furnished repeats are 896/1195px wide, and the beach photo is 4000 × 3000. `Hours.jpeg` is a 3024 × 4032 portrait after correcting EXIF orientation 6.

## Public derivative handling

The pipeline corrects EXIF orientation, removes EXIF/XMP/IPTC/ICC metadata, produces WebP at requested widths 480/960/1600/2400, and caps output to source resolution. Filename suffixes express the requested size; each generated `srcSet` uses the true decoded width. A 1536px portrait is never upscaled to 1600px and has no redundant 2400 derivative. A 2048px landscape's `-2400.webp` is capped at 2048px. The full beach photo has a 2400px derivative. Every output was decoded and checked for dimensions and unwanted metadata. Generated 82 WebP files totaling 17.30 MiB. Originals are not shipped publicly.

Thumbnails should use `srcSet`, responsive `sizes` (about 480px for a gallery tile), explicit width/height and lazy loading. The hero alone should be preloaded. The lightbox can use the same `srcSet` with viewport-based sizes to obtain the largest useful derivative. Descriptive filenames, accurate alt text and captions are generated with the typed gallery data.

## Selected photos

| Original | Photo ID | Category | Caption |
| --- | --- | --- | --- |
| DA18D8EE20EE67A1783F0C55B0D60CDF.jpg | port-profile | Exterior | EZ Livin at anchor |
| 0AF73F6752FC95BB51574A0FF9F09DD3.jpg | starboard-profile | Exterior | Starboard profile |
| 53748D47C7656DC2A085A09F38B9BA0A.jpg | bow-overhead | Exterior | Bow and pilothouse roof |
| BBE74D8D7AAD897B0603F49BBE35B9DC.jpg | bow-view | Exterior | Forward exterior view |
| 8036D2DC306EF5C5C9534C3FD49518B3.jpg | stern-twin-yamaha | Exterior | Twin Yamaha 200s and aft cockpit |
| CFF756CB0EDF871B93D0D401DD71B550.jpg | shoreline-aerial | Exterior | A day on the water |
| IMG_8953.jpg | salon-galley | Interior | A bright, practical pilothouse |
| IMG_8941.jpg | salon-dinette | Interior | Salon dinette |
| IMG_8964.jpg | salon-aft-view | Interior | Salon and aft glass door |
| IMG_8947.jpg | galley-sink-cooktop | Interior | Galley sink, cooktop and refrigerator |
| IMG_8988.jpg | galley-microwave | Interior | Galley microwave |
| IMG_8950.jpg | pilothouse-windshield-roof | Interior | Visibility and overhead light |
| IMG_8962.jpg | helm-lowrance-hds9 | Helm & systems | Lowrance navigation and Yamaha controls |
| IMG_8958.jpg | helm-seat-side-door | Helm & systems | Helm seat and starboard side door |
| IMG_8987.jpg | climate-control | Helm & systems | Marine climate controls |
| IMG_8982.jpg | forward-cabin | Cabins & head | Forward private cabin |
| IMG_8977.jpg | forward-cabin-aft-view | Cabins & head | Forward cabin storage and access |
| IMG_8986.jpg | second-cabin | Cabins & head | Second private cabin |
| IMG_8985.jpg | second-cabin-entry | Cabins & head | Second cabin access |
| IMG_8970.jpg | enclosed-head | Cabins & head | Enclosed head |
| IMG_8967.jpg | head-shower | Cabins & head | Shower in the enclosed head |
| Ocracoke.jpg | beach-cruising | Exterior | Real days aboard EZ Livin |

## Excluded photos/video

Exclusions preserve their originals. Furnished repeats were excluded for resolution/coverage, not interpreted as a different or current equipment specification. The historical engine screen is excluded to avoid presenting historical readings as current hours.

| Original | Reason |
| --- | --- |
| Hours.jpeg | Historical engine-hour screen (roughly 300 hours); does not represent the current owner-stated approximately 400 hours. |
| IMG_8942.jpg | Near-duplicate dinette angle; IMG_8941.jpg selected. |
| IMG_8945.jpg | Redundant helm-seat close-up; IMG_8958.jpg shows the seat and useful side-door context. |
| IMG_8949.jpg | Near-duplicate forward pilothouse angle; IMG_8950.jpg has clearer roof-hatch context. |
| IMG_8955.jpg | Near-duplicate salon/galley angle; wider landscape IMG_8953.jpg selected. |
| IMG_8961.jpg | Redundant helm-seat angle; IMG_8958.jpg and IMG_8962.jpg cover the seat, door and instruments. |
| IMG_8963.jpg | Redundant forward companion-area angle covered by wider pilothouse views. |
| IMG_8969.jpg | Near-duplicate head angle; IMG_8970.jpg shows the fixtures more clearly. |
| IMG_8976.jpg | Partial forward-cabin doorway angle; complete berth and doorway views selected. |
| IMG_8981.jpg | Near-duplicate forward berth; wider landscape IMG_8982.jpg selected. |
| IMG_9030.JPG | Lower-resolution furnished forward-cabin repeat (896px wide); detailed higher-resolution cabin images selected. |
| IMG_9031.JPG | Lower-resolution furnished second-cabin repeat (896px wide); higher-resolution cabin images selected. |
| IMG_9032.JPG | Lower-resolution head repeat (896px wide); higher-resolution head images selected. |
| IMG_9033.JPG | Lower-resolution furnished dinette repeat (1195px wide); higher-resolution salon images selected. |
| My Movie 2.mov | Owner video preserved at source; excluded from the static still-photo gallery and initial page load. |

## Reprocessing and updates

Run `npm run photos`, or `node scripts/process-photos.mjs /absolute/path/to/Pics`. The optional `PHOTO_SOURCE_DIR` environment variable can replace the default path. Edit `selections` to add/remove photos or improve alt text; edit `heroId` to change the hero and social-preview photograph. Regeneration writes `src/data/photos.ts` and both inventory files. It never deletes source files. Removed-photo public files may be removed manually from `public/images/boat` after confirming that they are generated files and no longer referenced. Update the restrained OG text alongside changes to listing facts.

The machine-readable inventory contains dimensions, byte sizes, hashes, duplicate flags and generated derivative metadata; it intentionally omits GPS coordinates and private EXIF values.
