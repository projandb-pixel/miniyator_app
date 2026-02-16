"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

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
            router.push(homeUrl);
          } else {
            router.push("/splash");
          }
        })
        .catch(() => {
          router.push("/splash");
        });
    } else {
      // اگر لاگین نیست، به splash برو
      router.push("/splash");
    }
  }, [router]);

  return null;
}
