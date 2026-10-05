# Contact delivery and Firebase deployment

The statically exported Next.js site posts JSON to `/api/contact`. Firebase
Hosting rewrites that exact path to the `contact` second generation HTTPS
function in `us-central1`, using Node.js 22. There is no Next.js API route and
no broad SPA fallback. Missing API paths stay 404s.

The handler validates inputs with Zod, accepts POST and JSON only, caps request
bodies at 16 KiB, checks a honeypot and a 3-second minimum form age, rejects
unrecognized browser origins, and escapes every user value in HTML email.
Names and email headers reject control characters. Message bodies allow ordinary
newlines. The source page is an optional relative pathname without query data.
Names are 2–100 characters; messages are 10–5,000; phone is optional and at most
40. Selecting phone as the preferred method requires a phone number.

The email displays all inquiry fields and sets `Reply-To` to the buyer's address.
Only fixed error categories are logged by application code. Names, addresses,
phone numbers, messages, provider error objects, and secrets are not logged.
Public errors are generic. Missing local configuration returns 503 and does not
affect rendering the site. No mail is sent from unit tests.

## Retry and delivery semantics

A UUID `requestId` stays the same when the browser retries the exact same
submission; editing the submission should generate a new UUID. It becomes
Resend's idempotency key, which deduplicates the same email request for 24 hours.
The handler also limits form age to 24 hours. It does not use an in-memory
success cache, and no database is necessary for this owner's direct-email form.

HTTP success is returned only when Resend returns an acceptance identifier.
That confirms acceptance by the mail provider, not delivery into the owner's
inbox. A network failure can happen after Resend accepts the message; retaining
the same payload and UUID makes a retry safe within its documented window.
There is no durable inquiry archive, delivery webhook, or bounce dashboard here.
Inspect Resend's delivery events for actual delivery. Rotate the request UUID
when an inquiry is edited, including when retrying after 24 hours.

The honeypot, browser-origin check, time check, and small body limit reduce basic
form abuse. Client timestamps and headers can be spoofed. These checks are not
a distributed rate limiter or CAPTCHA. Function instance limits constrain
resource usage but are not per-person rate limiting. Add managed bot protection
or a durable rate limiter if public traffic warrants it.

## Server configuration

The production Firebase project is `project-3d38501c-9460-4059-821` (Emily
Project), with billing enabled. Hosting explicitly targets its separate site
`895forsale`. The ignored project environment contains the owner's inquiry inbox,
and `RESEND_API_KEY` is stored in Secret Manager. Verify `895forsale.com` as a
sending domain in Resend and configure its required DNS records. Current release
and sender-verification evidence is in `production-deployment.md`.

Copy `.firebaserc.example` to `.firebaserc` and replace its example project ID.
Create `functions/.env.<YOUR_PROJECT_ID>` from `functions/.env.example` with:

```dotenv
CONTACT_TO_EMAIL=your-owner-inbox@example.com
CONTACT_FROM_EMAIL=inquiries@895forsale.com
```

`CONTACT_TO_EMAIL` is the owner's actual inbox. `CONTACT_FROM_EMAIL` must be a
plain email address on the domain verified in Resend; this implementation does
not accept a display-name mailbox string. Both are non-secret Firebase string
parameters. Store the Resend key in Firebase Secret Manager, bound only to this
function:

```sh
firebase functions:secrets:set RESEND_API_KEY --project YOUR_PROJECT_ID
```

Use an appropriately restricted Resend sending key. Do not add it to a
`NEXT_PUBLIC_*` variable, the frontend, source control, or public Hosting files.
No service-account JSON is required for deployment through your Firebase CLI
login. Use `firebase login` if the CLI is not authenticated.

## Read-only configuration check and local sending

Run the contact configuration doctor before trying to send from the local
Hosting emulator:

```sh
npm --prefix functions run contact:check
npm --prefix functions run contact:check -- --json
```

It reads `functions/.env`, then `functions/.env.local`, and the ignored
`functions/.secret.local`. The local file overrides the base file, including
quoted empty values. It validates both plain email addresses with Zod and
reports only fixed statuses: missing, invalid, placeholder, valid or key
format-valid. It never prints addresses, key values, parsed configuration or
private error details. It makes no provider calls and changes no files.
Exit code 0 means the local files look syntactically complete and the local
secret is ignored by Git; 1 means configuration is incomplete; 2 means invalid
command arguments. A format-valid key does not prove Resend authorization.

For an explicit project parameter file, run:

```sh
npm --prefix functions run contact:check -- --project YOUR_PROJECT_ID
```

This checks `.env` plus `.env.YOUR_PROJECT_ID` and the local development key.
It does not apply `.env.local` overrides in that mode. It does not inspect
Firebase Secret Manager or claim that the production project is configured.
Production still needs the bound `RESEND_API_KEY` secret set separately.

A 503 from a syntactically valid local inquiry can mean the owner recipient or
sender is missing/invalid. The handler rejects that configuration before any
Resend call. In emulator mode this response also includes the safe
`EMAIL_NOT_CONFIGURED` code, so the local frontend can explain the setup gap
and retain the entered fields. Production responses keep their generic errors.
`RESEND_API_KEY=emulator-placeholder` supports no-send emulator
checks; it is not a working key. Restart the emulator after changing its local
configuration so the next process loads the new values.

For genuinely sending local inquiries, set both email parameters in the ignored
`functions/.env.local`, use a sender on a Resend-verified domain, and put an
appropriate restricted development key in the ignored `.secret.local`. The
owner must supply the actual recipient and verified sender. Do not overwrite
existing configuration blindly, and do not put keys in frontend variables.
After the doctor passes, restart `npm run emulators` and perform a separately
authorized real inquiry test. Inspect Resend acceptance and delivery/bounce
events and confirm the owner inbox receives it. No local outbox, fake inbox or
success response stands in for email delivery.

`scripts/contact-preview.mjs` remains test-only: its injected acceptance is a
UI test fixture, sends no email, and is not the working local contact backend.
Use the actual Hosting/Functions emulator at port 5002 for the real path.

Install and build:

```sh
npm ci
npm --prefix functions ci
npm run build
npm --prefix functions run lint
npm --prefix functions run typecheck
npm --prefix functions test
npm --prefix functions run build
```

Deploy only after the project, owner inbox, verified sender, and secret are set:

```sh
firebase deploy --only hosting,functions:contact --project YOUR_PROJECT_ID
```

The `contact` codebase contains the exported `contact` HTTPS function. Deployment
prechecks run its lint and TypeScript build. HTML uses revalidation; hashed Next
bundles cache immutably for a year; photographs revalidate after one day; API
responses use `no-store`. Security headers include MIME sniffing protection,
frame denial, referrer policy, HSTS, and disabled unused device permissions.

## Emulator and equivalent handler tests

The injected-handler tests run the same validation, escaping, mail construction,
idempotency, and response code paths through an HTTP test app with a mocked
mailer. They confirm accepted submission behavior without contacting Resend.
The dependency manifest overrides the Firebase Admin optional storage client's
transitive UUID package to 11.1.1 or later in that major to address its published
bounds-check advisory. The client uses the compatible `v4` interface.

For integration tests, build the site and function, leave both `CONTACT_*`
parameters empty, and use a demo Firebase project:

```sh
npm run build
npm --prefix functions run build
firebase emulators:exec --only hosting,functions --project demo-895forsale 'npm --prefix functions run test:emulator'
```

Hosting uses `http://127.0.0.1:5002`; the Functions emulator uses port 5001.
Port 5000 is commonly occupied by macOS system services. The smoke script
refuses to proceed when the demo/local email parameters are configured, to
avoid sending a real email by accident.

This checks the actual Hosting rewrite, 405/415/400 responses, honest 503 for
missing mail configuration, and missing-API 404 behavior. It deliberately does
not send email. Do not run that test with a configured real recipient/key.
If the emulator requests local secret configuration, use a placeholder in an
ignored `functions/.secret.local`; it will not be read by the send path when
email addresses are unconfigured.

To send a separately authorized real development email, configure non-secret
parameters for the demo emulator, copy `functions/.secret.local.example` to
`.secret.local`, and use a restricted development Resend key and recipient.
The successful delivery integration remains a separate step requiring owner
configuration. Do not interpret mocked acceptance as real inbox delivery.

## Custom domains

In Firebase Console, open Hosting for the selected project and add
`895forsale.com`. Complete ownership verification and apply the exact DNS
records Firebase shows. Add `www.895forsale.com` as a domain redirect to the
canonical apex domain using Firebase's custom-domain redirect option. Wait for
DNS and SSL provisioning, then test apex HTTPS, the www redirect, static routes,
and a contact inquiry. DNS changes and domain binding have not been performed.

## References

- [Firebase Hosting configuration](https://firebase.google.com/docs/hosting/full-config)
- [Firebase runtime and secret parameters](https://firebase.google.com/docs/functions/config-env)
- [Firebase Node.js runtimes](https://firebase.google.com/docs/functions/manage-functions#node.js-version)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys)
