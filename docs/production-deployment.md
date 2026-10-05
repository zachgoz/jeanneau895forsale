# Production deployment record

Deployment date: **October 4, 2026**. This records observed results and outstanding configuration at the time of the initial release.

## Current status

| Item | Status |
| --- | --- |
| Static Firebase Hosting release | Deployed: 118 files at https://895forsale.web.app; final version `5818f407a886c1e7` released October 4 at 7:38:59 PM America/New_York |
| `895forsale.com` custom domain | Live over valid HTTPS; homepage, privacy, sitemap and robots return 200 |
| `www.895forsale.com` custom domain | Created with `redirectTarget=895forsale.com`; ownership and TLS pending |
| Contact function | Deployed and ACTIVE: Node.js 22, second generation, `us-central1`; Hosting rewrite released |
| Resend sender and API secret | Sending domain VERIFIED in Resend; matching all-domain sending key stored in Secret Manager |
| Real contact delivery | Unverified; no real emails sent |
| Default Firebase hostname indexing control | Unresolved |

## Firebase project and credentials

The existing `service-account.json` identifies project **`project-3d38501c-9460-4059-821`**, displayed as **Emily Project**. Billing is enabled. A separate Firebase Hosting site, **`895forsale`**, serves this listing within that project.

The actual `.firebaserc` is ignored and maps to this project. `firebase.json` explicitly selects Hosting site `895forsale`, so the site hostname differs from the project ID. The contact origin allowlist includes the site's Firebase default hosts as well as the apex and `www` custom domains. The final Hosting API version config rewrites only `/api/contact` to Cloud Run service `contact` in `us-central1`.

Deployment uses service-account Application Default Credentials. An isolated CLI configuration directory, `tmp/firebase-cli-config`, avoids the existing Firebase CLI user's session. Credentials remain private and outside the static export.

## Custom domains and DNS

Both custom domains were created through the Firebase Hosting API. The `www` domain is configured to redirect to `895forsale.com`.

The Cloudflare zone is active. These exact Firebase-supplied records were applied with proxying disabled (DNS-only):

| Type | Name | Value |
| --- | --- | --- |
| A | `895forsale.com` | `199.36.158.100` |
| TXT | `895forsale.com` | `hosting-site=895forsale` |
| CNAME | `www` | `895forsale.web.app` |

Firebase-supplied ACME TXT validation records were also applied. The apex now serves the site over valid HTTPS: homepage, privacy, sitemap and robots return 200 with expected metadata and security headers. Firebase's certificate state was `CERT_PROPAGATING` at the last API check. `www` ownership and certificate provisioning remain pending; successful HTTPS and the `www` redirect have not yet been verified.

## Contact configuration and function deployment

With the user's authorization, `RESEND_API_KEY` was copied directly from the NC-Crawlspace-Encapsulation environment into this project's Secret Manager without printing its value. The NC-Crawlspace-Encapsulation repository was not changed. The key is restricted to sending. After the user signed in to Resend, the existing key's masked prefix was matched locally to the source key and its domain scope confirmed as `All domains`; no new key was created or existing key permission changed.

The sending domain `895forsale.com` was added to the signed-in Resend account. Its exact displayed DKIM TXT record at `resend._domainkey` and DNS-only CNAME records `rsend` → `rsend.forge.rmta.net` and `send` → `send.forge.rmta.net` were added in Cloudflare. Resend reports the domain **verified** and ready to send emails, with verification events at **7:44 PM America/New_York on October 4**. Receiving was not enabled. Optional tracking and DMARC settings were not changed.

The ignored production Functions environment file contains these non-secret parameters:

```dotenv
CONTACT_TO_EMAIL=zacharygosling@gmail.com
CONTACT_FROM_EMAIL=inquiries@895forsale.com
```

The first function deployment reached the build stage but failed while the default Compute service account lacked logging and artifact permissions. `roles/logging.logWriter` was added at project scope and `roles/artifactregistry.writer` was added on the `gcf-artifacts` repository. Policy updates retained their etags. The initial source fetch succeeded. The retry succeeded: Cloud Build `0986f414-321b-418f-b3bc-330621258927`, function revision `contact-00001-mem`, state `ACTIVE`. Firebase then released the Hosting rewrite to the second-generation function. Runtime metadata confirms the configured addresses and secret version 1, 256 MiB, 15-second timeout, at most two instances and concurrency 40.

A seven-day cleanup policy was configured on `gcf-artifacts`.

No real inquiry emails have been sent. A successful API response would confirm provider acceptance; inbox delivery still requires separate verification after sender-domain configuration.

## Observed verification

- Initial checks passed: **44 frontend tests and 48 backend tests**. A subsequent backend run passed **70 tests**, including concurrently added contact-doctor tests. Unrelated existing work was preserved.
- Live HTTP checks at `https://895forsale.web.app` passed for the homepage, privacy page, robots, sitemap, all eight sitemap photographs, the social image, and one JavaScript and CSS asset. All returned 200 with the expected MIME types.
- The homepage has one H1, the expected title, apex canonical and social metadata, and Product/Offer structured data showing **$160,000 USD** and used condition. The privacy canonical and Firebase/Resend inquiry disclosures are present. The social JPEG is **1200 × 630**.
- HTML, XML and text revalidate; hashed JavaScript and CSS cache immutably for one year; images cache for one day. MIME-sniffing protection, frame denial, referrer policy, device permissions policy and HSTS headers are present.
- A missing page and `/api/does-not-exist` both return 404; there is no blanket SPA fallback.
- The deployed page rendered in the browser without observed errors. The calculator's 150 NM example displayed approximately **102 gallons** and **5 hours 24 minutes**.
- The gallery expanded to all 22 photographs; its lightbox opened and closed with Escape, with no observed browser errors.
- Live contact API checks returned 405 for GET, 400 for an empty JSON body from the site, and 403 for a foreign origin. Responses were JSON with `no-store` caching.
- The canonical domain's `/api/contact` also returned 405 for GET and 400 for malformed JSON input with `no-store` caching. A final exact-value credential scan checked all 118 exported files and found neither the service-account private key nor the reused Resend key.

Only malformed contact requests were used for deployed API checks; no valid inquiry or real email was sent. Real inbox delivery, scored Lighthouse performance, production analytics, and search indexing have not been verified. Canonical tags point to the apex, but hostname-aware indexing control for the default Firebase hosts remains unresolved.

## Repeat deployment

Use the explicit project and private service-account file from the repository root:

```sh
npm run build
npm run functions:build
GOOGLE_APPLICATION_CREDENTIALS="$PWD/service-account.json" XDG_CONFIG_HOME="$PWD/tmp/firebase-cli-config" firebase deploy --non-interactive --only hosting,functions:contact --project project-3d38501c-9460-4059-821
```

Functions predeploy checks run lint and build. The final function/Hosting release and apex HTTPS have been confirmed. Confirm `www` HTTPS/redirect and authorized contact delivery separately; update this record with the observed results.
