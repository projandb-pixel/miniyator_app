"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ContractorNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (!pathname) return false;
    // حذف query string از pathname
    const cleanPathname = pathname.split("?")[0];

    // بررسی دقیق مسیر - فقط مسیرهای دقیق یا زیرشاخه‌های مستقیم
    if (cleanPathname === path) return true;

    // برای مسیرهای خاص که نباید با مسیرهای دیگر تداخل داشته باشند
    if (path === "/shared/marketplace") {
      // فقط marketplace دقیق، نه supplier-profile
      return cleanPathname === "/shared/marketplace";
    }

    if (path === "/contractor/home") {
      return cleanPathname === "/contractor/home";
    }

    if (path === "/contractor/dashboard") {
      // dashboard و زیرشاخه‌هایش
      return (
        cleanPathname === "/contractor/dashboard" ||
        cleanPathname.startsWith("/contractor/dashboard/")
      );
    }

    if (path === "/contractor/profile") {
      return (
        cleanPathname === "/contractor/profile" ||
        cleanPathname.startsWith("/contractor/profile/")
      );
    }

    if (path === "/shared/notifications") {
      return cleanPathname === "/shared/notifications";
    }

    // برای سایر مسیرها، بررسی زیرشاخه
    return cleanPathname.startsWith(path + "/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {/* مناقصات */}
        <Link
          href="/contractor/home"
          className={`flex flex-col items-center gap-1 ${
            isActive("/contractor/home") ? "text-blue-600" : "text-gray-400"
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

        {/* بازار */}
        <Link
          href="/shared/marketplace"
          className={`flex flex-col items-center gap-1 ${
            isActive("/shared/marketplace") ? "text-blue-600" : "text-gray-400"
          }`}
          title="بازار"
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
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span className="text-xs font-medium">بازار</span>
        </Link>

        {/* داشبورد */}
        <Link
          href="/contractor/dashboard"
          className={`flex flex-col items-center gap-1 ${
            isActive("/contractor/dashboard")
              ? "text-blue-600"
              : "text-gray-400"
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

        {/* وین گرام */}
        <Link
          href="/contractor/explore"
          className={`flex flex-col items-center gap-1 ${
            isActive("/contractor/explore") ? "text-blue-600" : "text-gray-400"
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

        {/* پروفایل */}
        <Link
          href="/contractor/profile"
          className={`flex flex-col items-center gap-1 ${
            isActive("/contractor/profile") ? "text-blue-600" : "text-gray-400"
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
