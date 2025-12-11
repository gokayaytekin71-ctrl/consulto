import "./globals.css";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";


const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-cormorant-garamond",
  weight: ["300", "400", "500", "600", "700"],
});

const ebGaramond = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-eb-garamond",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL('https://consultohukuk.com'),
  title: {
    default: 'Consülto Yapay Zeka Hukuk Asistanı',
    template: '%s | CONSÜLTO Hukuk',
  },
  description: 'Consülto – Yapay Zeka Destekli Hukuk Asistanı…',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${cormorantGaramond.variable} ${ebGaramond.variable}`}>
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-17782177556"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17782177556');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1 pt-24">{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}