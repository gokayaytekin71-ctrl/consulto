/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Akademik Odak teması için font ailelerini tanımlıyoruz.
      fontFamily: {
        // Ana metinler için modern ve okunaklı bir sans-serif font.
        sans: ['Inter', ...fontFamily.sans],
        // Başlıklar için otoriter ve zarif bir serif font.
        serif: ['Lora', ...fontFamily.serif],
      },
      // Animasyonları daha sade ve profesyonel hale getiriyoruz.
      keyframes: {
        // Sadece yumuşak bir belirme efekti.
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        // 'animate-fadeIn' sınıfıyla kullanılacak.
        fadeIn: "fadeIn 0.5s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
