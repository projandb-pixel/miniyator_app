"use client";

import { useEffect } from "react";

export default function HomeRedirect() {
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.role === "contractor") {
              if (globalThis.window) {
                globalThis.window.location.href = "/contractor/home";
              }
            } else {
              if (globalThis.window) {
                globalThis.window.location.href = "/supplier/home";
              }
            }
          } else {
            if (globalThis.window) {
              globalThis.window.location.href = "/auth/login";
            }
          }
        })
        .catch(() => {
          if (globalThis.window) {
            globalThis.window.location.href = "/auth/login";
          }
        });
    } else {
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
