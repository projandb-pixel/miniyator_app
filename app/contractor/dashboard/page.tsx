"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

export default function ContractorDashboard() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    companyType: "",
    registrationNumber: "",
    nationalId: "",
    address: "",
    officePhone: "",
    email: "",
    website: "",
    workingHours: "",
    welcomeMessage: "",
    bio: "",
    categories: [] as string[],
    city: "",
    province: "",
    activityType: "", // برای پیمانکاران
    logo: "",
  });

  const [stats, setStats] = useState({
    tendersViewed: 0,
    tendersLiked: 0,
    tendersReviewed: 0,
    tendersSaved: 0,
    inquiriesCreated: 0, // برگزار شده
    inquiriesInReview: 0, // در مرحله بررسی
    inquiriesCompleted: 0, // خاتمه یافته
    inquiriesSuccessful: 0, // همکاری موفق
    supplierSatisfaction: 0, // درصد رضایت
    profileViews: 0, // تعداد بازدید از پروفایل
    winGramActivity: 0, // میزان فعالیت در وین گرام
  });
  const [timeRange, setTimeRange] = useState<
    "week" | "month" | "quarter" | "all"
  >("all");
  const [inquiryTimeRange, setInquiryTimeRange] = useState<
    "week" | "month" | "quarter" | "all"
  >("all");
  const [activityTimeRange, setActivityTimeRange] = useState<
    "week" | "month" | "quarter" | "all"
  >("all");

  const [recentActivities, setRecentActivities] = useState<
    Array<{
      id: string;
      type: "saved" | "inquiry";
      title: string;
      company: string;
      date: string;
    }>
  >([]);

  const [suggestedSuppliers, setSuggestedSuppliers] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      logo?: string;
      rating?: number;
      verified?: boolean;
    }>
  >([]);

  const specializations = [
    "مکانیک (استاتیک)",
    "مکانیک (روتاری)",
    "برق و ابزار دقیق",
    "سیویل",
    "HSE",
    "خرید/بازرگانی",
  ];

  const categories = [
    "مکانیک (استاتیک)",
    "مکانیک (روتاری)",
    "برق و ابزاردقیق",
    "سیویل",
    "تجهیزات عمومی",
    "مواد شیمیایی",
    "خدمات مهندسی",
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchProfile(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setUserRole(profile.role);
      if (profile.role === "contractor") {
        if (userId) {
          fetchStats(userId, timeRange, inquiryTimeRange, activityTimeRange);
          fetchRecentActivity(userId);
          fetchSuggestedSuppliers(userId);
        }
      } else {
        // اگر تأمین‌کننده است، به dashboard مخصوص تأمین‌کننده هدایت کن
        if (globalThis.window) {
          globalThis.window.location.href = "/supplier/dashboard";
        }
      }
    }
  }, [profile, userId, timeRange, inquiryTimeRange, activityTimeRange]);

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile?userId=${id}`);
      const data = await response.json();

      if (data.user) {
        setProfile(data.user);

        // اگر company وجود دارد، فرم را پر کن
        if (data.user.company) {
          setProfileForm({
            name: data.user.company.name || "",
            companyType: data.user.company.companyType || "",
            registrationNumber: data.user.company.registrationNumber || "",
            nationalId: data.user.company.nationalId || "",
            address: data.user.company.address || "",
            officePhone: data.user.company.officePhone || "",
            email: data.user.company.email || "",
            website: data.user.company.website || "",
            workingHours: data.user.company.workingHours || "",
            welcomeMessage: data.user.company.welcomeMessage || "",
            bio: data.user.company.bio || "",
            categories:
              data.user.company.categories?.map(
                (c: { category: string }) => c.category
              ) || [],
            city: data.user.company.city || "",
            province: data.user.company.province || "",
            activityType: data.user.company.activityType || "",
            logo: data.user.company.logo || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (
    id: string,
    range: "week" | "month" | "quarter" | "all" = "all",
    inquiryRange: "week" | "month" | "quarter" | "all" = "all",
    activityRange: "week" | "month" | "quarter" | "all" = "all"
  ) => {
    try {
      const url = `/api/contractor/dashboard/stats?userId=${id}&timeRange=${range}&inquiryTimeRange=${inquiryRange}&activityTimeRange=${activityRange}`;
      console.log("Fetching stats with:", {
        id,
        range,
        inquiryRange,
        activityRange,
        url,
      });

      const response = await fetch(url);
      if (!response.ok) {
        console.error(
          "Error fetching stats:",
          response.status,
          response.statusText
        );
        return;
      }
      const data = await response.json();
      console.log("Dashboard Stats Response:", {
        url: response.url,
        userId: id,
        timeRange: range,
        data,
        tendersViewed: data.tendersViewed,
        tendersLiked: data.tendersLiked,
        tendersReviewed: data.tendersReviewed,
        tendersSaved: data.tendersSaved,
        winGramActivity: data.winGramActivity,
      });
      if (data && !data.error) {
        // اطمینان از اینکه همه فیلدها مقدار دارند
        setStats({
          tendersViewed: data.tendersViewed ?? 0,
          tendersLiked: data.tendersLiked ?? 0,
          tendersReviewed: data.tendersReviewed ?? 0,
          tendersSaved: data.tendersSaved ?? 0,
          inquiriesCreated: data.inquiriesCreated ?? 0,
          inquiriesInReview: data.inquiriesInReview ?? 0,
          inquiriesCompleted: data.inquiriesCompleted ?? 0,
          inquiriesSuccessful: data.inquiriesSuccessful ?? 0,
          supplierSatisfaction: data.supplierSatisfaction ?? 0,
          profileViews: data.profileViews ?? 0,
          winGramActivity: data.winGramActivity ?? 0,
        });
      } else {
        console.error("Error in stats response:", data.error);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivity = async (id: string) => {
    try {
      const response = await fetch(
        `/api/contractor/dashboard/recent-activity?userId=${id}`
      );
      const data = await response.json();
      if (data.activities) {
        setRecentActivities(data.activities);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const fetchSuggestedSuppliers = async (id: string) => {
    try {
      const response = await fetch(
        `/api/contractor/dashboard/suggested-suppliers?userId=${id}&limit=1000`
      );
      const data = await response.json();
      if (data.suppliers) {
        setSuggestedSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error("Error fetching suggested suppliers:", error);
    }
  };

  const calculateProfileCompletion = () => {
    if (!profile || !profile.company) return 0;

    const company = profile.company;
    const totalFields = 15; // تعداد کل فیلدهای مهم
    let completedFields = 0;

    // استفاده از profileForm اگر وجود دارد، در غیر این صورت از company
    const data = profileForm.name ? profileForm : company;

    // فیلدهای اصلی
    if (data.name || company.name) completedFields++;
    if (data.city || company.city) completedFields++;
    if (data.province || company.province) completedFields++;
    if (data.address || company.address) completedFields++;
    if (data.officePhone || company.officePhone) completedFields++;
    if (data.email || company.email) completedFields++;
    if (data.website || company.website) completedFields++;
    if (data.bio || company.bio) completedFields++;
    if (data.workingHours || company.workingHours) completedFields++;
    if (data.welcomeMessage || company.welcomeMessage) completedFields++;
    if (data.logo || company.logo) completedFields++;
    if (data.registrationNumber || company.registrationNumber)
      completedFields++;
    if (data.nationalId || company.nationalId) completedFields++;

    // دسته‌بندی‌ها
    let categories: string[] = [];
    if (data.categories && data.categories.length > 0) {
      categories = data.categories;
    } else if (company.categories && company.categories.length > 0) {
      categories = company.categories.map((c: { category: string } | string) =>
        typeof c === "string" ? c : c.category
      );
    }
    if (categories.length > 0) completedFields++;

    // رتبه (برای پیمانکاران)
    if (company.rank) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const calculateQualityScore = () => {
    if (!profile?.company) return 0;

    const company = profile.company;
    let score = 0;
    let maxScore = 0;

    // نام شرکت (10%)
    maxScore += 10;
    if (company.name) score += 10;

    // استان و شهر (10%)
    maxScore += 10;
    if (company.province && company.city) score += 10;

    // رتبه (20%)
    maxScore += 20;
    if (company.rank) score += 20;

    // گواهی‌نامه‌ها (30%)
    maxScore += 30;
    try {
      const bioData = company.bio ? JSON.parse(company.bio) : {};
      if (bioData.hseCertificateFile) score += 10;
      if (bioData.qualificationCertificateFile) score += 10;
      if (company.rankCertificate) score += 10;
    } catch {
      if (company.hseCertificate) score += 10;
      if (company.qualificationCertificate) score += 10;
      if (company.rankCertificate) score += 10;
    }

    // حوزه‌های تخصصی (15%)
    maxScore += 15;
    const categories = company.categories || [];
    if (categories.length > 0) {
      score += Math.min(15, categories.length * 5);
    }

    // سوابق تجربی (15%)
    maxScore += 15;
    try {
      const bioData = company.bio ? JSON.parse(company.bio) : {};
      if (bioData.projectHistory && bioData.projectHistory.length > 0) {
        score += Math.min(15, bioData.projectHistory.length * 5);
      }
    } catch {}

    return Math.round((score / maxScore) * 100);
  };

  const getMissingFields = () => {
    if (!profile?.company) {
      // اگر company وجود ندارد، فیلدهای الزامی ناقص هستند
      const required = ["نام شرکت", "شهر", "استان"];
      if (profile?.role === "contractor") {
        required.push("نوع فعالیت");
      } else {
        required.push("نوع شرکت");
      }
      return required;
    }

    const missing: string[] = [];
    if (!profileForm.name) missing.push("نام شرکت");
    if (!profileForm.province) missing.push("استان");
    if (!profileForm.city) missing.push("شهر");

    const isContractor = profile?.role === "contractor";
    if (isContractor) {
      if (!profileForm.activityType) missing.push("نوع فعالیت");
    } else {
      if (!profileForm.companyType) missing.push("نوع شرکت");
    }

    return missing;
  };

  const toggleCategory = (category: string) => {
    setProfileForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    const missing = getMissingFields();
    if (missing.length > 0) {
      alert(`لطفاً فیلدهای زیر را پر کنید:\n${missing.join("\n")}`);
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyData: {
            name: profileForm.name,
            companyType: profileForm.companyType || null,
            registrationNumber: profileForm.registrationNumber || null,
            nationalId: profileForm.nationalId || null,
            city: profileForm.city,
            province: profileForm.province,
            address: profileForm.address || null,
            officePhone: profileForm.officePhone || null,
            email: profileForm.email || null,
            website: profileForm.website || null,
            workingHours: profileForm.workingHours || null,
            welcomeMessage: profileForm.welcomeMessage || null,
            bio: profileForm.bio || null,
            logo: profileForm.logo || null,
            activityType: profileForm.activityType || null,
          },
          categories: profileForm.categories,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("پروفایل با موفقیت ذخیره شد");
        await fetchProfile(userId);
        setShowProfileForm(false);
      } else {
        alert(data.error || "خطا در ذخیره پروفایل");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("خطا در ذخیره پروفایل");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // اگر تأمین‌کننده است، به dashboard مخصوص تأمین‌کننده هدایت کن
  if (userRole === "supplier") {
    return null; // useEffect redirect خواهد کرد
  }

  const missingFields = getMissingFields();

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">داشبورد</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem("userId");
                if (globalThis.window) {
                  globalThis.window.location.href = "/auth/login";
                }
              }}
              className="text-red-600 hover:text-red-700"
              title="خروج"
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

      <div className="p-4 pb-20">
        {/* Profile Completion Banner */}
        {!showProfileForm && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-800">
                    پیشرفت تکمیل پروفایل
                  </p>
                  <span className="text-2xl font-bold text-blue-600">
                    {calculateProfileCompletion()}%
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProfileCompletion()}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {missingFields.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-gray-700 mb-2">
                  {missingFields.length} فیلد باقی مانده:{" "}
                  {missingFields.join(", ")}
                </p>
                <Link
                  href="/contractor/profile"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center block"
                >
                  تکمیل پروفایل
                </Link>
              </div>
            )}
            {missingFields.length === 0 && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-green-700 font-medium text-center">
                  ✅ پروفایل شما کامل است!
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Insights Link */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 mb-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">گزارش‌های AI</h3>
              <p className="text-sm text-blue-100">تحلیل عملکرد و رقبا</p>
            </div>
            <Link
              href="/contractor/insights"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm"
            >
              مشاهده
            </Link>
          </div>
        </div>

        {/* Contractor ID Card */}
        {profile?.company && (
          <div className="bg-white p-4 mb-4 rounded-lg border-2 border-blue-200">
            <h2 className="font-bold text-lg mb-4">شناسنامه پیمانکار</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">نام شرکت:</span>
                <span className="font-medium">
                  {profile.company.name || "-"}
                </span>
              </div>
              {profile.company.province && (
                <div className="flex justify-between">
                  <span className="text-gray-600">استان:</span>
                  <span className="font-medium">
                    {profile.company.province}
                  </span>
                </div>
              )}
              {profile.company.city && (
                <div className="flex justify-between">
                  <span className="text-gray-600">شهر:</span>
                  <span className="font-medium">{profile.company.city}</span>
                </div>
              )}
              {profile.company.rank && (
                <div className="flex justify-between">
                  <span className="text-gray-600">رتبه:</span>
                  <span className="font-medium">
                    رتبه {profile.company.rank}
                  </span>
                </div>
              )}
              {profile.company.legalType && (
                <div className="flex justify-between">
                  <span className="text-gray-600">نوع شخصیت حقوقی:</span>
                  <span className="font-medium">
                    {(() => {
                      switch (profile.company.legalType) {
                        case "sahami-khas":
                          return "سهامی خاص";
                        case "sahami-am":
                          return "سهامی عام";
                        case "masooliat-mahdud":
                          return "مسئولیت محدود";
                        default:
                          return profile.company.legalType;
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
            {/* Quality Assessment Score */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">امتیاز ارزیابی کیفی:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateQualityScore()}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${calculateQualityScore()}%` }}
                ></div>
              </div>
            </div>

            {/* Benchmarking */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3">
                📊 بین پیمانکاران مشابه (Benchmarking)
              </h3>
              <div className="space-y-2">
                {profile.company.categories &&
                  profile.company.categories.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        شما در بین پیمانکاران{" "}
                        <span className="font-semibold text-blue-700">
                          {typeof profile.company.categories[0] === "object"
                            ? profile.company.categories[0]?.category
                            : profile.company.categories[0] || "عمومی"}
                        </span>{" "}
                        جزو <span className="font-bold text-blue-700">10%</span>{" "}
                        برتر هستید
                      </p>
                    </div>
                  )}
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    شما از <span className="font-bold text-green-700">70%</span>{" "}
                    پیمانکاران سریع‌تر پاسخ می‌دهید
                  </p>
                </div>
                {profile.company.rank && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      در مقایسه با دیگر پیمانکاران هم‌رده، شما در{" "}
                      <span className="font-bold text-purple-700">
                        رده بالاتر
                      </span>{" "}
                      قرار دارید
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overall Statistics */}
        <div className="bg-white p-4 mb-4 rounded-lg">
          <h2 className="font-bold text-lg mb-4">آمار کلی</h2>

          {/* Tenders Stats */}
          <div className="mb-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-700 mb-2">مناقصات:</h3>
              {/* Time Range Filter */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button
                  onClick={() => setTimeRange("week")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    timeRange === "week"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  هفته گذشته
                </button>
                <button
                  onClick={() => setTimeRange("month")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    timeRange === "month"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  ماه گذشته
                </button>
                <button
                  onClick={() => setTimeRange("quarter")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    timeRange === "quarter"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  سه ماه گذشته
                </button>
                <button
                  onClick={() => setTimeRange("all")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    timeRange === "all"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  تاکنون
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-blue-600">
                  {stats.tendersViewed ?? 0}
                </p>
                <p className="text-xs text-gray-600">مشاهده شده</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-pink-600">
                  {stats.tendersLiked ?? 0}
                </p>
                <p className="text-xs text-gray-600">لایک شده</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-purple-600">
                  {stats.tendersReviewed ?? 0}
                </p>
                <p className="text-xs text-gray-600">بررسی شده</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-green-600">
                  {stats.tendersSaved ?? 0}
                </p>
                <p className="text-xs text-gray-600">ذخیره شده</p>
              </div>
            </div>
          </div>

          {/* Inquiries Stats */}
          <div className="mb-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-700 mb-2">استعلام‌ها:</h3>
              {/* Time Range Filter for Inquiries */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button
                  onClick={() => setInquiryTimeRange("week")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    inquiryTimeRange === "week"
                      ? "bg-orange-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  هفته گذشته
                </button>
                <button
                  onClick={() => setInquiryTimeRange("month")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    inquiryTimeRange === "month"
                      ? "bg-orange-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  ماه گذشته
                </button>
                <button
                  onClick={() => setInquiryTimeRange("quarter")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    inquiryTimeRange === "quarter"
                      ? "bg-orange-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  سه ماه گذشته
                </button>
                <button
                  onClick={() => setInquiryTimeRange("all")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    inquiryTimeRange === "all"
                      ? "bg-orange-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  تاکنون
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-orange-600">
                  {stats.inquiriesCreated ?? 0}
                </p>
                <p className="text-xs text-gray-600">برگزار شده</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-yellow-600">
                  {stats.inquiriesInReview ?? 0}
                </p>
                <p className="text-xs text-gray-600">در مرحله بررسی</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-blue-600">
                  {stats.inquiriesCompleted ?? 0}
                </p>
                <p className="text-xs text-gray-600">خاتمه یافته</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xl font-bold text-green-600">
                  {stats.inquiriesSuccessful ?? 0}
                </p>
                <p className="text-xs text-gray-600">همکاری موفق</p>
              </div>
            </div>
          </div>

          {/* WinGram Activity */}
          <div className="mb-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-700 mb-2">
                میزان فعالیت در وین گرام:
              </h3>
              {/* Time Range Filter for Activity */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button
                  onClick={() => setActivityTimeRange("week")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    activityTimeRange === "week"
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  هفته گذشته
                </button>
                <button
                  onClick={() => setActivityTimeRange("month")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    activityTimeRange === "month"
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  ماه گذشته
                </button>
                <button
                  onClick={() => setActivityTimeRange("quarter")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    activityTimeRange === "quarter"
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  سه ماه گذشته
                </button>
                <button
                  onClick={() => setActivityTimeRange("all")}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                    activityTimeRange === "all"
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  تاکنون
                </button>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {stats.winGramActivity ?? 0}
              </p>
              <p className="text-xs text-gray-600 mt-1">فعالیت کل</p>
            </div>
          </div>

          {/* Supplier Satisfaction & Profile Views */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              شاخص‌های عملکرد:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.supplierSatisfaction ?? 0}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  درصد رضایت تأمین‌کنندگان
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-2xl font-bold text-teal-600">
                  {stats.profileViews ?? 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">بازدید از پروفایل</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-4 mb-4 rounded-lg">
          <h2 className="font-bold text-lg mb-4">فعالیت‌های اخیر</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border-b border-gray-100 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {activity.type === "saved" ? "🔖" : "📧"}
                    </span>
                    <Link
                      href={
                        activity.type === "saved"
                          ? `/contractor/tender-details?id=${activity.id}`
                          : `/contractor/inquiries`
                      }
                      className="font-medium text-gray-800 hover:text-blue-600"
                    >
                      {activity.title}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">{activity.company}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(activity.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              فعالیتی ثبت نشده است
            </p>
          )}
        </div>

        {/* Favorite Suppliers */}
        <div className="bg-white p-4 mb-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">تأمین‌کنندگان مورد علاقه</h2>
            <Link href="/shared/marketplace" className="text-blue-600 text-sm">
              مشاهده همه
            </Link>
          </div>
          {suggestedSuppliers.length > 0 ? (
            <div className="space-y-3">
              {suggestedSuppliers.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/shared/supplier-profile?id=${supplier.id}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {supplier.logo ||
                      (supplier.name && supplier.name.length > 0
                        ? supplier.name.charAt(0)
                        : "?")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{supplier.name}</h3>
                      {supplier.verified && (
                        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{supplier.category}</p>
                    {supplier.rating && (
                      <p className="text-xs text-yellow-600">
                        ⭐ {supplier.rating}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              تأمین‌کننده‌ای یافت نشد
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-3 mb-4 rounded-lg">
          <h2 className="font-semibold text-sm mb-2 text-gray-700">
            عملیات سریع
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/contractor/price-inquiry"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <svg
                className="w-5 h-5 text-blue-600 mb-1"
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
              <span className="text-xs font-medium text-gray-700">
                ارسال استعلام
              </span>
            </Link>
            <Link
              href="/contractor/inquiries"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
            >
              <svg
                className="w-5 h-5 text-green-600 mb-1"
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
              <span className="text-xs font-medium text-gray-700">
                استعلام‌های من
              </span>
            </Link>
            <Link
              href="/contractor/messages"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-200"
            >
              <svg
                className="w-5 h-5 text-pink-600 mb-1"
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
              <span className="text-xs font-medium text-gray-700">پیام‌ها</span>
            </Link>
            <Link
              href="/shared/marketplace"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <svg
                className="w-5 h-5 text-purple-600 mb-1"
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
              <span className="text-xs font-medium text-gray-700">بازار</span>
            </Link>
            <Link
              href="/shared/notifications"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors border border-yellow-200"
            >
              <svg
                className="w-5 h-5 text-yellow-600 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                اعلان‌ها
              </span>
            </Link>
          </div>
        </div>

        {/* Profile Form */}
        {showProfileForm && (
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">تکمیل پروفایل</h2>
              <button
                onClick={() => setShowProfileForm(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  نام شرکت *
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="نام شرکت"
                  required
                />
              </div>

              <ProvinceCitySelect
                selectedProvince={profileForm.province}
                selectedCity={profileForm.city}
                onProvinceChange={(province) =>
                  setProfileForm((prev) => ({ ...prev, province, city: "" }))
                }
                onCityChange={(city) =>
                  setProfileForm((prev) => ({ ...prev, city }))
                }
                required={true}
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  نوع فعالیت *
                </label>
                <select
                  value={profileForm.activityType}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      activityType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  <option value="epc">EPC</option>
                  <option value="epcm">EPCM</option>
                  <option value="construction">ساخت</option>
                  <option value="procurement">خرید</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ایمیل</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  تلفن دفتر
                </label>
                <input
                  type="tel"
                  value={profileForm.officePhone}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      officePhone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="02112345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">آدرس</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="آدرس کامل شرکت"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  وب‌سایت
                </label>
                <input
                  type="url"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  شماره ثبت
                </label>
                <input
                  type="text"
                  value={profileForm.registrationNumber}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      registrationNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="شماره ثبت شرکت"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  درباره شرکت
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="توضیحات درباره شرکت و فعالیت‌های آن"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  تخصص‌ها
                </label>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => toggleCategory(spec)}
                      className={`px-3 py-1 rounded-full text-sm border-2 ${
                        profileForm.categories.includes(spec)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
                {profileForm.categories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {profileForm.categories.length} مورد انتخاب شده
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button
                  onClick={() => setShowProfileForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ContractorNavigation />
    </div>
  );
}
