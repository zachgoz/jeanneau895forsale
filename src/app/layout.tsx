import type { Metadata, Viewport } from "next";
import Analytics from "@/components/Analytics";
import { boat, siteUrl, priceFormatted } from "@/data/boat";
import "./globals.css";
const title = `${boat.year} ${boat.make} NC 895 for Sale | ${boat.vesselName} | ${boat.shortLocation}`;
const description = `Privately offered ${boat.year} ${boat.make} ${boat.model} in ${boat.shortLocation}. Twin Yamaha 200 HP outboards, approx. ${boat.engineHours} hours, generator, 16,000 BTU A/C and bow thruster. ${priceFormatted}.`;
const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: siteUrl + "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl + "/",
    title: `${boat.year} ${boat.make} NC 895 — ${boat.vesselName} | ${priceFormatted}`,
    description,
    siteName: "EZ Livin · Private owner sale",
    images: [
      {
        url: siteUrl + "/images/og/jeanneau-nc895-for-sale-og.jpg",
        width: 1200,
        height: 630,
        alt: "EZ Livin, a 2018 Jeanneau NC 895 offered privately for $160,000 in Carolina Beach, NC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [siteUrl + "/images/og/jeanneau-nc895-for-sale-og.jpg"],
  },
  verification: verification ? { google: verification } : undefined,
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#102a36",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
