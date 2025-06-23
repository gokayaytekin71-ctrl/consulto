// app/kararlar/[id]/page.js

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import FavoriteButton from '@/components/FavoriteButton';
import HighlightedKararBody from '@/components/HighlightedKararBody';

export async function generateStaticParams() {
  const kararlar = await prisma.karar.findMany({
    select: { fileName: true },
  });
  return kararlar.map(k => ({
    id: k.fileName.replace(/\.txt$/, ''),
  }));
}

export default async function KararDetayPage({ params }) {
  const { id: kararSlug } = params;

  // karar objesini çekerken keywords alanını da dahil ediyoruz
  const karar = await prisma.karar.findUnique({
    where: { fileName: `${kararSlug}.txt` },
  });

  if (!karar) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let isInitiallyFavorited = false;
  if (session?.user?.id) {
    const favorite = await prisma.favoriteKarar.findUnique({
      where: { userId_kararId: { userId: session.user.id, kararId: karar.id } },
    });
    isInitiallyFavorited = !!favorite;
  }

  const type = karar.type || 'Başlık Yok';
  const code = karar.code || 'Esas/Karar No Yok';
  const aiSummary = karar.aiSummary || '(AI özeti bulunamadı)';
  // Karardan gelen keywords alanını kullanıyoruz
  const keywordsFromKarar = typeof karar.keywords === 'string'
    ? karar.keywords.split(',').map(kw => kw.trim()).filter(Boolean)
    : [];


  const prevKarar = await prisma.karar.findFirst({ where: { createdAt: { lt: karar.createdAt } }, orderBy: { createdAt: 'desc' }, select: { fileName: true } });
  const nextKarar = await prisma.karar.findFirst({ where: { createdAt: { gt: karar.createdAt } }, orderBy: { createdAt: 'asc' }, select: { fileName: true } });
  const prevId = prevKarar ? prevKarar.fileName.replace(/\.txt$/, '') : null;
  const nextId = nextKarar ? nextKarar.fileName.replace(/\.txt$/, '') : null;

  const aiSummaryIconPath = "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  // AI Özeti için renklendirilecek anahtar kelimeler ve stilleri (iç metin için)
  const summaryKeywords = [
    { phrase: "Konu:", style: "text-blue-400 font-bold" },
    { phrase: "1) Konu:", style: "text-blue-400 font-bold" },
    { phrase: "HGK Gerekçesi ve Sonuç:", style: "text-blue-400 font-bold" },
    { phrase: "2) HGK Gerekçesi ve Sonuç:", style: "text-blue-400 font-bold" },
    { phrase: "HGK Gerekçesi:", style: "text-indigo-700 font-bold" },
    { phrase: "Gerekçe ve Sonuç:", style: "text-blue-400 font-bold" },
    { phrase: "Uyuşmazlık:", style: "text-blue-400 font-bold" }
  ];

  // Regex özel karakterlerini kaçış karakteri ekleyen yardımcı fonksiyon
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // aiSummary'yi satırlara böl ve renklendirme mantığını uygula
  const renderAiSummary = (summaryText) => {
    const sortedKeywords = [...summaryKeywords].sort((a, b) => b.phrase.length - a.phrase.length);
    const lines = (summaryText || "").split(/\r?\n/).filter(line => line.trim() !== '');

    return lines.map((line, index) => {
      for (const keywordObj of sortedKeywords) {
        const escapedPhrase = escapeRegExp(keywordObj.phrase);
        const keywordRegex = new RegExp(`^\\s*(${escapedPhrase})(?:\\s|\\b|$)`, 'i');
        const match = line.match(keywordRegex);

        if (match) {
          const matchedText = match[1];
          const restOfLine = line.substring(match[0].length);

          return (
            <p key={index} className="text-blue-100">
              <span className={keywordObj.style}>{matchedText}</span>
              <span className="text-blue-200"> {restOfLine}</span>
            </p>
          );
        }
      }

      return (
        <p key={index} className="text-blue-100">
          {line}
        </p>
      );
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-900 to-indigo-950 text-gray-100 py-16 px-4 sm:px-6 lg:px-8 relative">
      {prevId && (
        <Link
          href={`/kararlar/${prevId}`}
          className="fixed top-1/2 left-2 sm:left-4 transform -translate-y-1/2 z-20 p-3 bg-slate-700/50 hover:bg-slate-600/80 rounded-full text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Önceki Karar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
      )}
      {nextId && (
        <Link
          href={`/kararlar/${nextId}`}
          className="fixed top-1/2 right-2 sm:right-4 transform -translate-y-1/2 z-20 p-3 bg-slate-700/50 hover:bg-slate-600/80 rounded-full text-white shadow-lg transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Sonraki Karar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      <div className="max-w-6xl mx-auto space-y-12">
        <Link
          href="/kararlar"
          className="inline-flex items-center text-blue-300 hover:text-blue-100 font-semibold text-base transition-colors duration-200 group animate-fade-in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kararlar Listesine Geri Dön
        </Link>

        {/* AI Özeti Bölümü - renderAiSummary ve anahtar kelime linkleri */}
        <div className="bg-blue-900/30 border border-blue-700/60 rounded-lg shadow-xl p-8 animate-fade-in delay-300">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-3xl font-bold text-blue-300 flex items-center flex-grow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mr-4 text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={aiSummaryIconPath} />
              </svg>
              Yapay Zeka Özeti
            </h2>
            {/* Karardan gelen anahtar kelimeleri gösteriyoruz (turuncu) */}
            {keywordsFromKarar.length > 0 && (
              <div className="flex-shrink-0 text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  {keywordsFromKarar.map((kw, idx) => (
                    <Link
                      key={idx}
                      href={`/kararlar?q=${encodeURIComponent(kw)}&page=1`}
                      // TURUNCU renk için Tailwind CSS sınıfları
                      className="bg-orange-600 text-white px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-orange-500 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {kw}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-blue-100 leading-relaxed space-y-4 text-lg">
            {renderAiSummary(aiSummary)}
          </div>
        </div>

        {/* KARAR METNİ BÖLÜMÜ - HighlightedKararBody bileşeni kullanılıyor */}
        <div className="bg-white shadow-2xl rounded-lg p-10 animate-fade-in-up delay-500 text-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 border-b-2 border-blue-100 pb-4">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-700 leading-tight flex-grow">
              {type} <span className="text-blue-500">|</span> {code}
            </h2>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
              <FavoriteButton
                itemId={karar.id}
                itemType="karar"
                initialIsFavorited={isInitiallyFavorited}
              />
            </div>
          </div>
          <article>
            {/* Karar içeriği HighlightedKararBody bileşenine gönderiliyor */}
            <HighlightedKararBody fullContent={karar.content || ""} />
          </article>
        </div>
      </div>
    </main>
  );
}