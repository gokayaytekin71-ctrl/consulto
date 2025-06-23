import "./globals.css";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import Header from "@/components/Header";
import AuthProvider from "@/components/AuthProvider"; // YENİ: AuthProvider'ı import et

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-cormorant-garamond',
  weight: ['300', '400', '500', '600', '700']
});

const ebGaramond = EB_Garamond({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-eb-garamond',
  weight: ['400', '500', '600', '700', '800']
});

export const metadata = {
  title: "KararAi",
  description: "Yargı, Mevzuat ve Resmî Gazete arayüzü",
};
export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${cormorantGaramond.variable} ${ebGaramond.variable}`}>
      <body>
        {/* YENİ: AuthProvider ile tüm uygulamayı sarmalıyoruz */}
        <AuthProvider>
          <div className="flex flex-col min-h-screen"> {/* Sayfanın tamamını kaplaması için */}
            <Header />
            <main className="flex-grow">{children}</main> {/* Ana içeriğin büyümesini sağlar */}
            {/* İsterseniz buraya bir Footer da ekleyebilirsiniz */}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}