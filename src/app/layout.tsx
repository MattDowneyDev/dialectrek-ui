import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../index.css";
import "../App.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FeedbackWidget from "../components/FeedbackWidget";
import ThemeToggle from "../components/ThemeToggle";
import CookieConsentBanner from "../components/CookieConsentBanner";
import { ThemeProvider } from "../context/ThemeContext";
import { jsonLdScript } from "../lib/jsonLd";

const SITE_DESCRIPTION =
  "DialecTrek — look up verb conjugations and practice with flashcards to build your vocabulary.";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: "DialecTrek",
    template: "%s | DialecTrek",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  openGraph: {
    siteName: "DialecTrek",
    locale: "en_US",
    type: "website",
    title: "DialecTrek",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/DialecTrekHeroImage.jpeg",
        alt: "A hiker pauses on a mountain trail, looking out over green valleys and a winding path toward distant peaks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DialecTrek",
    description: SITE_DESCRIPTION,
    images: ["/DialecTrekHeroImage.jpeg"],
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DialecTrek",
  description: SITE_DESCRIPTION,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dialectrek.com",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E7C5A",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
    <head>
      {/* Runs before first paint so the resolved theme (saved preference,
          falling back to the OS setting) applies immediately instead of
          flashing the light theme -- see ThemeContext.tsx, which resolves
          the initial theme the same way. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
        }}
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap"
        rel="stylesheet"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(WEBSITE_JSON_LD) }}
      />
      <Script id="gtag-consent-default" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          var storedConsent;
          try { storedConsent = localStorage.getItem("dialectrek-cookie-consent"); } catch (e) {}
          gtag('consent', 'default', {
            analytics_storage: storedConsent === 'granted' ? 'granted' : 'denied'
          });`}
      </Script>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-YJ9ZN40RNK"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`gtag('js', new Date());
          gtag('config', 'G-YJ9ZN40RNK');`}
      </Script>
    </head>
    <body>
      <ThemeProvider>
        <div className="App">
          <Navbar />
          {children}
          <Footer />
          <ThemeToggle />
          <FeedbackWidget />
        </div>
        <CookieConsentBanner />
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);

export default RootLayout;
