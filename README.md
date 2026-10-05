# EZ Livin — 2018 Jeanneau NC 895 Offshore

A dedicated private-owner sales website for **EZ Livin**, offered at **$160,000** in **Carolina Beach, North Carolina**. Production canonical: **https://895forsale.com/**. It combines real owner photographs, owner experience, equipment/service information, a gallery/lightbox, a performance/range calculator, a trip planner and direct inquiries. No dealership or brokerage affiliation is implied.

## Architecture

- Next.js App Router, React, TypeScript and Tailwind CSS; `output: "export"` generates static HTML/assets in `out/`.
- Firebase Hosting serves that export; only `/api/contact` rewrites to the `contact` second-generation HTTPS function in `us-central1`.
- Node.js 22 Functions validate with Zod and send email through Resend. No database, CMS or separate durable inquiry archive is used.
- Sharp generates responsive metadata-stripped WebP photographs and a dedicated JPEG social preview. A normal build uses committed derivatives and does not need the private photo directory.
- Optional lightweight GA4 `gtag` integration and optional Search Console verification. No Firebase browser SDK just for analytics.
- Vitest tests calculator/analytics logic; separate Functions tests cover the contact handler and Hosting configuration.

Sales content renders as crawlable static HTML. Navigation, gallery, contact and calculators use client components. There is no Next.js runtime API or broad Hosting SPA fallback.

## Requirements, installation and local development

Use **Node.js 22 LTS** for parity with Functions. The frontend package accepts Node 22–24. Use npm and committed lockfiles.

```sh
npm ci
npm --prefix functions ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Blank environment values are supported. The Next.js dev server does not implement `/api/contact`; use the Firebase Hosting emulator for contact integration. Missing mail configuration does not crash the site.

Frontend build-time configuration:

```dotenv
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

These are public configuration, not secrets. Restart development after changes; rebuild/redeploy for production.

## Repository and editing guide

| Location | Purpose |
| --- | --- |
| `src/app/` | Static pages, metadata and SEO routes |
| `src/components/` | Sales sections and interactive controls |
| `src/data/boat.ts` | Authoritative listing, equipment, services, extras, FAQ and production URL |
| `src/data/performance.ts` | Official Yamaha model-reference points, profiles and provenance |
| `src/data/photos.ts` | Generated typed gallery, hero and editorial photos |
| `src/lib/performance.ts` | Pure conversions, interpolation, range and trip functions |
| `src/lib/analytics.ts` | Typed GA4 events and property allowlist |
| `functions/src/` | Contact validation and secret-bound HTTPS entry point |
| `scripts/process-photos.mjs` | Original-preserving photo pipeline and OG generation |
| `public/images/boat/`, `public/images/og/` | Optimized public assets |
| `firebase.json` | Hosting output, exact rewrite, headers and emulator ports |
| `.firebaserc.example` | Example mapping; actual `.firebaserc` is ignored |
| `docs/` | Private source verification, inventory, backend notes and completion matrix |

Only `out/` is Hosting content. Do not copy `docs`, historical surveys, credentials or original photos into `public`/`out`.

Edit listing values in `src/data/boat.ts`:

| Change | Field |
| --- | --- |
| Asking price in whole USD | `boat.price`, currently `160000` |
| Current approximate engine hours | `boat.engineHours`, currently `400` |
| Fuel capacity in US gallons | `boat.fuelCapacityGallons`, currently `158`; calculators share it |
| Fresh water | `boat.freshWaterGallons`, currently `42` |
| LOA, hull draft, dry weight | `lengthOverall`, `hullDraft`, `dryWeightLbs` |
| Equipment | `equipment`, `generator`, `climate`, `engines` |
| Service | `serviceHistory`; retain owner-supported periods/items |
| Included/excluded items | `includedExtras`, `excludedItems` |
| FAQ | `faqs` in the same module |

After editing, inspect visible copy, FAQ, structured data and metadata together. The OG photo script reads price and identity from the same typed boat object; run `npm run photos` after changing them to regenerate the static social image. Current hours remain **approximately 400**; historical screen/survey readings are not current. The trailer is **not included**. The SANIFLO/Sanimarin toilet and factory roof rack are **uninstalled** extras.

Preserve seller figures until the owner changes them deliberately. `docs/spec-verification.md` records conflicts and owner checks. Do not substitute Series 2 specifications, average conflicting values, invent exact service dates or present a historical survey as a current guarantee.

## Photo processing, adding/removing photos and changing the hero

Originals live in `/Users/zgosling/Pictures/Jeanneau/Pics`: 36 JPEG/JPG stills plus one MOV. Initial gallery: **22 photos**, with 14 stills and the video excluded. The detailed inventory gives each selection/exclusion reason, dimension, source hash and derivative size.

```sh
npm run photos
```

For another source directory:

```sh
node scripts/process-photos.mjs /absolute/path/to/Pics
```

`PHOTO_SOURCE_DIR` is also supported. The script corrects EXIF orientation, strips unnecessary metadata, generates requested widths 480/960/1600/2400 capped to source resolution, and uses true widths in `srcSet`. It hashes all originals before/after processing and never modifies, moves, renames or deletes them. A normal production build does not rerun this pipeline.

To add photos, preserve them in the private source directory, inspect them, then add entries to `selections` in the script with unique ID, accurate category, natural alt text and caption. JPEG/PNG/WebP and HEIC/HEIF are handled when the installed Sharp/libvips can decode them. If a system cannot decode HEIC, export a separate JPEG copy and preserve the HEIC. No HEIC originals were in the initial set.

To remove a photo, remove its selection and regenerate. After checking references, remove only its generated files under `public/images/boat`; retain the original. Regeneration does not delete old derivatives automatically.

Set `heroId` to another selected ID and rerun to change the hero and social source. The script's final `editorialPhotos` mapping controls section photos. Current hero: `DA18D8EE20EE67A1783F0C55B0D60CDF.jpg`, a landscape port profile. Technical views are retained even when less glamorous; no dedicated generator compartment image was supplied.

Below-fold photos are lazy-loaded with responsive sizes and explicit dimensions. Only the hero is preloaded. The gallery initially shows a subset and offers all photos plus keyboard/lightbox controls. Descriptive filenames, accurate alt text and important photos in the image sitemap support image SEO; do not list every thumbnail derivative as a separate sitemap image.

## Open Graph and sharing

`public/images/og/jeanneau-nc895-for-sale-og.jpg` is a verified **1200 × 630** JPEG using the actual hero photograph and restrained sale text. After price/identity changes in the boat object, run `npm run photos`, build and deploy; the overlay reads the same listing facts. Keep the boat dominant and text away from crop edges. Metadata must use its absolute production URL. Platforms cache previews; use their sharing/debugging tools to refresh after publishing.

## Performance sources and updates

`src/data/performance.ts` uses Yamaha’s published model test as the sole performance source. Exact table rows are **published model references**; intermediate RPM values are **interpolated estimates**. Owner observations and dealer tables are excluded from the current performance copy, profiles and calculator fixtures.

All 11 slider points come from the [official Yamaha NC 895 / twin F200XCA bulletin, tested September 18, 2016](https://yamahaoutboards.com/outboards/350-150-hp/in-line-4/f200-(i4)/pb_jea_nc895_t_f200xca_2016-09-18_owa). The default remains its 4,000 RPM efficient planing cruise (26.8 MPH / 14.8 combined GPH / published 1.81 MPG). The **Cruise** profile selects the published 4,500 RPM row: **32.0 MPH / 18.9 combined GPH / 1.69 published statute MPG**. Marked slider points include 1,000 and 1,500 RPM trolling examples, efficient cruise and 5,950 RPM WOT. The low-speed rows have higher overall MPG than the planing rows; these labels are operating examples, not Yamaha recommendations. URLs, caveats and verification dates live with the data.

Source-rounded MPG is displayed and retained for provenance. Calculation MPG is consistently `speedMph / gph`; intermediate speed/GPH are linearly interpolated and MPG recomputed. No extrapolation beyond 1,000–5,950 RPM or invented sound/dBA values. Yamaha’s test boat is not EZ Livin, and its 159-gallon model capacity does not replace the listing’s 158-gallon fuel assumption. Update points/provenance together and rerun focused tests after changes.

## Range and trip planner formulas

Let `C` be tank gallons, `r` reserve fraction, `M` statute MPG, `B` combined GPH, `V` mph and `D` trip NM:

```text
1 nautical mile          = 1.15078 statute miles
speed knots              = V / 1.15078
reserve gallons          = C × r
usable gallons           = C × (1 − r)
range statute miles      = usable gallons × M
range nautical miles     = range statute miles / 1.15078
running hours            = usable gallons / B
trip statute miles       = D × 1.15078
trip hours               = D / speed knots
trip fuel                = trip statute miles / M
total gallons remaining  = C − trip fuel
usable gallons remaining = usable gallons − trip fuel
reserve-protected NM     = max(0, usable gallons remaining × M / 1.15078)
```

Reserve choices are 0/10/15/20%; zero reserve is theoretical range. At the default Yamaha 4,000 RPM point and 10% reserve, the 158-gallon assumption yields **142.2 usable gallons**, approximately **257.5 statute miles / 223.8 NM / 9.61 running hours**. The Yamaha **4,500 RPM Cruise** profile’s 150 NM test fixture uses approximately **172.6 statute miles, 102.0 gallons and 5.39 hours**, leaving **56.0 total gallons, 40.2 gallons above reserve and 59.2 reserve-protected NM**. These are mathematical examples using MPH/GPH, not measured passages.

Plan a cruise offers **Between places** and **Manual distance**. Manual distance accepts a standalone total of **0.1–500 NM**, including any return leg, without selecting destinations. It starts at 50 NM and uses the same Yamaha performance and fuel-reserve calculations. Each mode keeps its distance when switching between them; manual totals are never doubled by the destination planner’s round-trip setting.

The place-to-place planner includes Carolina Beach, Masonboro Island, Figure Eight Island, Southport, Bald Head Island, Beaufort and Ocracoke. `src/data/cruise-routes.ts` contains the named approaches and distance assumptions; `src/lib/cruise-routes.ts` derives routes. The initial trip is Carolina Beach → Masonboro Island. One-way/round-trip and swap controls reset the total distance to the approximate route estimate. Visitors can override the **total** distance (0.1–500 NM), including both legs for a round trip; it is never doubled again. Route assumptions and primary sources are visible in the planner and documented in `docs/cruise-route-sources.md`.

Distances use a disclosed waterway model, not live routing or route clearance. Time assumes steady operation at the selected speed and excludes extra time for no-wake zones and stops. Consumption/time varies with weather, current, load, idling, props and hull condition. Plan fuel conservatively and check current charts and conditions.

## Firebase CLI, login and project selection

Production uses Firebase project `project-3d38501c-9460-4059-821` (Emily Project), with billing enabled, and the separate Hosting site `895forsale`. `firebase.json` explicitly targets that site; the ignored `.firebaserc` maps the production project. Emulator commands explicitly select `demo-895forsale`. See `docs/production-deployment.md` for deployment evidence and outstanding domain/email checks. Normal CLI developer authentication remains supported:

```sh
npm install -g firebase-tools
firebase login
firebase projects:list
```

Replace the example project ID in `.firebaserc` only when deliberately selecting a different project, or select through `firebase use --add`. Actual `.firebaserc` is ignored. Explicit `--project` avoids using another project's default. Review changes before rerunning `firebase init` over the supplied files. The initial deployment used the ignored `service-account.json` through Application Default Credentials; normal signed-in developer deployment also works. Keep credential files private/ignored.

`firebase.json` already uses static `out`, clean URLs, exact `/api/contact` rewrite, Node.js 22 and predeploy Functions lint/build. HTML revalidates; hashed Next assets cache immutably for a year; photos revalidate after a day; API responses use `no-store`. There is no broad SPA fallback.

## Resend and contact email configuration

The local preview cannot send until the owner recipient, verified sender and a real server-only Resend key are configured. Run `npm run contact:check` to inspect local setup safely; it reports missing/invalid/placeholder statuses without showing addresses or keys, and never sends email. For local sending, set the two addresses in the ignored `functions/.env.local` and the key in the ignored `functions/.secret.local`, then restart the emulators. The check only validates configuration format; provider acceptance and inbox delivery need a real test. See [contact setup details](docs/contact-backend.md#read-only-configuration-check-and-local-sending).

Choose the real owner inbox, verify a sending domain in Resend and apply its exact DNS records. Copy `functions/.env.example` to `functions/.env.YOUR_PROJECT_ID` and edit:

```dotenv
CONTACT_TO_EMAIL=your-owner-inbox@example.com
CONTACT_FROM_EMAIL=inquiries@895forsale.com
```

These are server-only non-secret parameters. Sender must be a plain email on a verified Resend domain; display-name mailbox strings are not accepted. Set the restricted sending key through [Firebase Secret Manager](https://firebase.google.com/docs/functions/config-env):

```sh
firebase functions:secrets:set RESEND_API_KEY --project YOUR_PROJECT_ID
```

Enter the key interactively. Never put it in frontend `NEXT_PUBLIC_*` variables, source control or public files. It is bound only to the contact function; redeploy after changing it.

The handler accepts POST/JSON only, validates input lengths/contact preferences, caps bodies at 16 KiB, checks honeypot, 3-second minimum form age and browser origin, and escapes email HTML. Buyer email becomes Reply-To. Unchanged inquiry retries reuse their UUID/Resend idempotency key; editing creates a new key. Basic controls can be spoofed and are not distributed per-user rate limiting.

Success means **Resend accepted the email**, not verified inbox delivery. Inspect Resend delivery/bounce events and test a real inquiry after configuration. There is no durable archive or delivery webhook. See `docs/contact-backend.md` for exact limits and delivery semantics.

## Firebase emulators and contact verification

```sh
npm run emulators
```

This builds the site/function and starts demo project `demo-895forsale`. Open `http://127.0.0.1:5002`; Functions uses port 5001. It exercises the static site and real Hosting contact rewrite without selecting production. Keep production secrets out of emulator checks. If needed, ignored `functions/.secret.local` can contain `RESEND_API_KEY=emulator-placeholder`; leave both contact address parameters blank for no-send checks.

Automated no-send integration:

```sh
npm run build
npm run functions:build
firebase emulators:exec --only hosting,functions --project demo-895forsale 'npm --prefix functions run test:emulator'
```

This checks rewrite/validation/configuration failure behavior. Functions unit tests inject a mocked mailer to test accepted submissions without sending email. A configured real-email test is a separate owner-authorized delivery verification.

## Google Analytics 4

Create a GA4 web stream for the canonical domain, put its `G-...` ID in `NEXT_PUBLIC_GA_MEASUREMENT_ID`, rebuild and deploy. Missing/invalid ID disables initialization. Disable GA4 Enhanced Measurement form interactions in the stream settings to keep automatic form events outside the custom event contract. The config disables Google Signals and ad-personalization signals. Check Realtime/DebugView during an approved verification session.

Typed events cover contact CTA/form lifecycle, gallery, viewed sections, settled calculator/profile/reserve/RPM interactions and trip planning. Properties are allowlisted safe IDs/enums and distance bands. Never pass names, emails, phone, messages, free text or address. `contact_form_success` can be a key event, but represents provider acceptance. A supported `social_share_click` event does not imply a sharing widget exists. Review privacy copy and applicable seller consent requirements before enabling optional production analytics.

## Search Console, DNS verification and sitemap

After production deployment:

1. Create a Search Console **Domain property** for `895forsale.com`.
2. Add its supplied DNS TXT record, verify ownership and retain the record.
3. Submit `https://895forsale.com/sitemap.xml`.
4. Inspect the canonical homepage, verify canonical behavior and request indexing.
5. Check robots, image crawling, metadata and visible Product/Offer data.
6. Monitor indexed URLs, canonical selection and search/image queries.

Optional `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` emits the verification meta token when configured; DNS verification of a Domain property does not require it. It is useful for the applicable URL-prefix method. Rebuild after setting it. Keep canonical apex URLs in metadata, social tags, sitemap and structured data. Do not add fake reviews/ratings or dealership schema. Indexing/rich-result appearance must be checked live, not inferred from a build.

## Deploying and connecting 895forsale.com / www

The Hosting project/site and Cloudflare domain bindings are configured. The inquiry recipient is configured in the ignored production Functions environment; the Resend key is in Secret Manager. Sender verification, DNS/TLS status and observed release checks are tracked in `docs/production-deployment.md`. Run the checks below before subsequent releases, then:

```sh
npm run build
npm run functions:build
firebase deploy --only hosting,functions:contact --project project-3d38501c-9460-4059-821
```

Or use `npm run deploy` with a reviewed default `.firebaserc`. Functions predeploy runs its own lint/build. Keep the previous Hosting release available for rollback.

In the [Firebase custom-domain wizard](https://firebase.google.com/docs/hosting/custom-domain), add `895forsale.com` and apply the exact supplied ownership/Hosting DNS records. Add `www.895forsale.com` using its redirect option pointing to the apex. Do not guess DNS IPs or replace mail records. Wait for DNS/TLS provisioning and verify apex HTTPS, www redirect, static pages, metadata and real contact delivery before sharing.

### Preview and alternate-host indexing gate

Production allows normal crawling. A canonical tag alone **does not guarantee** Firebase default/preview hosts cannot be indexed. Static Hosting headers match paths, not Host names; a global noindex would also affect the canonical site.

Use a separate staging configuration/site or project with `X-Robots-Tag: noindex, nofollow` for all paths when publishing previews. Copy/review the config, add the header and deploy with explicit `--config`/`--project`; retain the API rewrite if backend testing is needed. Verify the resulting header. Do not deploy that staging noindex config to canonical production.

Strict prevention of indexing production's auto-provisioned `web.app`/`firebaseapp.com` hosts still needs a verified hostname-aware redirect/restriction arrangement. Supplied static `firebase.json` has no hostname condition implementing this. Treat it as an unresolved production gate; avoid public links/sitemap submissions for alternate hosts. Local success does not establish live domain or indexing behavior.

## Lint, typecheck, tests and production build

```sh
npm run lint
npm run typecheck
npm test
npm --prefix functions run lint
npm --prefix functions run typecheck
npm run functions:test
npm run build
npm run functions:build
npm run verify:export
```

See the latest completion matrix/final handoff for observed results; this command list does not claim future changes pass. Review at 375/390/430/768/1024/1440px and large desktop: overflow, hero, menu, every gallery image, lightbox arrows/Escape/focus/touch, calculator/reserve/trip outputs, specs, service and contact validation/loading/error states.

Verify frontend output has no secrets/private survey data; image metadata has no GPS/EXIF; canonical/OG URLs are absolute; sitemap/robots are valid; optional tokens only appear when configured. Measured Lighthouse/Core Web Vitals require a recorded audit; static architecture alone does not prove a 90+ score. Repeat after live domain/analytics setup. Separate local functional results, provider acceptance, inbox delivery and deployment verification.

## Owner setup and useful next improvements

- Review the configured Firebase project, billing and explicit Hosting site before future deployments.
- Configure owner inbox, verified sender and Secret Manager API key.
- Connect apex/www DNS; verify redirects and TLS.
- Add GA4 and Search Console configuration as desired.
- Resolve specification checks in `docs/spec-verification.md` before changing seller figures.
- Verify real inbox delivery and monitor Resend events.
- Complete alternate-host indexing control and live performance audit.
- Add current generator/cockpit photographs or owner-confirmed records if available.
- If warranted by traffic/spam, add managed bot protection/rate limiting; add a deliberate durable archive/delivery tracking only if inquiry retention becomes necessary.

The original photos and historical surveys remain outside the public site. Never make an old survey valuation into the current asking price or imply historical condition guarantees present condition.
