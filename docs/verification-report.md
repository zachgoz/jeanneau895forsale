# Implementation and verification report

## October 4, 2026 contact-form failure — configuration required

The reported preview submission reached Firebase Hosting's `/api/contact` rewrite and the Functions handler, which returned 503 with a configuration error. Both local `CONTACT_*` addresses were blank (including a quoted empty recipient), and `RESEND_API_KEY` was the emulator placeholder. The handler could not send email with those settings. No real message was sent by the checks below.

The local emulator now identifies incomplete email setup with `EMAIL_NOT_CONFIGURED`; the form explains that delivery is not configured, preserves the fields and permits retry after setup. Production failures remain generic. Missing/placeholder keys are treated as setup failures before attempting the mail provider. Success still requires a real provider acceptance identifier; the test-only mock preview is not a delivery solution.

| Layer | Current result |
| --- | --- |
| Frontend regression | 44 tests, lint, TypeScript, static production build and export/secret checks passed |
| Handler checks | 46 focused contact-handler tests passed, including local-only setup identification, generic production responses and missing-secret rejection before sending |
| Complete Functions regression | 70 tests passed, including 20 configuration-doctor tests; lint and TypeScript passed |
| Configuration doctor | `npm run contact:check` exits 1 as expected: both addresses missing, key placeholder and secret ignored by Git. Outputs fixed statuses only; no mutation or provider calls |
| Functions types / build | Passed |
| Actual Hosting rewrite | No-send smoke checks passed: 405, 415, 400, explicit local setup 503 and missing API 404 |
| Browser feedback | Actual 5002 form shows the setup-specific error; name, email and message remain populated; button returns to enabled state and no success is shown |
| Real delivery | Pending owner recipient, verified sending address and real server-only key; provider acceptance, inbox delivery and production deployment are unverified |

## October 4, 2026 manual distance option — verified locally

Plan a cruise now offers **Between places** and **Manual distance**. Manual mode accepts a total trip distance of **0.1–500 NM**, including any return leg, without destination selection. It uses the same selected Yamaha performance point and fuel reserve. Manual entries and route overrides are preserved independently when switching modes; a saved round-trip route does not double a manual total.

| Layer | Current result |
| --- | --- |
| Frontend verification | 44 tests, root lint, TypeScript, production static build and export verification passed; export checks assert both planning modes |
| Manual estimates | At 4,000 RPM / 10% reserve, 50 NM shows 2 hr 9 min, 31.8 gallons required, 126.2 total gallons remaining and 173.8 reserve-protected NM; selecting Yamaha Cruise / 20% reserve updates to 1 hr 48 min, 34.0 gallons and 136.0 reserve-protected NM |
| Mode preservation | Browser checks retain a 42.5 NM round-trip route override separately from manual 50 NM, then 17.5 NM; destination controls are absent in manual mode |
| Input validation | Blank, 0 and 500.1 show validation with no estimate; 0.1 and 500 are accepted; 500 shows the full-tank fuel shortfall |
| Keyboard / mobile | Mode change preserves focus; Tab from Manual distance reaches the decimal distance field; buttons have 44 px touch targets; no horizontal overflow at 375 or 390 px; 390 px screenshot reviewed |
| Unchanged layers | Backend and broader original-site checks were not repeated; their dated results remain below. No deployment or real email sent |

Screenshot: `docs/screenshots/cruise-planner-manual-mobile.jpg`. Yamaha data, route assumptions and external configuration gates remain as documented below.

## October 4, 2026 Yamaha-only amendment — verified locally

Current performance data, descriptions, profiles and calculation fixtures use only the September 18, 2016 Yamaha NC 895 / twin F200XCA and LF200XCA bulletin. Owner-observed comparisons and first-person performance claims are removed. All 11 official rows remain unchanged. **Cruise** selects the published **4,500 RPM / 32.0 MPH / 18.9 combined GPH / 1.69 statute MPG** row; the default remains **4,000 RPM efficient planing cruise**. Listing fuel capacity remains **158 gallons**, and the original two-week ICW trip narrative is retained.

This section records checks performed for the amendment. Unchanged backend and broader original-site checks were not repeated; their earlier results remain dated baseline evidence below.

| Layer | Current result |
| --- | --- |
| Primary performance source | All 11 rows and bulletin provenance retained; documented table matches current source |
| Frontend tests | 44 passed: official rows/profiles, interpolation, Yamaha-only range/trip fixtures, routes and analytics privacy |
| Backend regression | Backend unchanged and not rerun for this amendment; 48 passing Functions/Hosting tests remain dated baseline evidence |
| Lint / types | Root lint and TypeScript checks passed; Functions lint/build not rerun because backend is unchanged |
| Production export | Static build and export verification passed, including absence of owner-performance claims/profiles in HTML and JavaScript bundles; narrative assertion confirms Yamaha attribution and 4,500 RPM / 32.0 MPH / 1.69 MPG |
| Cruise profile / slider browser | Cruise shows 4,500 RPM, 32.0 MPH, 1.69 published MPG and 18.9 combined GPH; Home reaches 1,000 and End then ArrowLeft reaches interpolated 5,900; published/interpolated labels are correct; owner comparison absent from visible copy/disclosure |
| Announcements / analytics | Current unit tests cover analytics privacy and source values; focused browser source updates checked; full announcement cadence/duplicate-event interaction checks were not repeated |
| Route browser | Changing to Yamaha Cruise updates the initial Carolina Beach–Masonboro trip to approximately 3.6 NM / 2.4 gallons; round trip shows 7.2 NM; Use Route Estimate resets a manual override to 3.6 NM; unchanged model passes all-pair/reverse/round-trip tests |
| Validation / reserves | Current unit tests cover Yamaha-only range/trip fixtures and reserve/shortfall logic; Cruise at 10% reserve shows approximately 241 statute miles / 209 NM / 7.5 hours; the default 4,000 RPM 150 NM browser example shows 95.3 gallons, 6 hr 26 min, 62.7 total gallons left and 73.8 reserve-protected NM |
| Responsive geometry | 375, 390 and 1440 px: no horizontal overflow; observed controls 53/61 px high; focused phone/desktop visuals reviewed; 390 px has the Cruise/Fast Cruise shortcuts and no owner-performance UI |

The default Yamaha point displays 26.8 MPH, 1.81 published MPG and 14.8 combined GPH. Calculations use speed/GPH for consistent fuel/time math. With 10% reserve, 158 gallons yields about 257.5 statute miles / 223.8 NM / 9.61 hours. The 150 NM test at the 4,500 RPM Cruise point requires about 102.0 gallons and 5.39 hours, leaving 56.0 total gallons, 40.2 gallons above reserve and 59.2 reserve-protected NM. These Yamaha-only mathematical fixtures passed the current tests. The full slider is 1,000–5,950 RPM in 50 RPM steps, with no extrapolation. Trolling labels describe low-speed examples; 4,000 is the most efficient planing row, while 1,000 has higher overall MPG.

The seven destinations are Carolina Beach, southern Masonboro Island, Figure Eight Island bridge approach, Southport, Bald Head Island marina approach, Beaufort and Ocracoke. Distances combine NOAA ICW statute-mile stations / rounded inside-port distances and explicit modeled access legs. They are editable planning estimates, not measured vessel tracks or navigational guidance. The UI exposes endpoint definitions, leg assumptions and primary-source links. Total distance accepts 0.1–500 NM; changing a route or trip type clears a manual override. Running time assumes steady selected speed and excludes no-wake/bridge/stop delays, weather and extra generator fuel.

Source details: `docs/performance-sources.md` and `docs/cruise-route-sources.md`. Current `docs/screenshots/performance-yamaha.jpg` (1,440 px desktop) and `performance-yamaha-mobile.jpg` (390 px phone) show the Yamaha-only UI. The October 3 previews below are historical images from the original checks. No production deployment or new real-email verification was performed; existing external configuration gates remain.

## October 3, 2026 original site handoff — historical record

The remainder records the original implementation and verification. Its owner-performance profiles and fixtures, calculator default, dealer data, slider range and distance presets were superseded by the October 4 Yamaha-only update above. Historical values below describe the old implementation only; they are not current expectations. Other evidence remains dated to its original verification.

Date: October 3, 2026. Site implemented and verified locally. Production deployment, DNS and real email delivery are not claimed.

### Recorded verification

| Layer | Result |
| --- | --- |
| Clean dependency installation | Root and Functions `npm ci` passed |
| Lint | Root and Functions passed |
| TypeScript | Root and Functions passed |
| Unit tests | 20 frontend tests and 48 Functions/Hosting tests passed; 68 total |
| Production build | Next.js static export passed; Functions compiled for Node 22 |
| Export checks | Canonical, Product/Offer, OG, sitemap/image references, robots, rewrite and private-file/secret-signature checks passed |
| XML | Sitemap parsed successfully, two canonical page URLs and image namespace |
| Firebase emulator | Actual `out` served through Hosting; 405/415/400/503 handling and missing API 404 passed |
| Contact UI | Inline validation, loading/error and retained fields checked against emulator; success checked with an injected local mock mailer, no real email sent |
| Responsive browser | 375, 390, 430, 768, 1024, 1440 and 1920 px: no horizontal overflow; desktop/mobile previews reviewed |
| Gallery | 22-photo expansion, categories, arrows, Escape, focus restoration and focus containment checked; pointer swipe advanced the image |
| Calculator UI | Owner default, published profile, intermediate RPM label, no-reserve label, reserve change, beyond-reserve trip and invalid distance checked |
| Optional configuration | Configured test build emitted Search Console token and GA script/queue; ordinary final build omits both; remote Google calls blocked during the test |
| Analytics privacy | Allowlisted events/properties; free-form PII and unknown identifiers rejected by tests; no inquiry fields passed by components |
| Photography | 82 WebP derivatives and OG decoded/checked; unnecessary metadata absent; all 37 originals hash-verified unchanged |
| Dependency audit | Root and Functions audit: zero reported vulnerabilities, including production-only audits |
| Real device / scored audits | Actual touch-device gesture and Lighthouse/field Core Web Vitals not measured; pointer interaction and responsive geometry are local evidence only |

### Requested handoff

1. **Built:** complete private-owner listing with real photography, interactive gallery, service/equipment detail, source disclosures, contact, SEO/social metadata and calculators. Price remains $160,000; hours remain approximately 400.
2. **Architecture:** Next.js 16.3.8 App Router, React 19.3, TypeScript, Tailwind 4, static `out`; Firebase Hosting; one Node 22 gen-2 contact function; Zod/Resend; no CMS/database/runtime Next API. Central typed `src/data/boat.ts`; separate performance/photo data.
3. **Hero:** original `DA18D8EE20EE67A1783F0C55B0D60CDF.jpg`; public `2018-jeanneau-nc-895-ez-livin-port-profile-1600.webp`, with responsive derivatives.
4. **Gallery:** 22 selected still photos; 82 responsive WebP files. Sources are the owner's actual `/Users/zgosling/Pictures/Jeanneau/Pics` photographs.
5. **Excluded:** `Hours.jpeg` is historical; `IMG_8942.jpg`, `IMG_8945.jpg`, `IMG_8949.jpg`, `IMG_8955.jpg`, `IMG_8961.jpg`, `IMG_8963.jpg`, `IMG_8969.jpg`, `IMG_8976.jpg`, `IMG_8981.jpg`, and `IMG_9030.JPG`–`IMG_9033.JPG` are redundant or lower-resolution views. `My Movie 2.mov` remains unpublished. Exact per-file reasons are in `docs/photo-inventory.md`. No originals changed.
6. **Sections:** overview/hero, quick facts, Why This 895, gallery, owner story, accommodations, performance/range and trip planning, equipment, included extras, specifications, recent service, FAQ, contact, footer, plus privacy page. Power/handling, electronics, generator/climate, galley and deck are explicit equipment groups.
7. **Contact:** browser POST `/api/contact` → Hosting rewrite → gen-2 function → Resend. Validated input, body limit, honeypot/time/origin checks, escaped HTML, Reply-To, generic errors. Same inquiry retry reuses UUID for Resend's 24-hour idempotency. Success confirms provider acceptance, not inbox delivery. No durable inquiry archive or distributed rate limiter.
8. **Firebase files:** `firebase.json`, ignored local `.firebaserc` defaulting to demo project, `.firebaserc.example`, Functions source/config/tests/lockfile and env/secret examples. Hosting port 5002; Functions 5001. No SPA fallback; HTML revalidates, hashed assets cache immutably, API uses no-store.
9. **Owner Firebase setup:** select the actual seller-owned project, enable billing required for gen-2 Functions, set the project mapping and authenticate with normal `firebase login`. No normal service-account key is needed. No production project was created or deployed.
10. **Exact backend configuration:** server-only `CONTACT_TO_EMAIL`, verified plain-address `CONTACT_FROM_EMAIL`, Secret Manager `RESEND_API_KEY`. Put the two addresses in `functions/.env.PROJECT_ID`; set the key interactively with `firebase functions:secrets:set RESEND_API_KEY --project PROJECT_ID`. Frontend secrets are never used.
11. **GA4:** create the canonical-domain web stream, configure `NEXT_PUBLIC_GA_MEASUREMENT_ID`, rebuild and verify Realtime. Disable automatic Enhanced Measurement form interactions. Custom events use safe identifiers, reserve settings and distance bands. Advertising signals disabled; missing ID disables GA.
12. **Search Console:** create Domain property for `895forsale.com`, apply its actual DNS TXT record, verify, submit `https://895forsale.com/sitemap.xml`, inspect canonical/indexing and request homepage indexing. Optional URL-prefix meta verification uses `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
13. **Owner specification checks:** reconcile LOA, beam, weight basis, hull/engine-down draft, installed fuel capacity, freshwater tank and current heat capability. The 2021 survey reports approximately 26 gallons freshwater versus seller 42; keep 42 until owner confirms a change. Current generator hours remain omitted.
14. **Private spec document:** `docs/spec-verification.md` records seller/alternative values, sources, historical context and recommendations. It preserves seller values, distinguishes original generation from Series 2 and excludes private identifiers, survey personal data and historical valuations. PDFs remain private and are not hosted.
15. **Performance provenance:** owner 4,500 RPM/~30 mph/~1.5 MPG observation; verified [Sundance NC 895/twin F200 reference](https://www.sundanceyachts.com/boats-for-sale/jeanneau-nc-895) for the five reference points; separate differing [Yamaha 2016 NC 895 bulletin](https://yamahaoutboards.com/outboards/350-150-hp/in-line-4/f200-(i4)/pb_jea_nc895_t_f200xca_2016-09-18_owa). Dealer reference is not attributed to Yamaha and neither measures EZ Livin. Source-rounded MPG retained; calculation MPG uses speed/burn consistently.
16. **Range:** 4,000–6,000 RPM reference slider, owner profile, linear interpolation, 0/10/15/20% reserve. With owner values and 10% reserve: 142.2 usable gallons, 213.3 miles, approximately 185.4 NM and 7.11 hours. Derived combined burn 20 GPH. No sound/dBA fabrication or extrapolation.
17. **Trip:** 10–500 NM, presets, fuel/time/remaining fuel/reserve-protected range and fit status. At 150 NM: 172.617 miles, 115.078 gal, 5.7539 hours, 42.922 total gal left, 27.122 gal above reserve and 35.3525 NM left, correctly rounded to **35.4 NM** in the UI. Estimates assume full tanks and exclude extra generator fuel use; not navigation software.
18. **Unit tests:** 20 frontend + 48 backend tests, all passed.
19. **Lint:** both projects passed.
20. **Typecheck:** both projects passed.
21. **Production build:** static Next export and Functions build passed. Final export uses unset optional analytics/verification configuration; no test token remains.
22. **OG:** same real hero source; `public/images/og/jeanneau-nc895-for-sale-og.jpg`, 1200×630 JPEG. Photo pipeline reads price/identity from the authoritative boat object; regenerate after changes.
23. **Development:** `npm run dev`; `npm run emulators` provides the complete static frontend + contact rewrite at `http://127.0.0.1:5002`. The Next dev server alone has no contact endpoint.
24. **Deployment:** `npm run build && npm run functions:build`, then `firebase deploy --only hosting,functions --project YOUR_PROJECT_ID`, after configuration. README explains all prerequisites.
25. **Domains:** add `895forsale.com` through Firebase's custom-domain wizard and apply only its supplied DNS records; add `www.895forsale.com` with redirect to apex; verify HTTPS/TLS, redirect and real contact. Production default Firebase/preview host indexing control is not implemented by a canonical tag: a separate noindex staging configuration and verified hostname-aware production control remain necessary for strict alternate-host exclusion.
26. **Next improvements:** complete external configuration and real inbox verification; reconcile owner specs; verify alternate-host redirects/indexing; run live Lighthouse/Core Web Vitals and GA4 checks; add a generator compartment/closer cockpit photograph if available. Add durable retention/delivery tracking or managed spam controls only if needed.

### Publication gates and limits

- Actual Firebase project/billing, Resend verification/key and contact addresses remain unset.
- Custom domains/DNS/TLS, www redirect, default-host indexing restrictions, GA4 property and Search Console ownership are not verified live.
- A real provider acceptance/inbox delivery test remains separate from mocks and no-send emulation.
- No Lighthouse scores or real-device touch results are claimed.
- Local credentials and all original photos/surveys were preserved. Secret and environment ignore rules were checked; examples remain trackable.

Screenshots: `docs/screenshots/desktop.png`, `mobile.png`, `performance.png`. Setup/editing guide: `README.md`.
