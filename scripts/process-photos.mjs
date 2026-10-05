import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Only generated files are written. Source photos are never modified, moved or renamed.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.resolve(
  process.argv[2] ??
    process.env.PHOTO_SOURCE_DIR ??
    "/Users/zgosling/Pictures/Jeanneau/Pics",
);
const outputDirectory = path.join(root, "public/images/boat");
const heroId = "port-profile";
const ogFilename = "jeanneau-nc895-for-sale-og.jpg";
const requestedWidths = [480, 960, 1600, 2400];

// Curated after inspecting the actual owner photos. Edit this list to add/remove a gallery photo.
const selections = [
  [
    "DA18D8EE20EE67A1783F0C55B0D60CDF.jpg",
    "port-profile",
    "Exterior",
    "Port exterior profile of the 2018 Jeanneau NC 895 EZ Livin at anchor",
    "EZ Livin at anchor",
  ],
  [
    "0AF73F6752FC95BB51574A0FF9F09DD3.jpg",
    "starboard-profile",
    "Exterior",
    "Starboard exterior profile of EZ Livin beside a sandy shoreline",
    "Starboard profile",
  ],
  [
    "53748D47C7656DC2A085A09F38B9BA0A.jpg",
    "bow-overhead",
    "Exterior",
    "Elevated view of EZ Livin showing the bow, deck rails and pilothouse roof",
    "Bow and pilothouse roof",
  ],
  [
    "BBE74D8D7AAD897B0603F49BBE35B9DC.jpg",
    "bow-view",
    "Exterior",
    "View toward the bow of EZ Livin showing the forward windshield and deck rails",
    "Forward exterior view",
  ],
  [
    "8036D2DC306EF5C5C9534C3FD49518B3.jpg",
    "stern-twin-yamaha",
    "Exterior",
    "Stern view of EZ Livin showing twin Yamaha 200 outboards, swim platforms and shaded cockpit",
    "Twin Yamaha 200s and aft cockpit",
  ],
  [
    "CFF756CB0EDF871B93D0D401DD71B550.jpg",
    "shoreline-aerial",
    "Exterior",
    "Aerial view of EZ Livin anchored beside a sandbar",
    "A day on the water",
  ],
  [
    "IMG_8953.jpg",
    "salon-galley",
    "Interior",
    "Bright pilothouse of EZ Livin with salon seating, galley and panoramic windows",
    "A bright, practical pilothouse",
  ],
  [
    "IMG_8941.jpg",
    "salon-dinette",
    "Interior",
    "Salon dinette with wood table, bench seating and sliding aft glass door",
    "Salon dinette",
  ],
  [
    "IMG_8964.jpg",
    "salon-aft-view",
    "Interior",
    "View aft through the salon showing the dinette and sliding cockpit door",
    "Salon and aft glass door",
  ],
  [
    "IMG_8947.jpg",
    "galley-sink-cooktop",
    "Interior",
    "Galley with stainless sink, two-burner cooktop and refrigerator below",
    "Galley sink, cooktop and refrigerator",
  ],
  [
    "IMG_8988.jpg",
    "galley-microwave",
    "Interior",
    "Microwave installed below the wood galley counter aboard EZ Livin",
    "Galley microwave",
  ],
  [
    "IMG_8950.jpg",
    "pilothouse-windshield-roof",
    "Interior",
    "Forward view from the pilothouse showing the windshield, helm and overhead opening hatches",
    "Visibility and overhead light",
  ],
  [
    "IMG_8962.jpg",
    "helm-lowrance-hds9",
    "Helm & systems",
    "Helm with Lowrance HDS9 display, Yamaha instrument screen, VHF and twin digital controls",
    "Lowrance navigation and Yamaha controls",
  ],
  [
    "IMG_8958.jpg",
    "helm-seat-side-door",
    "Helm & systems",
    "Adjustable helm seat beside the starboard sliding pilothouse door",
    "Helm seat and starboard side door",
  ],
  [
    "IMG_8987.jpg",
    "climate-control",
    "Helm & systems",
    "Digital marine climate control panel mounted in the salon",
    "Marine climate controls",
  ],
  [
    "IMG_8982.jpg",
    "forward-cabin",
    "Cabins & head",
    "Forward private cabin with double berth, hull windows and wood storage lockers",
    "Forward private cabin",
  ],
  [
    "IMG_8977.jpg",
    "forward-cabin-aft-view",
    "Cabins & head",
    "View aft from the forward berth toward the private cabin door and hanging locker",
    "Forward cabin storage and access",
  ],
  [
    "IMG_8986.jpg",
    "second-cabin",
    "Cabins & head",
    "Lower second cabin berth with reading lights, wood trim and cushions",
    "Second private cabin",
  ],
  [
    "IMG_8985.jpg",
    "second-cabin-entry",
    "Cabins & head",
    "Entrance to the second cabin showing the berth and hull window",
    "Second cabin access",
  ],
  [
    "IMG_8970.jpg",
    "enclosed-head",
    "Cabins & head",
    "Enclosed head with installed marine toilet, basin, wood vanity and opening port",
    "Enclosed head",
  ],
  [
    "IMG_8967.jpg",
    "head-shower",
    "Cabins & head",
    "Handheld shower fitting and basin inside the enclosed head",
    "Shower in the enclosed head",
  ],
  [
    "Ocracoke.jpg",
    "beach-cruising",
    "Exterior",
    "EZ Livin anchored by a beach with other boats and people at the shoreline",
    "Real days aboard EZ Livin",
  ],
].map(([originalFilename, id, category, alt, caption]) => ({
  originalFilename,
  id,
  category,
  alt,
  caption,
}));

const excludedReasons = {
  "Hours.jpeg":
    "Historical engine-hour screen (roughly 300 hours); does not represent the current owner-stated approximately 400 hours.",
  "IMG_8942.jpg": "Near-duplicate dinette angle; IMG_8941.jpg selected.",
  "IMG_8945.jpg":
    "Redundant helm-seat close-up; IMG_8958.jpg shows the seat and useful side-door context.",
  "IMG_8949.jpg":
    "Near-duplicate forward pilothouse angle; IMG_8950.jpg has clearer roof-hatch context.",
  "IMG_8955.jpg":
    "Near-duplicate salon/galley angle; wider landscape IMG_8953.jpg selected.",
  "IMG_8961.jpg":
    "Redundant helm-seat angle; IMG_8958.jpg and IMG_8962.jpg cover the seat, door and instruments.",
  "IMG_8963.jpg":
    "Redundant forward companion-area angle covered by wider pilothouse views.",
  "IMG_8969.jpg":
    "Near-duplicate head angle; IMG_8970.jpg shows the fixtures more clearly.",
  "IMG_8976.jpg":
    "Partial forward-cabin doorway angle; complete berth and doorway views selected.",
  "IMG_8981.jpg":
    "Near-duplicate forward berth; wider landscape IMG_8982.jpg selected.",
  "IMG_9030.JPG":
    "Lower-resolution furnished forward-cabin repeat (896px wide); detailed higher-resolution cabin images selected.",
  "IMG_9031.JPG":
    "Lower-resolution furnished second-cabin repeat (896px wide); higher-resolution cabin images selected.",
  "IMG_9032.JPG":
    "Lower-resolution head repeat (896px wide); higher-resolution head images selected.",
  "IMG_9033.JPG":
    "Lower-resolution furnished dinette repeat (1195px wide); higher-resolution salon images selected.",
  "My Movie 2.mov":
    "Owner video preserved at source; excluded from the static still-photo gallery and initial page load.",
};

const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
const sourceNames = (await readdir(sourceDirectory))
  .filter((name) => !name.startsWith("."))
  .sort();
const inventory = [];
const hashes = new Map();
for (const filename of sourceNames) {
  const sourcePath = path.join(sourceDirectory, filename);
  const sourceStat = await stat(sourcePath);
  if (!sourceStat.isFile()) continue;
  const bytes = await readFile(sourcePath);
  const sha256 = digest(bytes);
  const selected = selections.find(
    (selection) => selection.originalFilename === filename,
  );
  const entry = {
    filename,
    bytes: sourceStat.size,
    sha256,
    selected: !!selected,
    reason: selected
      ? "Selected for useful distinct coverage."
      : (excludedReasons[filename] ??
        "Not selected; inspect before publishing."),
    exactDuplicateOf: hashes.get(sha256) ?? null,
  };
  hashes.set(sha256, filename);
  if (/\.(jpe?g|png|webp|heic|heif)$/i.test(filename)) {
    const metadata = await sharp(bytes).metadata();
    const oriented = metadata.autoOrient ?? {
      width: metadata.width,
      height: metadata.height,
    };
    Object.assign(entry, {
      format: metadata.format,
      width: oriented.width,
      height: oriented.height,
      rawWidth: metadata.width,
      rawHeight: metadata.height,
      orientation: metadata.orientation ?? 1,
      containsExif: !!metadata.exif,
    });
  } else {
    entry.format = path.extname(filename).slice(1).toLowerCase();
  }
  inventory.push(entry);
}

await mkdir(outputDirectory, { recursive: true });
await mkdir(path.join(root, "public/images/og"), { recursive: true });
await mkdir(path.join(root, "src/data"), { recursive: true });
await mkdir(path.join(root, "docs"), { recursive: true });
const photos = [];
let derivativeBytes = 0;
let derivativeCount = 0;
for (const selection of selections) {
  const sourceEntry = inventory.find(
    (entry) => entry.filename === selection.originalFilename,
  );
  if (!sourceEntry?.width)
    throw new Error(
      `Missing or unsupported selected image: ${selection.originalFilename}`,
    );
  const sourcePath = path.join(sourceDirectory, selection.originalFilename);
  const prefix = `2018-jeanneau-nc-895-ez-livin-${selection.id}`;
  const variants = [];
  const generatedWidths = new Set();
  for (const requestedWidth of requestedWidths) {
    const actualWidth = Math.min(requestedWidth, sourceEntry.width);
    if (generatedWidths.has(actualWidth)) continue;
    generatedWidths.add(actualWidth);
    const filename = `${prefix}-${requestedWidth}.webp`;
    const result = await sharp(sourcePath)
      .rotate()
      .resize({ width: requestedWidth, withoutEnlargement: true })
      .webp({ quality: requestedWidth <= 960 ? 78 : 84, effort: 5 })
      .toFile(path.join(outputDirectory, filename));
    const meta = await sharp(path.join(outputDirectory, filename)).metadata();
    if (meta.exif || meta.xmp || meta.iptc || meta.orientation || meta.icc)
      throw new Error(`Private metadata retained: ${filename}`);
    variants.push({
      src: `/images/boat/${filename}`,
      width: result.width,
      height: result.height,
      bytes: result.size,
    });
    derivativeBytes += result.size;
    derivativeCount++;
  }
  const display =
    variants.find((variant) => variant.src.endsWith("-1600.webp")) ??
    variants.at(-1);
  photos.push({
    id: selection.id,
    src: display.src,
    srcSet: variants
      .map((variant) => `${variant.src} ${variant.width}w`)
      .join(", "),
    width: display.width,
    height: display.height,
    alt: selection.alt,
    caption: selection.caption,
    category: selection.category,
    originalFilename: selection.originalFilename,
  });
  sourceEntry.derivatives = variants;
}

const hero = selections.find((selection) => selection.id === heroId);
if (!hero) throw new Error("Hero must be a selected gallery photo.");
// Deliberately controlled 1200 × 630 social card. Owner photograph occupies most of the card.
// Read the authoritative typed listing through Node 22 native TypeScript support.
const { boat, priceFormatted } = await import("../src/data/boat.ts");
const xmlText = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );
const ogOverlay =
  Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="176" fill="#0c2531" fill-opacity="0.94"/>
  <rect y="574" width="1200" height="56" fill="#0c2531" fill-opacity="0.96"/>
  <text x="54" y="57" fill="#c5d8dc" font-family="Arial, sans-serif" font-size="18" letter-spacing="3">PRIVATE SALE BY OWNER</text>
  <text x="52" y="112" fill="#ffffff" font-family="Georgia, serif" font-size="46">${xmlText(`${boat.year} ${boat.make} NC 895`)}</text>
  <text x="55" y="148" fill="#e6eeed" font-family="Arial, sans-serif" font-size="22">${xmlText(`${boat.vesselName} · ${boat.shortLocation}`)}</text>
  <text x="1146" y="112" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-size="34">${xmlText(priceFormatted)}</text>
  <text x="54" y="610" fill="#ffffff" font-family="Arial, sans-serif" font-size="21">895ForSale.com</text>
  <text x="1146" y="610" text-anchor="end" fill="#c5d8dc" font-family="Arial, sans-serif" font-size="17">Twin Yamaha ${boat.engines.hpEach}s · Generator · A/C · Bow Thruster</text>
</svg>`);
const ogPath = path.join(root, "public/images/og", ogFilename);
await sharp(path.join(sourceDirectory, hero.originalFilename))
  .rotate()
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .composite([{ input: ogOverlay }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(ogPath);
const ogMetadata = await sharp(ogPath).metadata();
if (
  ogMetadata.width !== 1200 ||
  ogMetadata.height !== 630 ||
  ogMetadata.exif ||
  ogMetadata.xmp ||
  ogMetadata.iptc
)
  throw new Error("OG dimensions or metadata verification failed.");

// Final preservation verification is independent of derivative processing.
for (const entry of inventory) {
  if (
    digest(await readFile(path.join(sourceDirectory, entry.filename))) !==
    entry.sha256
  )
    throw new Error(`Original changed unexpectedly: ${entry.filename}`);
}
const summary = {
  sourceDirectory,
  stillPhotoCount: inventory.filter((entry) => entry.width).length,
  videoCount: inventory.filter((entry) => entry.format === "mov").length,
  selectedPhotoCount: photos.length,
  excludedStillCount: inventory.filter(
    (entry) => entry.width && !entry.selected,
  ).length,
  exactDuplicateCount: inventory.filter((entry) => entry.exactDuplicateOf)
    .length,
  heroId,
  heroOriginalFilename: hero.originalFilename,
  ogSourceFilename: hero.originalFilename,
  ogPublicPath: `/images/og/${ogFilename}`,
  derivativeCount,
  derivativeBytes,
  originalsVerifiedUnchanged: true,
  publicMetadataVerifiedStripped: true,
  entries: inventory,
};
await writeFile(
  path.join(root, "docs/photo-inventory.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);
const ts = `// Generated by scripts/process-photos.mjs. Edit its curated selections, then re-run npm run photos.\nexport type BoatPhoto = {\n  id: string;\n  src: string;\n  srcSet: string;\n  width: number;\n  height: number;\n  alt: string;\n  caption: string;\n  category: string;\n  originalFilename: string;\n};\n\nexport const photos: BoatPhoto[] = ${JSON.stringify(photos, null, 2)};\n\nexport const heroPhoto = photos.find((photo) => photo.id === ${JSON.stringify(heroId)})!;\n\nexport const editorialPhotos = {\n  owner: photos.find((photo) => photo.id === 'beach-cruising')!,\n  interior: photos.find((photo) => photo.id === 'salon-galley')!,\n  cabin: photos.find((photo) => photo.id === 'forward-cabin')!,\n  helm: photos.find((photo) => photo.id === 'helm-lowrance-hds9')!,\n  engines: photos.find((photo) => photo.id === 'stern-twin-yamaha')!,\n  cockpit: photos.find((photo) => photo.id === 'stern-twin-yamaha')!,\n};\n`;
await writeFile(path.join(root, "src/data/photos.ts"), ts);
const excludedRows = inventory
  .filter((entry) => !entry.selected)
  .map((entry) => `| ${entry.filename} | ${entry.reason} |`)
  .join("\n");
const selectedRows = photos
  .map(
    (photo) =>
      `| ${photo.originalFilename} | ${photo.id} | ${photo.category} | ${photo.caption} |`,
  )
  .join("\n");
await writeFile(
  path.join(root, "docs/photo-inventory.md"),
  `# Owner photo inventory and curation\n\nSource: \`${sourceDirectory}\`. Inspected all still photographs in a contact sheet and individually checked the hero, cabins, helm, systems and owner photo. All ${inventory.length} originals were hashed before and after processing and remain unchanged. No source files were moved, renamed or edited.\n\n- ${summary.stillPhotoCount} JPEG/JPG still photos and ${summary.videoCount} MOV video; no PNG, HEIC, HEIF or WebP originals in this source set.\n- ${summary.selectedPhotoCount} gallery photos; ${summary.excludedStillCount} stills excluded. No exact byte-identical duplicates. Near-duplicates were assessed visually.\n- Hero: \`${hero.originalFilename}\` → \`${photos.find((photo) => photo.id === heroId).src}\`. Broadside port profile, landscape, ${inventory.find((entry) => entry.filename === hero.originalFilename).width} × ${inventory.find((entry) => entry.filename === hero.originalFilename).height} source pixels.\n- Social preview: actual hero photograph → \`/images/og/${ogFilename}\`, verified 1200 × 630 JPEG.\n- The technical/detail images include galley equipment, shower, installed head, helm controls, marine A/C controller and cabin layout. There is no dedicated generator compartment photograph in the supplied set. The stern aerial supplies the real engines/cockpit/swim-platform view.\n- Most originals are 2048 × 1536 or 1536 × 2048; six aerials are 2048/2050 × 1536, four furnished repeats are 896/1195px wide, and the beach photo is 4000 × 3000. \`Hours.jpeg\` is a 3024 × 4032 portrait after correcting EXIF orientation 6.\n\n## Public derivative handling\n\nThe pipeline corrects EXIF orientation, removes EXIF/XMP/IPTC/ICC metadata, produces WebP at requested widths 480/960/1600/2400, and caps output to source resolution. Filename suffixes express the requested size; each generated \`srcSet\` uses the true decoded width. A 1536px portrait is never upscaled to 1600px and has no redundant 2400 derivative. A 2048px landscape's \`-2400.webp\` is capped at 2048px. The full beach photo has a 2400px derivative. Every output was decoded and checked for dimensions and unwanted metadata. Generated ${derivativeCount} WebP files totaling ${(derivativeBytes / 1024 / 1024).toFixed(2)} MiB. Originals are not shipped publicly.\n\nThumbnails should use \`srcSet\`, responsive \`sizes\` (about 480px for a gallery tile), explicit width/height and lazy loading. The hero alone should be preloaded. The lightbox can use the same \`srcSet\` with viewport-based sizes to obtain the largest useful derivative. Descriptive filenames, accurate alt text and captions are generated with the typed gallery data.\n\n## Selected photos\n\n| Original | Photo ID | Category | Caption |\n| --- | --- | --- | --- |\n${selectedRows}\n\n## Excluded photos/video\n\nExclusions preserve their originals. Furnished repeats were excluded for resolution/coverage, not interpreted as a different or current equipment specification. The historical engine screen is excluded to avoid presenting historical readings as current hours.\n\n| Original | Reason |\n| --- | --- |\n${excludedRows}\n\n## Reprocessing and updates\n\nRun \`npm run photos\`, or \`node scripts/process-photos.mjs /absolute/path/to/Pics\`. The optional \`PHOTO_SOURCE_DIR\` environment variable can replace the default path. Edit \`selections\` to add/remove photos or improve alt text; edit \`heroId\` to change the hero and social-preview photograph. Regeneration writes \`src/data/photos.ts\` and both inventory files. It never deletes source files. Removed-photo public files may be removed manually from \`public/images/boat\` after confirming that they are generated files and no longer referenced. The OG overlay reads listing facts from src/data/boat.ts; regenerate after edits.\n\nThe machine-readable inventory contains dimensions, byte sizes, hashes, duplicate flags and generated derivative metadata; it intentionally omits GPS coordinates and private EXIF values.\n`,
);
console.log(
  `Curated ${photos.length}/${summary.stillPhotoCount} stills. Generated ${derivativeCount} WebP derivatives (${(derivativeBytes / 1024 / 1024).toFixed(2)} MiB) and 1200x630 OG JPEG. Originals unchanged; public metadata stripped.`,
);
