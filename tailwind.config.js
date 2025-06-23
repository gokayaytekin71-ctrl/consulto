/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Mevcut özel ayarlarınız korundu
      colors: {
        profil: {
          start: '#002c4b',
          middle: '#003a66',
          end: '#e2e8f0',
          text: '#66ccff'
        },
      },
      backgroundImage: {
        profil: 'linear-gradient(to bottom right, #002c4b, #003a66, #e2e8f0)',
      },

      // YENİ: Gündem bölümündeki "aurora" efekti için özel animasyon
      keyframes: {
        aurora: {
          from: { backgroundPosition: '0% 50%' },
          to: { backgroundPosition: '100% 50%' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        aurora: 'aurora 20s ease-in-out infinite',
        spinSlow: 'spinSlow 3s linear infinite',
      },
    },
  },
  
  // YENİ: Gündem detay sayfasındaki blog metinlerini otomatik olarak
  // güzelleştirmek için tipografi eklentisi.
  plugins: [
    require('@tailwindcss/typography'),
  ],
};