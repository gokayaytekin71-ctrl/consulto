import "./globals.css";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import ActivityTracker from "@/components/ActivityTracker";
import ConditionalFooter from "@/components/ConditionalFooter";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "./context/ThemeContext";

const siteUrl = "https://consultohukuk.com";
const siteTitle = "Consülto | Hukukçular İçin Yapay Zeka Destekli Hukuk Asistanı";
const siteDescription =
  "Consülto; hukukçular için Yargıtay karar arama, dilekçe hazırlama, hukuki araştırma, dosya analizi ve hesaplama araçları sunan yapay zeka destekli hukuk platformudur.";
const socialDescription =
  "Yargıtay karar arama, dilekçe hazırlama, hukuki araştırma ve dosya analizi için yapay zeka destekli hukuk platformu.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Consülto",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Consülto",
    title: siteTitle,
    description: socialDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: socialDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="llms-txt" href="/llms.txt" />
        <link rel="webmcp" type="application/json" href="/.well-known/webmcp.json" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18028288601"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'AW-18028288601');
          `}
        </Script>

        <ThemeProvider>
          <AuthProvider>
            <ActivityTracker />
            <Header />
            <main className="flex-1 pt-16">{children}</main>
            <ConditionalFooter />
          </AuthProvider>
        </ThemeProvider>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
