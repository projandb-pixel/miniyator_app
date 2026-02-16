"use client";

import { useEffect } from "react";

export default function NotificationsRedirect() {
  useEffect(() => {
    if (globalThis.window) {
      globalThis.window.location.href = "/shared/notifications";
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
