"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";
import TenderTimer from "@/components/TenderTimer";
import { getPetrochemicalLogo, isPetrochemicalCompany } from "@/lib/petrochemical-logos";

interface Story {
  id: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    role: string;
  };
  type: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  views: number;
  hasNew: boolean;
  createdAt: string;
  expiresAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  Users: {
    id: string;
    phone: string;
    role: string;
    Companies: {
      id: string;
      name: string;
      logo: string | null;
    } | null;
  };
}

interface TenderCard {
  id: string;
  title: string;
  company: string;
  estimatedPrice: string;
  category: string;
  contractorViews: number;
  supplierViews: number;
  competitionScore: number;
  userLiked: boolean;
  userSaved: boolean;
  userFollowing: boolean;
  likes: number;
  comments: number;
  imageUrl?: string;
  deadline?: string;
  documentDeliveryDeadline?: string;
}

export default function ContractorHome() {
  const [stories, setStories] = useState<Story[]>([]);
  const [tenders, setTenders] = useState<TenderCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPetrochemicals, setSelectedPetrochemicals] = useState<
    string[]
  >([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000000000000,
  });

  // پتروشیمی‌های منطقه ویژه ماهشهر
  const petrochemicalCompanies = [
    "پتروشیمی بندرامام",
    "پتروشیمی اروند",
    "پتروشیمی پارس",
    "پتروشیمی جم",
    "پتروشیمی فجر",
  ];

  const handleLogout = () => {
    if (confirm("آیا می‌خواهید از برنامه خارج شوید؟")) {
      localStorage.removeItem("userId");
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  };
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    tenderId: string | null;
  }>({
    open: false,
    tenderId: null,
  });
  
  // State برای نظرات هر مناقصه
  const [tenderComments, setTenderComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComments, setSubmittingComments] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchStories(storedUserId);
      fetchTenders(storedUserId);
      fetchUserProfile(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user?.company) {
          setCompanyLogo(data.user.company.logo || null);
          setCompanyName(data.user.company.name || "");
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchStories = async (userId: string) => {
    try {
      const response = await fetch(`/api/stories?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const fetchTenders = async (
    userId: string,
    filters?: {
      petrochemicals?: string[];
      minPrice?: number;
      maxPrice?: number;
    }
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("limit", "20");
      params.append("userId", userId); // اضافه کردن userId برای بررسی userSaved

      if (filters?.petrochemicals && filters.petrochemicals.length > 0) {
        // Encode each petrochemical name separately to handle Persian characters
        const encodedPetrochemicals = filters.petrochemicals.map(p => encodeURIComponent(p));
        params.append("petrochemicals", encodedPetrochemicals.join(","));
      }
      if (filters?.minPrice !== undefined && filters.minPrice > 0) {
        params.append("minPrice", filters.minPrice.toString());
      }
      if (filters?.maxPrice !== undefined && filters.maxPrice < 1000000000000) {
        params.append("maxPrice", filters.maxPrice.toString());
      }

      const response = await fetch(`/api/tenders?${params.toString()}`);
      const data = await response.json();

      console.log("API Response status:", response.status);
      console.log("API Response data:", data);

      if (response.ok && data.tenders) {
        console.log("Tenders fetched:", data.tenders.length);
        // تبدیل داده‌های API به فرمت TenderCard
        interface ApiTender {
          id: string;
          title?: string;
          company?: string;
          phase?: string;
          estimatedMin?: number;
          estimatedMax?: number;
          images?: string | null;
          categories?: Array<{ category: string }>;
          contractorViews?: number;
          supplierViews?: number;
          competitionScore?: number;
          userLiked?: boolean;
          userSaved?: boolean;
          userFollowing?: boolean;
          deadline?: string;
          documentDeliveryDeadline?: string;
          _count?: {
            likes?: number;
            comments?: number;
            saves?: number;
          };
        }
        const formattedTenders = await Promise.all(
          (data.tenders || []).map(async (tender: ApiTender) => {
            // ثبت view برای این مناقصه
            if (tender.id && userId) {
              try {
                await fetch(`/api/tenders/${tender.id}/view`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId,
                    userRole: "contractor",
                  }),
                });
              } catch (error) {
                console.error("Error recording view:", error);
              }
            }

            const estimatedPrice =
              tender.estimatedMin && tender.estimatedMax
                ? `${(tender.estimatedMin / 1000000000).toFixed(1)}-${(
                    tender.estimatedMax / 1000000000
                  ).toFixed(1)} میلیارد تومان`
                : tender.estimatedMin
                ? `${(tender.estimatedMin / 1000000000).toFixed(
                    1
                  )} میلیارد تومان`
                : "نامشخص";

            return {
              id: tender.id,
              title: tender.title || "بدون عنوان",
              company: tender.company || "نامشخص",
              estimatedPrice,
              category:
                tender.categories && tender.categories.length > 0
                  ? tender.categories[0].category
                  : "عمومی",
              contractorViews: tender.contractorViews || 0,
              supplierViews: tender.supplierViews || 0,
              competitionScore: tender.competitionScore || 0,
              userLiked: tender.userLiked || false,
              userSaved: tender.userSaved || false,
              userFollowing: tender.userFollowing || false,
              likes: tender._count?.likes || 0,
              comments: tender._count?.comments || 0,
              imageUrl: tender.images || undefined,
              deadline: tender.deadline,
              documentDeliveryDeadline: tender.documentDeliveryDeadline,
            };
          })
        );
        console.log("Formatted tenders:", formattedTenders.length);
        setTenders(formattedTenders);
      } else {
        console.error("API Error:", data.error);
        setTenders([]);
      }
    } catch (error) {
      console.error("Error fetching tenders:", error);
      setTenders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (tenderId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/tenders/${tenderId}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // به‌روزرسانی state
        setTenders((prev) =>
          prev.map((tender) =>
            tender.id === tenderId
              ? {
                  ...tender,
                  userLiked: data.liked,
                  likes: data.likes !== undefined ? data.likes : (data.liked ? tender.likes + 1 : Math.max(0, tender.likes - 1)),
                }
              : tender
          )
        );
      } else {
        console.error("Error toggling like:", data);
        alert(data.error || "خطا در لایک کردن مناقصه");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("خطا در لایک کردن مناقصه");
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

      const data = await response.json();

      if (response.ok) {
        // به‌روزرسانی state
        setTenders((prev) =>
          prev.map((tender) =>
            tender.id === tenderId
              ? { ...tender, userSaved: data.saved }
              : tender
          )
        );
      } else {
        console.error("Error toggling save:", data);
        alert(data.error || "خطا در ذخیره کردن مناقصه");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      alert("خطا در ذخیره کردن مناقصه");
    }
  };

  const toggleFollow = async (tenderId: string) => {
    if (!userId) return;

    try {
      // TODO: پیاده‌سازی API برای Follow
      setTenders((prev) =>
        prev.map((tender) =>
          tender.id === tenderId
            ? { ...tender, userFollowing: !tender.userFollowing }
            : tender
        )
      );
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleShare = (tenderId: string) => {
    setShareModal({ open: true, tenderId });
  };

  const fetchComments = async (tenderId: string) => {
    try {
      const response = await fetch(`/api/tenders/${tenderId}/comments`);
      const data = await response.json();

      if (response.ok && data.comments) {
        setTenderComments(prev => ({
          ...prev,
          [tenderId]: data.comments,
        }));
        
        // به‌روزرسانی شمارنده نظرات
        setTenders(prev =>
          prev.map(tender =>
            tender.id === tenderId
              ? { ...tender, comments: data.comments.length }
              : tender
          )
        );
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmitComment = async (tenderId: string) => {
    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    const content = commentInputs[tenderId]?.trim();
    if (!content) {
      alert("لطفاً متن نظر را وارد کنید");
      return;
    }

    try {
      setSubmittingComments(prev => ({ ...prev, [tenderId]: true }));
      
      const response = await fetch(`/api/tenders/${tenderId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          content,
        }),
      });

      const data = await response.json();

      if (response.ok && data.comment) {
        // پاک کردن input
        setCommentInputs(prev => {
          const newInputs = { ...prev };
          delete newInputs[tenderId];
          return newInputs;
        });
        
        // افزودن نظر جدید به لیست
        setTenderComments(prev => ({
          ...prev,
          [tenderId]: [data.comment, ...(prev[tenderId] || [])],
        }));
        
        // به‌روزرسانی تعداد کامنت‌ها
        setTenders(prev =>
          prev.map(tender =>
            tender.id === tenderId
              ? { ...tender, comments: tender.comments + 1 }
              : tender
          )
        );
      } else {
        alert(data.error || "خطا در ارسال نظر");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("خطا در ارسال نظر");
    } finally {
      setSubmittingComments(prev => ({ ...prev, [tenderId]: false }));
    }
  };

  const toggleComments = (tenderId: string) => {
    setExpandedComments(prev => {
      const isExpanding = !prev[tenderId];
      const newExpanded = {
        ...prev,
        [tenderId]: isExpanding,
      };
      
      // اگر نظرات باز شد و هنوز دریافت نشده، دریافت کن
      if (isExpanding && !tenderComments[tenderId]) {
        fetchComments(tenderId);
      }
      
      return newExpanded;
    });
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

  const copyLink = async (tenderId: string) => {
    const origin = globalThis.window?.location?.origin || "";
    const link = `${origin}/contractor/tender-details?id=${tenderId}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("لینک کپی شد!");
      setShareModal({ open: false, tenderId: null });
    } catch (error) {
      console.error("Error copying link:", error);
      alert("خطا در کپی لینک");
    }
  };

  const shareViaWhatsApp = (tenderId: string) => {
    const origin = globalThis.window?.location?.origin || "";
    const link = `${origin}/contractor/tender-details?id=${tenderId}`;
    const text = encodeURIComponent(
      `مناقصه: ${tenders.find((t) => t.id === tenderId)?.title || ""}\n${link}`
    );
    if (globalThis.window) {
      globalThis.window.open(`https://wa.me/?text=${text}`, "_blank");
    }
    setShareModal({ open: false, tenderId: null });
  };

  const shareViaTelegram = (tenderId: string) => {
    const origin = globalThis.window?.location?.origin || "";
    const link = `${origin}/contractor/tender-details?id=${tenderId}`;
    const text = encodeURIComponent(
      `مناقصه: ${tenders.find((t) => t.id === tenderId)?.title || ""}\n${link}`
    );
    if (globalThis.window) {
      globalThis.window.open(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`,
        "_blank"
      );
    }
    setShareModal({ open: false, tenderId: null });
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
        <p className="text-gray-500">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">وین تندر</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(true)}
              className="text-gray-600"
              title="فیلتر مناقصات"
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-600"
              title="خروج از برنامه"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stories Section - Instagram style */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide stories-container px-4"
          style={{ minWidth: "100%" }}
        >
          {/* Add Story Button */}
          <div className="shrink-0 w-20 text-center">
            <Link href="/contractor/stories/create">
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto overflow-hidden ${
                    companyLogo
                      ? "bg-white ring-2 ring-offset-2 ring-blue-500"
                      : "bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-offset-2 ring-blue-500"
                  }`}
                >
                  {companyLogo ? (
                    <Image
                      src={companyLogo}
                      alt={companyName || "استوری شما"}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized
                    />
                  ) : (
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600">استوری شما</p>
            </Link>
          </div>

          {/* Stories */}
          {stories.length > 0 ? (
            stories.map((story) => (
              <Link
                key={story.id}
                href={`/contractor/stories/view?id=${story.id}`}
                className="shrink-0 w-20 text-center"
              >
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2 overflow-hidden ${
                      story.hasNew
                        ? "ring-2 ring-offset-2 ring-blue-500"
                        : ""
                    } ${
                      story.company.logo
                        ? "bg-white"
                        : story.hasNew
                        ? "bg-gradient-to-br from-blue-500 to-purple-600"
                        : "bg-gradient-to-br from-gray-400 to-gray-600"
                    }`}
                  >
                    {story.company.logo ? (
                      <Image
                        src={story.company.logo}
                        alt={story.company.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-full"
                        unoptimized
                      />
                    ) : (
                      story.company.name && story.company.name.length > 0 ? story.company.name.charAt(0) : "?"
                    )}
                  </div>
                  {story.hasNew && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {story.company.name}
                </p>
              </Link>
            ))
          ) : (
            <div className="shrink-0 w-20 text-center">
              <p className="text-xs text-gray-400">هیچ استوری وجود ندارد</p>
            </div>
          )}
        </div>
      </div>

      {/* Tender Feed */}
      <div className="pb-20">
        {tenders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">هیچ مناقصه‌ای یافت نشد</p>
            <Link
              href="/contractor/explore"
              className="text-blue-600 font-medium"
            >
              جستجوی مناقصات
            </Link>
          </div>
        ) : (
          tenders.map((tender) => (
            <div
              key={tender.id}
              className="bg-white border-b border-gray-200 mb-2"
            >
              {/* Tender Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {isPetrochemicalCompany(tender.company) && getPetrochemicalLogo(tender.company) ? (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
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
                              const fallback = document.createElement("span");
                              fallback.className = "text-blue-600 font-bold text-sm";
                              fallback.textContent = tender.company && tender.company.length > 0 ? tender.company.charAt(0) : "?";
                              target.parentElement.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {tender.company && tender.company.length > 0 ? tender.company.charAt(0) : "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm">{tender.company}</h3>
                    </div>
                  </div>
                </div>

                {/* Tender Title */}
                <Link href={`/contractor/tender-details?id=${tender.id}`}>
                  <h2 className="font-bold text-lg mb-2 hover:text-blue-600">
                    {tender.title}
                  </h2>
                </Link>

                {/* Tender Image */}
                {tender.imageUrl && (
                  <Link href={`/contractor/tender-details?id=${tender.id}`}>
                    <div className="w-full h-64 bg-gray-200 rounded-lg mb-3 overflow-hidden relative">
                      <img
                        src={tender.imageUrl}
                        alt={tender.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // اگر عکس لود نشد، placeholder نمایش بده
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.parentElement) {
                            target.parentElement.className =
                              "w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3 flex items-center justify-center";
                            target.parentElement.innerHTML = `
                              <svg class="w-24 h-24 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                            `;
                          }
                        }}
                      />
                      {/* Timers on the left side */}
                      <div className="absolute left-2 top-2 flex flex-col gap-2 z-10">
                        {tender.deadline && (
                          <TenderTimer
                            deadline={tender.deadline}
                            label="مهلت دریافت اسناد"
                            className="w-32"
                          />
                        )}
                        {tender.documentDeliveryDeadline && (
                          <TenderTimer
                            deadline={tender.documentDeliveryDeadline}
                            label="مهلت تحویل اسناد"
                            className="w-32"
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                )}

                {/* Tender Info */}
                <div className="space-y-2 mb-3">
                  {tender.estimatedPrice && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">قیمت برآوردی:</span>
                      <span>{tender.estimatedPrice}</span>
                    </div>
                  )}
                  {tender.category && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">دسته‌بندی:</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {tender.category}
                      </span>
                    </div>
                  )}
                  {tender.competitionScore !== undefined && tender.competitionScore > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">امتیاز رقابت:</span>
                        <span
                          className={`font-bold ${
                            tender.competitionScore > 70
                              ? "text-red-600"
                              : tender.competitionScore > 40
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {tender.competitionScore}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(tender.id)}
                      className={`flex items-center gap-1 ${
                        tender.userLiked ? "text-red-500" : "text-gray-600"
                      }`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill={tender.userLiked ? "#ef4444" : "none"}
                        stroke={tender.userLiked ? "#ef4444" : "currentColor"}
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
                    </button>

                    <button
                      onClick={() => toggleComments(tender.id)}
                      className="flex items-center gap-1 text-gray-600"
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
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-sm">{tender.comments}</span>
                    </button>

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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span className="text-sm">{tender.contractorViews + tender.supplierViews}</span>
                    </div>

                    <button
                      onClick={() => toggleSave(tender.id)}
                      className={`transition-colors ${
                        tender.userSaved ? "text-blue-600" : "text-gray-600"
                      }`}
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
                      onClick={() => handleShare(tender.id)}
                      className="text-gray-600"
                      title="اشتراک"
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
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => toggleFollow(tender.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      tender.userFollowing
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tender.userFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
                  </button>
                </div>
              </div>

              {/* Comments Section - Instagram Style */}
              {expandedComments[tender.id] && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Comments List */}
                  <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                    {tenderComments[tender.id] && tenderComments[tender.id].length > 0 ? (
                      tenderComments[tender.id].map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {comment.Users.Companies?.name && comment.Users.Companies.name.length > 0
                              ? comment.Users.Companies.name.charAt(0)
                              : "پ"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-2xl px-3 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm">
                                  {comment.Users.Companies?.name || "پیمانکار"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 break-words">
                                {comment.content}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 mr-2">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        هنوز نظری ثبت نشده است
                      </p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  {userId && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[tender.id] || ""}
                        onChange={(e) =>
                          setCommentInputs(prev => ({
                            ...prev,
                            [tender.id]: e.target.value,
                          }))
                        }
                        placeholder="نظر خود را بنویسید..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment(tender.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitComment(tender.id)}
                        disabled={submittingComments[tender.id] || !commentInputs[tender.id]?.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                      >
                        {submittingComments[tender.id] ? "..." : "ارسال"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Share Modal */}
      {shareModal.open && shareModal.tenderId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShareModal({ open: false, tenderId: null })}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">اشتراک‌گذاری</h3>
              <button
                onClick={() => setShareModal({ open: false, tenderId: null })}
                className="text-gray-500"
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

            <div className="space-y-3">
              <button
                onClick={() => copyLink(shareModal.tenderId!)}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-right"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">کپی لینک</p>
                  <p className="text-xs text-gray-500">کپی لینک مناقصه</p>
                </div>
              </button>

              <button
                onClick={() => shareViaWhatsApp(shareModal.tenderId!)}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-right"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">واتساپ</p>
                  <p className="text-xs text-gray-500">
                    اشتراک‌گذاری در واتساپ
                  </p>
                </div>
              </button>

              <button
                onClick={() => shareViaTelegram(shareModal.tenderId!)}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-right"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">تلگرام</p>
                  <p className="text-xs text-gray-500">
                    اشتراک‌گذاری در تلگرام
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="absolute top-0 left-0 right-0 bg-white rounded-b-3xl p-6 max-h-[80vh] overflow-y-auto slide-down shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">فیلتر مناقصات</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Petrochemical Companies Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">پتروشیمی‌ها</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPetrochemicals.length === petrochemicalCompanies.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPetrochemicals([...petrochemicalCompanies]);
                      } else {
                        setSelectedPetrochemicals([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">انتخاب همه</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {petrochemicalCompanies.map((petro) => (
                  <button
                    key={petro}
                    onClick={() => {
                      if (selectedPetrochemicals.includes(petro)) {
                        setSelectedPetrochemicals(
                          selectedPetrochemicals.filter((p) => p !== petro)
                        );
                      } else {
                        setSelectedPetrochemicals([
                          ...selectedPetrochemicals,
                          petro,
                        ]);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm border-2 flex items-center gap-2 ${
                      selectedPetrochemicals.includes(petro)
                        ? "border-blue-600 bg-blue-100 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    {getPetrochemicalLogo(petro) ? (
                      <Image
                        src={getPetrochemicalLogo(petro)!}
                        alt={petro}
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                        unoptimized
                      />
                    ) : null}
                    {petro}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                محدوده قیمت برآورد (میلیارد تومان)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={priceRange.min / 1000000000}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        min: Number.parseFloat(e.target.value) * 1000000000,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="حداقل"
                  />
                  <span className="text-gray-600">تا</span>
                  <input
                    type="number"
                    value={priceRange.max / 1000000000}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        max: Number.parseFloat(e.target.value) * 1000000000,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="حداکثر"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange.min / 1000000000}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        min: Number.parseFloat(e.target.value) * 1000000000,
                      })
                    }
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange.max / 1000000000}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        max: Number.parseFloat(e.target.value) * 1000000000,
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPetrochemicals([]);
                  setPriceRange({ min: 0, max: 1000000000000 });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
              >
                پاک کردن
              </button>
              <button
                onClick={() => {
                  setShowFilters(false);
                  if (userId) {
                    fetchTenders(userId, {
                      petrochemicals:
                        selectedPetrochemicals.length > 0
                          ? selectedPetrochemicals
                          : undefined,
                      minPrice: priceRange.min > 0 ? priceRange.min : undefined,
                      maxPrice:
                        priceRange.max < 1000000000000
                          ? priceRange.max
                          : undefined,
                    });
                  }
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                اعمال فیلتر
              </button>
            </div>
          </div>
        </div>
      )}

      <ContractorNavigation />
    </div>
  );
}
