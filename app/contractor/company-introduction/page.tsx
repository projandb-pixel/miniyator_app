"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

interface CompanyIntroduction {
  id: string;
  companyName: string;
  title: string;
  description: string;
  history: string | null;
  achievements: string | null;
  facilities: string | null;
  image: string | null;
}

function CompanyIntroductionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const companyName = searchParams.get("name");
  const [introduction, setIntroduction] = useState<CompanyIntroduction | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyName) {
      fetchIntroduction(companyName);
    }
  }, [companyName]);

  const fetchIntroduction = async (name: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/companies/${encodeURIComponent(name)}/introduction`
      );
      const data = await response.json();

      if (data.introduction) {
        setIntroduction(data.introduction);
      } else {
        // اگر معرفی پیدا نشد، یک معرفی پیش‌فرض نمایش بده
        setIntroduction({
          id: "",
          companyName: name,
          title: `معرفی ${name}`,
          description: `اطلاعاتی درباره ${name} در حال آماده‌سازی است.`,
          history: null,
          achievements: null,
          facilities: null,
          image: null,
        });
      }
    } catch (error) {
      console.error("Error fetching introduction:", error);
      setIntroduction({
        id: "",
        companyName: name || "",
        title: `معرفی ${name || "شرکت"}`,
        description: `اطلاعاتی درباره ${name || "این شرکت"} در حال آماده‌سازی است.`,
        history: null,
        achievements: null,
        facilities: null,
        image: null,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <ContractorNavigation />
      </div>
    );
  }

  if (!introduction) {
    return (
      <div className="mobile-container bg-white">
        <div className="p-4">
          <p className="text-center text-gray-600">معرفی شرکت یافت نشد</p>
        </div>
        <ContractorNavigation />
      </div>
    );
  }

  return (
    <div className="mobile-container bg-white pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold">معرفی شرکت</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Company Name & Image */}
        <div className="text-center">
          {introduction.image && (
            <img
              src={introduction.image}
              alt={introduction.companyName}
              className="w-32 h-32 mx-auto rounded-full object-cover mb-4"
            />
          )}
          <h2 className="text-2xl font-bold mb-2">{introduction.companyName}</h2>
          <h3 className="text-lg text-gray-700 mb-4">{introduction.title}</h3>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-lg font-semibold mb-2">معرفی</h4>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">
            {introduction.description}
          </p>
        </div>

        {/* History */}
        {introduction.history && (
          <div>
            <h4 className="text-lg font-semibold mb-2">تاریخچه</h4>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {introduction.history}
            </p>
          </div>
        )}

        {/* Achievements */}
        {introduction.achievements && (
          <div>
            <h4 className="text-lg font-semibold mb-2">دستاوردها</h4>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {introduction.achievements}
            </p>
          </div>
        )}

        {/* Facilities */}
        {introduction.facilities && (
          <div>
            <h4 className="text-lg font-semibold mb-2">تسهیلات و امکانات</h4>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {introduction.facilities}
            </p>
          </div>
        )}
      </div>

      <ContractorNavigation />
    </div>
  );
}

export default function CompanyIntroductionPage() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-white">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <ContractorNavigation />
        </div>
      }
    >
      <CompanyIntroductionContent />
    </Suspense>
  );
}

