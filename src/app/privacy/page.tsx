import Link from "next/link";
import type { Metadata } from "next";
import { siteUrl } from "@/data/boat";
export const metadata: Metadata = {
  title: "Privacy | EZ Livin",
  alternates: { canonical: siteUrl + "/privacy/" },
};
export default function Privacy() {
  return (
    <main id="main-content" className="section-wrap section-space privacy-page">
      <Link href="/" className="text-link">
        ← Back to EZ Livin
      </Link>
      <p className="eyebrow">PRIVATE OWNER LISTING</p>
      <h1>Privacy information</h1>
      <h2>Your inquiry</h2>
      <p>
        When you contact the owner, your name, email, optional phone number,
        contact preferences and message are used to respond to your inquiry
        about EZ Livin. The inquiry passes through Firebase Cloud Functions and
        Resend for email delivery to the owner. Inquiry details are not sent to
        Google Analytics. The owner’s email service and Resend may retain
        messages and delivery records under their respective policies.
      </p>
      <h2>Site analytics</h2>
      <p>
        If configured, Google Analytics 4 measures page visits and actions such
        as opening photos, exploring the calculator or completing an inquiry.
        The site sends only predefined event labels and general calculator
        settings. It does not intentionally send your name, email, phone number
        or message. Google Analytics may use cookies and process technical
        information about your browser and device. Advertising personalization
        and Google signals are disabled in this site’s configuration.
      </p>
      <h2>Hosting</h2>
      <p>
        Firebase Hosting serves the site and may process technical request
        information for delivery and security. Public boat photographs have had
        unnecessary camera and GPS metadata removed.
      </p>
      <h2>Questions or deletion requests</h2>
      <p>
        Use the contact form to ask the owner about your inquiry or request
        deletion of correspondence. This is a private sale listing, not a
        mailing list.
      </p>
    </main>
  );
}
