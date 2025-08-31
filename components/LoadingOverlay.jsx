// components/LoadingOverlay.jsx
"use client";
import Lottie from "lottie-react";
import animationData from "../assets/lottie/loading.json"

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative w-48 h-48">
        <Lottie animationData={animationData} loop className="w-full h-full" />
        <p className="mt-2 text-gray-700 text-base font-medium text-center">
          
        </p>
      </div>
    </div>
  );
}