// app/auth/signin/page.jsx
"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    // Burada callbackUrl’i istediğiniz sayfaya yönlendirecek şekilde ayarlayabilirsiniz
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div
      className="relative w-full h-screen flex items-center justify-center
                 bg-[url('/images/login-background.png')] bg-no-repeat bg-cover bg-center"
    >
      <button
        onClick={handleGoogleSignIn}
        className="relative z-10 translate-y-16 cursor-pointer bg-[#001f3f] hover:bg-[#001a35] text-white font-bold
                   py-3 px-12 rounded-lg shadow-xl transition duration-300 ease-in-out
                   flex items-center justify-center mx-auto max-w-xs w-full"
      >
        Google ile Giriş Yap
      </button>
    </div>
  );
}