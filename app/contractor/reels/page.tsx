"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

export default function ContractorReels() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
        <p className="text-gray-600">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ریلز</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-xl font-bold mb-4">ریلزهای فعال</h2>
          <p className="text-gray-600 text-sm">
            این بخش به زودی در دسترس خواهد بود.
          </p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">ایجاد ریلز جدید</h2>
          <p className="text-gray-600 text-sm mb-4">
            این بخش به زودی در دسترس خواهد بود.
          </p>
        </div>
      </div>

      <ContractorNavigation />
    </div>
  );
}




