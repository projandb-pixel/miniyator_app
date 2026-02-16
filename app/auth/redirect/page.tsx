"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function RedirectContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("to") || "/contractor/home";
  const userId = searchParams.get("userId");

  useEffect(() => {
    // ذخیره userId در localStorage اگر وجود دارد
    if (userId && typeof window !== "undefined") {
      localStorage.setItem("userId", userId);
    }

    // تاخیر برای اطمینان از set شدن cookie
    setTimeout(() => {
      if (typeof window !== "undefined") {
        console.log("Redirecting from auth/redirect to:", destination);
        window.location.replace(destination);
      }
    }, 500);
  }, [destination, userId]);

  return (
    <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">در حال هدایت...</p>
      </div>
    </div>
  );
}

export default function AuthRedirect() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}









