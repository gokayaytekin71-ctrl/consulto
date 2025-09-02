import "./globals.css";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";

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
  title: "Consülto",
  description: "Yargı, Mevzuat ve Resmî Gazete arayüzü",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${cormorantGaramond.variable} ${ebGaramond.variable}`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}