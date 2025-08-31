"use client";

import { useRouter } from 'next/navigation';

export default function BackButton({ className }) {
  const router = useRouter();

  // Temel stiller ve dışarıdan gelen stilleri birleştiriyoruz.
  const buttonClasses = `inline-flex items-center text-blue-300 hover:text-blue-100 font-semibold text-base transition-colors duration-200 group ${className || ''}`;

  return (
    <button
      onClick={() => router.back()}
      className={buttonClasses}
      aria-label="Önceki Sayfaya Dön"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {/* Metni ekran görüntüsündeki gibi "Geri" yapıyoruz */}
      Geri
    </button>
  );
}