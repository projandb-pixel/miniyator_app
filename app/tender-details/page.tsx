"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface Requirement {
  category?: string;
  description?: string;
  quantity?: string;
  item?: string;
}

interface MatchDetail {
  requirement: {
    category: string;
    item: string;
  };
  matchedProducts: Array<{ name: string }>;
  probability?: number;
}

interface MatchData {
  isSuitable: boolean;
  matchPercentage: number;
  categoryMatch?: {
    matched: string[];
    total: number;
  };
  requirementMatch?: {
    matched: number;
    total: number;
    details: MatchDetail[];
  };
}


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
  requirements: Array<Requirement>;
  _count: {
    likes: number;
    saves: number;
    comments: number;
  };
  contractorViews?: number;
  supplierViews?: number;
  contractorLikes?: number;
  supplierLikes?: number;
}

function TenderDetailsContent() {
  const searchParams = useSearchParams();
  const tenderId = searchParams.get("id");

  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [backLink, setBackLink] = useState("/contractor/home");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // بررسی نقش کاربر از localStorage
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetch(`/api/profile?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserRole(data.user.role);
            if (data.user.role === "supplier") {
              setBackLink("/supplier/home");
              if (data.user.company?.id) {
                setCompanyId(data.user.company.id);
              }
            } else {
              setBackLink("/contractor/home");
            }
          }
        })
        .catch(() => {
          // در صورت خطا، پیش‌فرض contractor است
          setBackLink("/contractor/home");
        });
    }

    // دریافت اطلاعات مناقصه
    if (tenderId) {
      fetchTender(tenderId);
    } else {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    // دریافت اطلاعات تطابق برای تامین‌کنندگان
    if (userRole === "supplier" && companyId && tenderId) {
      fetch(`/api/tenders/${tenderId}/match-supplier?supplierId=${companyId}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Failed to fetch match data");
        })
        .then((data) => {
          setMatchData(data);
        })
        .catch((error) => {
          console.error("Error fetching match data:", error);
        });
    }
  }, [userRole, companyId, tenderId]);



  const fetchTender = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenders/${id}`);
      const data = await response.json();

      if (response.ok && data.tender) {
        // تبدیل TenderCategories به categories برای سازگاری
        const tenderData = {
          ...data.tender,
          categories: data.tender.TenderCategories || data.tender.categories || [],
        };
        setTender(tenderData);
      } else {
        console.error("Error fetching tender:", data.error);
        alert(data.error || "مناقصه یافت نشد");
      }
    } catch (error) {
      console.error("Error fetching tender:", error);
      alert("خطا در دریافت اطلاعات مناقصه");
    } finally {
      setLoading(false);
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
      return `${(min / 1000000000).toFixed(1)}-${(max / 1000000000).toFixed(
        1
      )} میلیارد تومان`;
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


  const handleShareTender = async (isCustom: boolean = false) => {
    if (!tender) return;
    
    // برای سفارشی، فقط supplier می‌تواند استفاده کند
    if (isCustom && !companyId) {
      alert("این قابلیت فقط برای تأمین‌کنندگان در دسترس است");
      return;
    }

    // اگر سفارشی است، به صفحه ویرایش هدایت کن
    if (isCustom) {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("لطفاً ابتدا وارد شوید");
        return;
      }
      if (globalThis.window) {
        globalThis.window.location.href = `/supplier/tender-share-custom?tenderId=${tender.id}`;
      }
      return;
    }

    // اگر خودکار است، مستقیماً پست در وین گرام ایجاد کن
    setSharing(true);
    setShowShareModal(false);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("لطفاً ابتدا وارد شوید");
        return;
      }

      // ساخت محتوای پست از اطلاعات مناقصه
      let postContent = `مناقصه: ${tender.title || ""}\n\n`;
      postContent += `شرکت ${tender.company || ""} درخواست ${tender.title || ""} دارد.\n\n`;
      
      // دریافت دسته‌بندی‌ها - بررسی هر دو حالت categories و TenderCategories
      let categories = "";
      try {
        if (tender.categories && Array.isArray(tender.categories) && tender.categories.length > 0) {
          categories = tender.categories.map((c: any) => {
            if (typeof c === "string") return c;
            return (c && c.category) ? c.category : String(c);
          }).filter(Boolean).join(", ");
        } else if ((tender as any).TenderCategories && Array.isArray((tender as any).TenderCategories) && (tender as any).TenderCategories.length > 0) {
          categories = (tender as any).TenderCategories.map((c: any) => {
            return (c && c.category) ? c.category : String(c);
          }).filter(Boolean).join(", ");
        }
      } catch (error) {
        console.error("Error processing categories:", error);
      }
      
      if (categories) {
        postContent += `دسته‌بندی‌ها: ${categories}\n\n`;
      }
      
      if (tender.description) {
        postContent += `توضیحات: ${tender.description}`;
      }

      // دریافت تصویر مناقصه
      let postImage: string | null = null;
      try {
        if (tender.images && typeof tender.images === "string" && tender.images.trim()) {
          // تصاویر به صورت comma-separated string هستند
          const imageArray = tender.images.split(",").filter(Boolean);
          if (imageArray.length > 0) {
            postImage = imageArray[0].trim();
          }
        }
        
        // اگر تصویر وجود نداشت، از تصویر پیش‌فرض استفاده کن
        if (!postImage) {
          // ایجاد یک SVG ساده به عنوان تصویر پیش‌فرض
          const defaultImageSvg = `
            <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
              <rect width="800" height="600" fill="#3B82F6"/>
              <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" font-weight="bold">مناقصه</text>
              <text x="400" y="340" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">${tender.title || ""}</text>
            </svg>
          `.trim();
          // تبدیل SVG به base64
          postImage = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(defaultImageSvg)))}`;
        }
      } catch (error) {
        console.error("Error processing images:", error);
        // در صورت خطا هم تصویر پیش‌فرض استفاده کن
        const defaultImageSvg = `
          <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="600" fill="#3B82F6"/>
            <text x="400" y="300" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" font-weight="bold">مناقصه</text>
          </svg>
        `.trim();
        postImage = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(defaultImageSvg)))}`;
      }

      // ایجاد پست در وین گرام
      console.log("Creating post with data:", {
        userId,
        content: postContent.substring(0, 100) + "...",
        image: postImage ? postImage.substring(0, 50) + "..." : null,
        tenderId: tender.id,
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content: postContent,
          image: postImage,
          tenderId: tender.id, // اضافه کردن tenderId
        }),
      });

      const data = await response.json();

      console.log("Post creation response:", { status: response.status, data });

      if (response.ok) {
        alert("مناقصه با موفقیت در وین گرام به اشتراک گذاشته شد");
        // هدایت به وین گرام
        const userRole = localStorage.getItem("userRole") || "supplier";
        if (globalThis.window) {
          if (userRole === "contractor") {
            globalThis.window.location.href = "/contractor/explore";
          } else {
            globalThis.window.location.href = "/supplier/explore";
          }
        }
      } else {
        console.error("Error creating post:", data);
        alert(data.error || (data.details ? `${data.error}: ${data.details}` : "خطا در اشتراک‌گذاری مناقصه"));
      }
    } catch (error) {
      console.error("Error sharing tender:", error);
      alert("خطا در اشتراک‌گذاری مناقصه");
    } finally {
      setSharing(false);
    }
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
            <Link href={backLink} className="text-gray-600">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold">جزئیات مناقصه</h1>
            <button className="text-gray-600">⋯</button>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">مناقصه یافت نشد</p>
          <Link href={backLink} className="text-blue-600 font-medium">
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
          <Link href={backLink} className="text-gray-600">
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
              <Image
                src={images[currentImage]}
                alt={tender.title}
                fill
                className="object-cover"
                unoptimized
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
                      className={`w-2 h-2 rounded-full ${
                        currentImage === idx ? "bg-white" : "bg-white/50"
                      }`}
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
            <div className="flex-1">
              <h2 className="font-bold text-lg">{tender.company}</h2>
              <p className="text-sm text-gray-600">کارفرما</p>
            </div>
          </div>
          {daysRemaining !== null && daysRemaining > 0 && (
            <div className="mt-3 bg-red-50 border-r-4 border-red-500 p-3 rounded">
              <p className="text-sm text-gray-600">⏰ مهلت باقی‌مانده:</p>
              <p className="font-bold text-red-600">
                {daysRemaining} روز تا پایان
              </p>
            </div>
          )}
        </div>

        {/* Match Information for Suppliers */}
        {userRole === "supplier" && matchData && (
          <div
            className={`bg-white p-4 border-b border-gray-200 ${
              matchData.isSuitable
                ? "bg-green-50 border-l-4 border-green-500"
                : "bg-yellow-50 border-l-4 border-yellow-500"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {matchData.isSuitable ? "✓" : "⚠"}
                </span>
                <h3 className="font-bold text-lg">
                  {matchData.isSuitable
                    ? "این مناقصه برای شما مناسب است"
                    : "این مناقصه ممکن است برای شما مناسب نباشد"}
                </h3>
              </div>
              <span
                className={`text-2xl font-bold ${
                  matchData.isSuitable ? "text-green-700" : "text-yellow-700"
                }`}
              >
                {matchData.matchPercentage}%
              </span>
            </div>

            {matchData.categoryMatch && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  تطابق دسته‌بندی‌ها: {matchData.categoryMatch.matched.length}{" "}
                  از {matchData.categoryMatch.total}
                </p>
                {matchData.categoryMatch.matched.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {matchData.categoryMatch.matched.map(
                      (cat: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                        >
                          {cat}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {matchData.requirementMatch &&
              matchData.requirementMatch.details &&
              matchData.requirementMatch.details.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    کالاهای مطابق شما: {matchData.requirementMatch.matched} از{" "}
                    {matchData.requirementMatch.total}
                  </p>
                  <div className="space-y-2">
                    {matchData.requirementMatch.details
                      .slice(0, 3)
                      .map((detail, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded border border-green-200"
                        >
                          <p className="text-xs font-medium text-gray-700">
                            {detail.requirement.category}:{" "}
                            {detail.requirement.item}
                          </p>
                          {detail.matchedProducts.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-green-700">
                                کالاهای شما:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {detail.matchedProducts.map((product, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs"
                                  >
                                    {product.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* شاخص احتمال انتخاب کالا برای این دسته‌بندی */}
                          <div className="mt-2 bg-blue-50 p-2 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              شاخص احتمال انتخاب کالای شما در این دسته‌بندی:
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${detail.probability || 75}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600">
                              {detail.probability || 75}% احتمال انتخاب
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Share Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowShareModal(true)}
                disabled={sharing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sharing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال اشتراک‌گذاری...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
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
                    <span>اشتراک‌گذاری به عنوان استوری/پست</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Project Title */}
        <div className="bg-white p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {tender.title}
          </h1>
          {tender.categories && tender.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tender.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {cat.category}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Specifications */}
        <div className="bg-white p-4 border-b border-gray-200">
          <h3 className="font-bold mb-3">مشخصات اصلی</h3>
          <div className="space-y-3">
            {tender.tenderType && (
              <div className="flex justify-between">
                <span className="text-gray-600">نوع مناقصه:</span>
                <span className="font-medium">{tender.tenderType}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">تاریخ انتشار:</span>
              <span className="font-medium">
                {formatDate(tender.publishDate)}
              </span>
            </div>
            {tender.deadline && (
              <div className="flex justify-between">
                <span className="text-gray-600">آخرین مهلت:</span>
                <span className="font-medium">
                  {formatDate(tender.deadline)}
                </span>
              </div>
            )}
            {tender.tenderNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">شماره فراخوان:</span>
                <span className="font-medium">{tender.tenderNumber}</span>
              </div>
            )}
            {tender.deliveryLocation && (
              <div className="flex justify-between">
                <span className="text-gray-600">محل تحویل اسناد:</span>
                <span className="font-medium">{tender.deliveryLocation}</span>
              </div>
            )}
            {(tender.estimatedMin || tender.estimatedMax) && (
              <div className="flex justify-between">
                <span className="text-gray-600">محدوده قیمت برآوردی:</span>
                <span className="font-medium text-green-600">
                  {formatPrice(tender.estimatedMin, tender.estimatedMax)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Price Estimation */}
        {(tender.estimatedMin || tender.estimatedMax) && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              📊 برآورد قیمت
            </h3>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-3">
              <p className="text-sm text-gray-600 mb-1">برآورد اولیه پروژه:</p>
              <p className="text-2xl font-bold text-green-700">
                {formatPrice(tender.estimatedMin, tender.estimatedMax)}
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">مهندسی</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: "15%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">۱۵٪</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">خرید و تدارکات</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "40%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">۴۰٪</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">لجستیک</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">۱۰٪</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">نصب</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: "20%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">۲۰٪</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">تست و بازرسی</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">۱۰٪</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">راه‌اندازی</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: "5%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">۵٪</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {tender.description && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3">توضیحات</h3>
            <p className="text-gray-700 leading-relaxed">
              {tender.description}
            </p>
          </div>
        )}

        {/* Project Requirements by Category */}
        {tender.requirements && tender.requirements.length > 0 && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3">نیازمندی‌های پروژه</h3>
            <div className="space-y-3">
              {tender.requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      <span className="font-medium">
                        {req.category || "عمومی"}
                      </span>
                    </div>
                  </div>
                  {req.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      {req.description}
                    </p>
                  )}
                  {req.quantity && (
                    <p className="text-sm text-gray-600 mb-1">
                      مقدار: {req.quantity}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Win Tender Analysis - Only for Contractors */}
        {userRole !== "supplier" && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              📊 تحلیل وین تندر
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg space-y-3">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">گروه مهندسی:</span> بر اساس
                  پروفایل پیمانکار، شما گروه مهندسی با تجربه بالا دارید که این
                  یک نقطه قوت محسوب می‌شود.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">
                    رنکینگ تأمین‌کنندگان مورد علاقه:
                  </span>{" "}
                  تأمین‌کنندگان مورد علاقه شما در سطح متوسط تا بالا قرار دارند
                  که می‌تواند در کیفیت پروژه تأثیر مثبت داشته باشد.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">پرسنل اجرایی:</span> شما پرسنل
                  اجرایی با تجربه متوسط دارید که برای این پروژه مناسب است.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">سوابق پروژه‌های مشابه:</span> بر
                  اساس سوابق شما، تجربه کافی در پروژه‌های مشابه دارید.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contractor Actions - Only for Contractors */}
        {userRole !== "supplier" && (
          <div className="bg-white p-4 border-b border-gray-200">
            <h3 className="font-bold mb-3">عملیات پیمانکار</h3>
            <div className="space-y-2">
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium">
                🟩 شرکت در مناقصه
              </button>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
                🟦 دانلود اسناد
              </button>
              <button className="w-full bg-yellow-500 text-white py-3 rounded-lg font-medium">
                🟨 استعلام قیمت از تأمین‌کنندگان
              </button>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium">
                🟪 برآورد نیروی انسانی مورد نیاز
              </button>
              <button className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium">
                🟧 مشاهده فریلنسرهای مرتبط
              </button>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4">
            <div className="bg-white rounded-b-3xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4 text-center">
                نوع اشتراک‌گذاری
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleShareTender(false)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>خودکار</span>
                </button>
                <button
                  onClick={() => handleShareTender(true)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>سفارشی</span>
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TenderDetails() {
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
      <TenderDetailsContent />
    </Suspense>
  );
}
