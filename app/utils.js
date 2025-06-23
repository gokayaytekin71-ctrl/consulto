// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        profil: "linear-gradient(to bottom right, #002c4b, #003a66, #e2e8f0)",
      },
      backgroundImage: {
        profil: "linear-gradient(to bottom right, #002c4b, #003a66, #e2e8f0)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(50px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};