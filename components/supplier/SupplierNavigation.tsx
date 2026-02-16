"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function SupplierNavigationContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {/* مناقصات */}
        <Link
          href="/supplier/home"
          className={`flex flex-col items-center gap-1 ${
            pathname === "/supplier/home" && activeTab !== "inquiries"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
          title="مناقصات"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs font-medium">مناقصات</span>
        </Link>

        {/* استعلام‌های دریافتی */}
        <Link
          href="/supplier/home?tab=inquiries"
          className={`flex flex-col items-center gap-1 ${
            activeTab === "inquiries" ? "text-blue-600" : "text-gray-400"
          }`}
          title="استعلام‌های دریافتی"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-medium">استعلام‌ها</span>
        </Link>

        {/* وین گرام */}
        <Link
          href="/supplier/explore"
          className={`flex flex-col items-center gap-1 ${
            isActive("/supplier/explore")
              ? "text-blue-600"
              : "text-gray-400"
          }`}
          title="وین گرام"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-medium">وین گرام</span>
        </Link>

        {/* داشبورد */}
        <Link
          href="/supplier/dashboard"
          className={`flex flex-col items-center gap-1 ${
            isActive("/supplier/dashboard") ? "text-blue-600" : "text-gray-400"
          }`}
          title="داشبورد"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs font-medium">داشبورد</span>
        </Link>

        {/* پروفایل */}
        <Link
          href="/supplier/profile"
          className={`flex flex-col items-center gap-1 ${
            isActive("/supplier/profile") ? "text-blue-600" : "text-gray-400"
          }`}
          title="پروفایل"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs font-medium">پروفایل</span>
        </Link>
      </div>
    </div>
  );
}

export default function SupplierNavigation() {
  return (
    <Suspense fallback={null}>
      <SupplierNavigationContent />
    </Suspense>
  );
}
