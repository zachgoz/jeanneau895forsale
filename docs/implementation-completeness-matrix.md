# Mandatory Implementation Completeness Matrix

## October 4 Firebase production deployment

| Requested deployment work | Implementation status | Observed verification / remaining work |
| --- | --- | --- |
| Use private service account to deploy | Deployed separate Hosting site `895forsale` in project `project-3d38501c-9460-4059-821`; explicit site config and ignored production mapping | Passed: lint/types/tests/build/export scan, live pages/assets/metadata/security/cache/404 and browser calculator/gallery checks |
| Publish contact backend | Deployed ACTIVE Node 22 second-generation function; production parameters and Secret Manager key configured; Resend sender domain verified | Passed: cloud build, function/Hosting release, live method/body/origin rejection and sending-key account/scope match; real inbox delivery remains untested |
| Connect Cloudflare domain | Firebase apex and www bindings created; exact supplied DNS and certificate-validation records applied; www redirect configured | Passed: apex HTTPS and pages/metadata/security; pending www HTTPS provisioning and live redirect verification |

See `docs/production-deployment.md` for exact release evidence and remaining www provisioning and inbox-delivery checks.

## October 4 contact-form troubleshooting

| Requested change | Implementation status | Required verification |
| --- | --- | --- |
| Send contact inquiries | Existing endpoint and Hosting rewrite reach the mail handler; local recipient/sender are blank and the key is a placeholder. Real delivery awaits owner inbox, verified sender and server-only Resend key | Real provider acceptance and delivery pending configuration; no mock success substituted |
| Explain local setup failure and check configuration | Implemented: emulator-only setup code, retained form entries, explicit local feedback and read-only `npm run contact:check` | Passed: 44 frontend and 70 Functions tests, lint/types/build, export scan, actual Hosting integration and browser feedback; doctor identifies both missing addresses and placeholder key |

## October 4 manual distance option

| Requested change | Implementation status | Required verification |
| --- | --- | --- |
| Standalone nautical-mile entry in Plan a cruise | Implemented: Between places / Manual distance options; independent manual total, 0.1–500 NM, includes return legs | Passed: 44 frontend tests, lint/typecheck, production build/export, browser mode/state/validation/math checks and 375/390 px mobile review |

## October 4 Yamaha-only amendment

| Requested change | Implementation status | Required verification |
| --- | --- | --- |
| Remove owner-observed performance | Implemented: Yamaha is the sole performance source; owner profile, claims and calculator fixtures removed | Passed: 44 frontend tests, lint/typecheck, static build/export guards and browser absence checks |
| Align Cruise profile and description | Implemented: official 4,500 RPM row, 32.0 MPH / 18.9 combined GPH / 1.69 published MPG; default remains 4,000 RPM; all 11 official rows retained | Passed: exact-row/interpolation tests, documented-table comparison and focused Cruise/slider/planner browser checks |
| Preserve listing and trip narrative | Implemented: seller 158-gallon fuel assumption and original two-week ICW story retained | Passed: public narrative export assertion for Yamaha attribution, 4,500 RPM, 32.0 MPH and 1.69 MPG |

## Earlier October 4 calculator and route update

| Requested change | Implementation status | Required verification |
| --- | --- | --- |
| Official Yamaha test data | Implemented: all 11 official rows; default 4,000 RPM efficient planing cruise; Yamaha-only profiles | Source comparison and current math/interpolation, export and focused browser checks passed |
| Full RPM slider and marked operating points | Implemented: 1,000–5,950 RPM with trolling and efficient planing cruise markers | Keyboard, endpoint/intermediate values, committed announcements and mobile target/layout checks passed |
| Place-to-place cruise planning | Implemented: seven coastal destinations, one-way/return, adjustable approximate water-route distance | Primary-source provenance, all 42 directed pairs/reverse/roundtrip tests, browser route/reset/override/validation checks passed |

The earlier update and site implementation below are retained as baseline evidence. Current amendment checks are recorded separately in `docs/verification-report.md`; unchanged backend and broader original-site browser checks were not repeated.

| Requirement | Implementation | Verification / publication gate |
| --- | --- | --- |
| Premium responsive owner-sale site | All editorial sections, central typed boat data | Browser at 375/390/430/768/1024/1440/large widths |
| Real photography | Inventory, curation, metadata-free responsive derivatives, gallery/lightbox | Original preservation, dimensions, images load, keyboard/swipe |
| Performance and trip planning | Official Yamaha rows and profiles, interpolation and seven-place waterway model | Formula/route tests and browser checks; distances are disclosed planning estimates |
| Contact delivery | Static frontend → Hosting rewrite → Functions gen 2 → Resend | Mail-handler tests; live delivery requires configuration |
| Firebase | Hosting export, rewrite, cache/security headers, emulators | Config/export checks; project, billing, DNS and secrets are release gates |
| SEO/social | Canonical, Product/Offer, sitemap/images, robots, actual-photo OG | Export inspection; Search Console and GA4 IDs require setup |
| Analytics/privacy | Typed allowlisted gtag events with optional initialization | No PII, configuration absent/present checks |
| Boat accuracy | Seller values, uninstalled extras, no trailer, private survey review | Private conflict log and owner confirmation |
| Handoff | README, provenance, exclusions, verification report | Lint, typecheck, unit, export, function and browser findings |

Final evidence and limitations are recorded in `docs/verification-report.md`.

The Yamaha-only amendment is implemented and locally verified with 44 frontend tests, lint/typecheck, a production export and focused mobile/desktop browser checks. Earlier backend and broader site checks remain dated baseline evidence.

External configuration gates: real Firebase project/billing, Resend/sender/inbox, custom-domain DNS/TLS/redirects, alternate-host indexing controls, GA4 and Search Console ownership.

Unrun verification: real inbox delivery, physical touch-device gestures, scored Lighthouse/field Core Web Vitals and live domain/indexing checks.

Declined work: none. Public survey/credential exposure is excluded as requested.
