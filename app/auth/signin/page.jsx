"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden">
      {/* Arka plan - desenli grid (daha görünür ve etkileyici) */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bgGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="#93c5fd" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrid)" />
      </svg>

      {/* Degrade bulut benzeri efekt */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[50rem] h-[35rem] bg-gradient-to-tr from-blue-800 via-indigo-900 to-purple-900 rounded-full opacity-20 blur-[200px]" />

      {/* Giriş paneli */}
      <div className="relative z-10 bg-white/10 border border-blue-600/70 backdrop-blur-3xl rounded-3xl p-12 max-w-md w-full shadow-[0_0_30px_#3b82f6] animate-fadeIn">
        <h1 className="text-5xl font-extrabold text-center mb-6 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-900 animate-text-glow">
          Consulto
        </h1>
        <p className="text-slate-300 text-center mb-3 text-lg font-semibold animate-fadeIn delay-100">
          Yapay zeka destekli hukuk çözüm platformu
        </p>
        <p className="text-slate-400 text-center mb-10 text-sm animate-fadeIn delay-200">
          Giriş yapmak için Google hesabınızı kullanın.
        </p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-semibold py-3 rounded-xl shadow-[0_0_20px_#1e3a8a] hover:shadow-[0_0_40px_#1e3a8a] transition duration-300 ease-in-out neon-glow"
        >
          Google ile Giriş Yap
        </button>
      </div>
    </div>
  );
}