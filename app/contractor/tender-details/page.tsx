"use client";

import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

interface Tender {
  id: string;
  title: string;
  company: string;
  description: string | null;
  tenderNumber: string | null;
  tenderType: string | null;
  publishDate: string;
  deadline: string | null;
  deliveryLocation: string | null;
  estimatedMin: number | null;
  estimatedMax: number | null;
  images: string | null;
  phase: string | null;
  categories: Array<{ category: string }>;
  requirements: Array<any>;
  contractorViews?: number;
  supplierViews?: number;
  userRegistered?: boolean;
  userSaved?: boolean;
  _count: {
    Likes: number;
    Saves: number;
    Comments: number;
  };
}


function ContractorTenderDetailsContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tenderId = searchParams.get("id");
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    // دریافت userId از localStorage
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }

    // دریافت اطلاعات مناقصه
    if (tenderId) {
      const url = storedUserId 
        ? `/api/tenders/${tenderId}?userId=${storedUserId}`
        : `/api/tenders/${tenderId}`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.tender) {
            setTender(data.tender);
          } else {
            console.error("Error fetching tender:", data.error);
            alert(data.error || "مناقصه یافت نشد");
          }
        })
        .catch(error => {
          console.error("Error fetching tender:", error);
          alert("خطا در دریافت اطلاعات مناقصه");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [tenderId]);

  const handleRegisterInterest = async () => {
    if (!userId || !tenderId || isRegistering) {
      return;
    }

    try {
      setIsRegistering(true);
      const response = await fetch(`/api/tenders/${tenderId}/register-interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // به‌روزرسانی وضعیت در state
        setTender(prev => prev ? { ...prev, userRegistered: true } : null);
        alert("اعلام آمادگی شما با موفقیت ثبت شد");
      } else {
        alert(data.error || "خطا در ثبت اعلام آمادگی");
      }
    } catch (error) {
      console.error("Error registering interest:", error);
      alert("خطا در ثبت اعلام آمادگی");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDownloadDocuments = async () => {
    if (!tenderId) {
      return;
    }

    try {
      const response = await fetch(`/api/tenders/${tenderId}/export`);
      
      if (!response.ok) {
        throw new Error('خطا در دانلود فایل');
      }

      // دریافت فایل به صورت blob
      const blob = await response.blob();
      
      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `مناقصه_${tender?.tenderNumber || tenderId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading documents:", error);
      alert("خطا در دانلود فایل Excel");
    }
  };

  const handleToggleSave = async () => {
    if (!userId || !tenderId || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/tenders/${tenderId}/saves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // به‌روزرسانی وضعیت در state
        setTender(prev => prev ? { ...prev, userSaved: data.saved } : null);
      } else {
        alert(data.error || "خطا در ذخیره کردن مناقصه");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      alert("خطا در ذخیره کردن مناقصه");
    } finally {
      setIsSaving(false);
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

  const formatPrice = (min: number | null, max: number | null) => {
    if (min && max) {
      return `${(min / 1000000000).toFixed(1)}-${(max / 1000000000).toFixed(1)} میلیارد تومان`;
    } else if (min) {
      return `${(min / 1000000000).toFixed(1)} میلیارد تومان`;
    }
    return "نامشخص";
  };

  const calculateDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Link href="/contractor/home" className="text-gray-600">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold">جزئیات مناقصه</h1>
            <button className="text-gray-600">⋯</button>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">مناقصه یافت نشد</p>
          <Link href="/contractor/home" className="text-blue-600 font-medium">
            بازگشت
          </Link>
        </div>
      </div>
    );
  }

  const images = tender.images ? tender.images.split(",") : [];
  const daysRemaining = calculateDaysRemaining(tender.deadline);

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">جزئیات مناقصه</h1>
          <button className="text-gray-600">⋯</button>
        </div>
      </div>

      <div className="pb-20">
        {/* Image Gallery */}
        <div className="relative bg-white">
          {images.length > 0 ? (
            <div className="relative w-full h-80 bg-gray-200">
              <img
                src={images[currentImage]}
                alt={tender.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  if (target.parentElement) {
                    target.parentElement.className =
                      "relative w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center";
                    target.parentElement.innerHTML = `
                      <span class="text-8xl">📄</span>
                    `;
                  }
                }}
              />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-2 h-2 rounded-full ${currentImage === idx ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-8xl">📄</span>
            </div>
          )}
        </div>

        {/* Company Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {tender.company && tender.company.length > 0 ? tender.company.charAt(0) : "?"}
            </div>
            <div>
              <h2 className="font-bold text-lg">{tender.company}</h2>
              <p className="text-sm text-gray-600">کارفرما</p>
            </div>
          </div>
          {daysRemaining !== null && daysRemaining > 0 && (
            <div className="mt-3 bg-red-50 border-r-4 border-red-500 p-3 rounded">
              <p className="text-sm text-gray-600">⏰ مهلت باقی‌مانده:</p>
              <p className="font-bold text-red-600">{daysRemaining} روز تا پایان</p>
            </div>
          )}
        </div>

        {/* Tender Info */}
        <div className="bg-white p-4 border-b border-gray-200">
          <h2 className="font-bold text-xl mb-3">{tender.title}</h2>
          {tender.categories && tender.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tender.categories.map((cat, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {cat.category}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-2 text-sm">
            {tender.tenderNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">شماره مناقصه:</span>
                <span className="font-medium">{tender.tenderNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">تاریخ انتشار:</span>
              <span className="font-medium">{formatDate(tender.publishDate)}</span>
            </div>
            {tender.deadline && (
              <div className="flex justify-between">
                <span className="text-gray-600">مهلت ارسال:</span>
                <span className="font-medium text-red-600">{formatDate(tender.deadline)}</span>
              </div>
            )}
            {(tender.estimatedMin || tender.estimatedMax) && (
              <div className="flex justify-between">
                <span className="text-gray-600">محدوده قیمت:</span>
                <span className="font-medium text-green-600">{formatPrice(tender.estimatedMin, tender.estimatedMax)}</span>
              </div>
            )}
            {tender.deliveryLocation && (
              <div className="flex justify-between">
                <span className="text-gray-600">محل تحویل اسناد:</span>
                <span className="font-medium">{tender.deliveryLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Estimate by Categories */}
        {tender.categories && tender.categories.length > 0 && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3">دسته‌بندی‌های مناقصه</h3>
            <div className="space-y-3">
              {tender.categories.map((cat, idx) => {
                const colors = [
                  "bg-blue-50 text-blue-900",
                  "bg-green-50 text-green-900",
                  "bg-purple-50 text-purple-900",
                  "bg-yellow-50 text-yellow-900",
                  "bg-orange-50 text-orange-900",
                ];
                const textColors = [
                  "text-blue-700",
                  "text-green-700",
                  "text-purple-700",
                  "text-yellow-700",
                  "text-orange-700",
                ];
                const colorIndex = idx % colors.length;
                return (
                  <div key={idx} className={`${colors[colorIndex]} rounded-lg p-3`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{cat.category}</span>
                      {(tender.estimatedMin || tender.estimatedMax) && (
                        <span className={`font-bold ${textColors[colorIndex]}`}>
                          {formatPrice(tender.estimatedMin, tender.estimatedMax)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {tender.description && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-2">توضیحات</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{tender.description}</p>
          </div>
        )}

        {/* Requirements */}
        {tender.requirements && tender.requirements.length > 0 && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3">نیازمندی‌های پروژه</h3>
            <div className="space-y-3">
              {tender.requirements.map((req: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      <span className="font-medium">{req.category || "عمومی"}</span>
                    </div>
                  </div>
                  {req.description && (
                    <p className="text-sm text-gray-600 mb-1">{req.description}</p>
                  )}
                  {req.quantity && (
                    <p className="text-sm text-gray-600 mb-1">مقدار: {req.quantity}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competition Analysis */}
        <div className="bg-white p-4 border-b border-gray-200">
          <h3 className="font-bold mb-3">تحلیل رقابت</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">تعداد لایک‌ها</span>
                <span className="font-bold text-lg">{tender._count?.Likes || 0}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">تعداد کامنت‌ها</span>
                <span className="font-bold text-lg text-blue-600">{tender._count?.Comments || 0}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">تعداد ذخیره‌ها</span>
                <span className="font-bold text-lg">{tender._count?.Saves || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="space-y-3">
            {tender.userRegistered ? (
              <div className="w-full bg-green-50 border-2 border-green-500 text-green-700 py-3 rounded-lg font-medium text-center">
                ✓ اعلام آمادگی شما ثبت شده است
              </div>
            ) : (
              <button
                onClick={handleRegisterInterest}
                disabled={isRegistering || !userId}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {isRegistering ? "در حال ثبت..." : "اعلام آمادگی (I'm Interested)"}
              </button>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadDocuments}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                دانلود اسناد
              </button>
              <button
                onClick={handleToggleSave}
                disabled={isSaving || !userId}
                className={`px-4 py-3 border rounded-lg transition-colors ${
                  tender.userSaved
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 hover:bg-gray-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={tender.userSaved ? "حذف از ذخیره شده" : "ذخیره کردن"}
              >
                <svg
                  className="w-6 h-6"
                  fill={tender.userSaved ? "currentColor" : "none"}
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowViewsModal(true);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-gray-50 transition-colors"
                title="مشاهده آمار بازدید"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="text-sm">
                  {(tender?.contractorViews || 0) + (tender?.supplierViews || 0)}
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Views Statistics Modal */}
      {mounted && showViewsModal && tender && createPortal(
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowViewsModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">آمار بازدیدکنندگان</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewsModal(false);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">پیمانکاران</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {tender.contractorViews || 0}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (() => {
                          const total = (tender.contractorViews || 0) + (tender.supplierViews || 0);
                          return total > 0 ? ((tender.contractorViews || 0) / total) * 100 : 0;
                        })()
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">تأمین‌کنندگان</span>
                  <span className="text-2xl font-bold text-green-600">
                    {tender.supplierViews || 0}
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (() => {
                          const total = (tender.contractorViews || 0) + (tender.supplierViews || 0);
                          return total > 0 ? ((tender.supplierViews || 0) / total) * 100 : 0;
                        })()
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">مجموع بازدیدها</span>
                  <span className="text-xl font-bold text-gray-800">
                    {(tender.contractorViews || 0) + (tender.supplierViews || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ContractorTenderDetails() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gray-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      }
    >
      <ContractorTenderDetailsContent />
    </Suspense>
  );
}
