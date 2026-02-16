"use client";

import { useEffect } from "react";

export default function LoginRedirect() {
  useEffect(() => {
    // بررسی اینکه آیا کاربر لاگین است
    const storedUserId = localStorage.getItem("userId");
    
    if (storedUserId) {
      // اگر لاگین است، به صفحه home برو
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user && globalThis.window) {
            const homeUrl = data.user.role === "contractor" 
              ? "/contractor/home" 
              : "/supplier/home";
            globalThis.window.location.href = homeUrl;
          } else if (globalThis.window) {
            globalThis.window.location.href = "/auth/login";
          }
        })
        .catch(() => {
          if (globalThis.window) {
            globalThis.window.location.href = "/auth/login";
          }
        });
    } else {
      // اگر لاگین نیست، به لاگین برو
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

  return (
    <div className="mobile-container bg-gray-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
