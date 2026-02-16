"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import SupplierNavigation from "@/components/supplier/SupplierNavigation";
import Image from "next/image";
import TenderTimer from "@/components/TenderTimer";
import { getPetrochemicalLogo, isPetrochemicalCompany } from "@/lib/petrochemical-logos";

interface TenderCard {
  id: string;
  title: string;
  company: string;
  category: string;
  contractorViews: number;
  supplierViews: number;
  userLiked: boolean;
  userSaved: boolean;
  userFollowing: boolean;
  likes: number;
  comments: number;
  imageUrl?: string;
  deadline?: string;
  documentDeliveryDeadline?: string;
  savedAt: string;
}

function SavedTendersContent() {
  const [tenders, setTenders] = useState<TenderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchSavedTenders(storedUserId);
    } else {
      setLoading(false);
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

  // به‌روزرسانی لیست وقتی کاربر به صفحه برمی‌گردد
  useEffect(() => {
    if (!userId) return;
    
    const handleFocus = () => {
      fetchSavedTenders(userId);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId]);

  const fetchSavedTenders = async (userId: string) => {
    try {
      setLoading(true);
      // دریافت مناقصه‌های ذخیره شده
      const response = await fetch(`/api/tenders?userId=${userId}&saved=true`);
      const data = await response.json();

      console.log('Saved tenders API response:', data);

      if (data.tenders && Array.isArray(data.tenders)) {
        const formattedTenders = data.tenders.map((tender: any) => ({
          id: tender.id,
          title: tender.title || "بدون عنوان",
          company: tender.company || "نامشخص",
          category: (() => {
            if (tender.TenderCategories && tender.TenderCategories.length > 0) {
              return tender.TenderCategories[0].category;
            }
            if (tender.categories && tender.categories.length > 0) {
              return tender.categories[0].category;
            }
            return "عمومی";
          })(),
          contractorViews: tender.contractorViews || 0,
          supplierViews: tender.supplierViews || 0,
          userLiked: tender.userLiked || false,
          userSaved: true,
          userFollowing: tender.userFollowing || false,
          likes: tender._count?.likes || 0,
          comments: tender._count?.comments || 0,
          imageUrl: tender.images || undefined,
          deadline: tender.deadline ? (typeof tender.deadline === 'string' ? tender.deadline : tender.deadline.toISOString()) : undefined,
          documentDeliveryDeadline: tender.documentDeliveryDeadline ? (typeof tender.documentDeliveryDeadline === 'string' ? tender.documentDeliveryDeadline : tender.documentDeliveryDeadline.toISOString()) : undefined,
          savedAt: tender.savedAt || (tender.createdAt ? (typeof tender.createdAt === 'string' ? tender.createdAt : tender.createdAt.toISOString()) : new Date().toISOString()),
        }));
        console.log('Formatted tenders:', formattedTenders);
        setTenders(formattedTenders);
      } else {
        console.log('No tenders in response or response is not an array');
        setTenders([]);
      }
    } catch (error) {
      console.error("Error fetching saved tenders:", error);
      setTenders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (tenderId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/tenders/${tenderId}/saves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // حذف از لیست
        setTenders((prev) => prev.filter((tender) => tender.id !== tenderId));
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/supplier-dashboard" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">موارد ذخیره شده</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pb-20">
        {tenders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">هیچ موردی ذخیره نشده است</p>
            <Link
              href="/supplier/home"
              className="text-orange-600 font-medium"
            >
              مشاهده مناقصات
            </Link>
          </div>
        ) : (
          <div>
            {tenders.map((tender) => (
              <div
                key={tender.id}
                className="bg-white border-b border-gray-200 mb-2"
              >
                {/* Tender Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {isPetrochemicalCompany(tender.company) &&
                      getPetrochemicalLogo(tender.company) ? (
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                          <Image
                            src={getPetrochemicalLogo(tender.company)!}
                            alt={tender.company}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain p-1"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              if (target.parentElement) {
                                const fallback =
                                  document.createElement("span");
                                fallback.className =
                                  "text-orange-600 font-bold text-sm";
                                fallback.textContent =
                                  tender.company && tender.company.length > 0
                                    ? tender.company.charAt(0)
                                    : "?";
                                target.parentElement.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-bold text-sm">
                            {tender.company && tender.company.length > 0
                              ? tender.company.charAt(0)
                              : "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm">{tender.company}</h3>
                        <p className="text-xs text-gray-500">
                          ذخیره شده در {formatDate(tender.savedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tender Title */}
                  <Link href={`/tender-details?id=${tender.id}`}>
                    <h2 className="font-bold text-lg mb-2 hover:text-orange-600">
                      {tender.title}
                    </h2>
                  </Link>

                  {/* Tender Image */}
                  {tender.imageUrl && (
                    <Link href={`/tender-details?id=${tender.id}`}>
                      <div className="w-full h-64 bg-gray-200 rounded-lg mb-3 overflow-hidden relative">
                        <img
                          src={tender.imageUrl}
                          alt={tender.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            if (target.parentElement) {
                              target.parentElement.className =
                                "w-full h-64 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg mb-3 flex items-center justify-center";
                              target.parentElement.innerHTML = `
                                <svg class="w-24 h-24 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                              `;
                            }
                          }}
                        />
                        {tender.deadline && (
                          <div className="absolute top-2 right-2">
                            <TenderTimer
                              deadline={tender.deadline}
                              label="مهلت دریافت اسناد"
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Category Badge */}
                  <div className="mb-3">
                    <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                      {tender.category}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-600">
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
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-sm">{tender.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span className="text-sm">{tender.comments}</span>
                      </div>
                      <button
                        onClick={() => toggleSave(tender.id)}
                        className="text-orange-600"
                        title="حذف از ذخیره شده"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SupplierNavigation />
    </div>
  );
}

export default function SavedTenders() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gray-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      }
    >
      <SavedTendersContent />
    </Suspense>
  );
}
