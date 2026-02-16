"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function SplashScreen() {
  const router = useRouter();
  const [showContent] = useState(true);

  useEffect(() => {
    // بررسی اینکه آیا کاربر لاگین است
    const storedUserId = localStorage.getItem("userId");
    
    if (storedUserId) {
      // اگر لاگین است، به صفحه home برو
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            const homeUrl = data.user.role === "contractor" 
              ? "/contractor/home" 
              : "/supplier/home";
            setTimeout(() => {
              router.push(homeUrl);
            }, 1000);
          } else {
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          }
        })
        .catch(() => {
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        });
    } else {
      // اگر لاگین نیست، به لاگین برو
      const timer = setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  return (
    <div className="mobile-container bg-white">
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Logo */}
        <div
          className={`mb-8 transition-opacity duration-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <Logo size="lg" />
        </div>

        {/* Tagline - Minimal */}
        <div
          className={`text-center transition-opacity duration-500 delay-200 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-gray-500 text-sm">
            اولین شبکه اجتماعی-صنعتی پیمانکاران و تأمین‌کنندگان ایران
          </p>
        </div>
      </div>
    </div>
  );
}
