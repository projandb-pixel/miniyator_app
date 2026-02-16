"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  price: string | null;
  priceRange: string | null;
  description: string | null;
  image: string | null;
  fastDelivery?: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  client: string | null;
  value: string | null;
  year: number | null;
}

interface Document {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  contractorId: string;
  contractor?: {
    id: string;
    name: string;
    logo: string | null;
  };
}

interface Supplier {
  id: string;
  name: string;
  logo: string | null;
  bio: string | null;
  address: string | null;
  website: string | null;
  officePhone: string | null;
  isKnowledgeBased?: boolean;
  trustScore?: number;
  responseSpeed?: number;
  deliveryQuality?: number;
  competitivePricing?: number;
  activityType?: string;
  legalType?: string;
  companyType?: string;
  workingHours?: string;
  welcomeMessage?: string;
  inventoryStatus?: string;
  leadTime?: string;
  brands?: Array<{ name: string }> | string[];
  standards?: string[];
  complianceStandards?: string[];
  email: string | null;
  isVerified: boolean;
  categories: Array<{ category: string }>;
  products: Product[];
  projects: Project[];
  documents: Document[];
  reviews: Review[];
}

function SharedSupplierProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "projects" | "documents" | "reviews">("products");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUserRole(data.user.role);
            if (data.user.company?.id) {
              setCompanyId(data.user.company.id);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
        });
    }

    const id = searchParams.get("id");
    if (id) {
      fetchSupplier(id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  // بررسی نظر کاربر بعد از اینکه supplier و companyId هر دو دریافت شدند
  useEffect(() => {
    if (supplier && companyId && supplier.reviews) {
      const review = supplier.reviews.find(
        (r: Review) => r.contractorId === companyId
      );
      if (review) {
        setMyReview(review);
        setReviewRating(review.rating);
        setReviewComment(review.comment || "");
      }
    }
  }, [supplier, companyId]);

  const fetchSupplier = async (id: string) => {
    try {
      setLoading(true);
      console.log("Fetching supplier with ID:", id);
      const response = await fetch(`/api/suppliers/${id}`);
      const data = await response.json();
      console.log("Supplier API response:", { status: response.status, data });

      if (response.ok && data.supplier) {
        // اطمینان از اینکه reviews یک آرایه است
        const supplierData = {
          ...data.supplier,
          reviews: Array.isArray(data.supplier.reviews) ? data.supplier.reviews : [],
          products: Array.isArray(data.supplier.products) ? data.supplier.products : [],
          projects: Array.isArray(data.supplier.projects) ? data.supplier.projects : [],
          documents: Array.isArray(data.supplier.documents) ? data.supplier.documents : [],
          categories: Array.isArray(data.supplier.categories) ? data.supplier.categories : [],
        };
        console.log("Setting supplier data:", supplierData);
        setSupplier(supplierData);
      } else {
        // نمایش خطا
        console.error("Error fetching supplier:", data.error, "Response status:", response.status);
        setSupplier(null);
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!supplier || !companyId || reviewRating === 0) {
      alert("لطفاً ابتدا امتیاز را انتخاب کنید");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractorId: companyId,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });

      const data = await response.json();
      console.log("Review submission response:", { status: response.status, data });

      if (response.ok) {
        alert(myReview ? "نظر شما به‌روزرسانی شد" : "نظر شما ثبت شد");
        setShowReviewForm(false);
        // دریافت مجدد اطلاعات تأمین‌کننده
        await fetchSupplier(supplier.id);
      } else {
        console.error("Review submission failed:", data);
        alert(data.error || data.details || "خطا در ثبت نظر");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("خطا در ثبت نظر. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!supplier || !myReview || !companyId) return;

    if (!confirm("آیا مطمئن هستید که می‌خواهید نظر خود را حذف کنید؟")) {
      return;
    }

    setDeletingReview(true);
    try {
      const response = await fetch(
        `/api/suppliers/${supplier.id}/reviews?reviewId=${myReview.id}&contractorId=${companyId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("نظر شما حذف شد");
        setMyReview(null);
        setReviewRating(0);
        setReviewComment("");
        // دریافت مجدد اطلاعات تأمین‌کننده
        await fetchSupplier(supplier.id);
      } else {
        alert(data.error || "خطا در حذف نظر");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("خطا در حذف نظر");
    } finally {
      setDeletingReview(false);
    }
  };

  const calculateAverageRating = () => {
    if (!supplier || !supplier.reviews || supplier.reviews.length === 0) {
      return 0;
    }
    const sum = supplier.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / supplier.reviews.length).toFixed(1);
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

  if (!supplier) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">تأمین‌کننده یافت نشد</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 mt-2 inline-block"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold">پروفایل تأمین‌کننده</h1>
          <button onClick={() => router.back()} className="text-gray-600">
            ← بازگشت
          </button>
        </div>
      </div>

      <div className="pb-20">
        {/* Company Header */}
        <div className="bg-white p-4 mb-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden relative">
              {supplier.logo ? (
                <Image
                  src={supplier.logo}
                  alt={supplier.name || "لوگوی شرکت"}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                supplier.name && supplier.name.length > 0
                  ? supplier.name.charAt(0)
                  : "?"
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{supplier.name}</h2>
                {supplier.isVerified && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    ✓ تأیید شده
                  </span>
                )}
                {supplier.isKnowledgeBased === true && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    دانش‌بنیان
                  </span>
                )}
              </div>
              {supplier.reviews && supplier.reviews.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">{calculateAverageRating()}</span>
                  <span className="text-gray-500 text-sm">
                    ({supplier.reviews.length} نظر)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Trust Score */}
          {supplier.trustScore !== undefined && (
            <div className="bg-green-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-900">سطح اعتماد (Trust Score)</span>
                <span className="text-lg font-bold text-green-700">{supplier.trustScore}%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${supplier.trustScore}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Data-Driven Scores */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {supplier.responseSpeed !== undefined && (
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-xs text-blue-700 mb-1">سرعت پاسخ‌گویی</p>
                <p className="text-sm font-bold text-blue-900">{supplier.responseSpeed}%</p>
              </div>
            )}
            {supplier.deliveryQuality !== undefined && (
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-xs text-purple-700 mb-1">کیفیت تحویل</p>
                <p className="text-sm font-bold text-purple-900">{supplier.deliveryQuality}%</p>
              </div>
            )}
            {supplier.competitivePricing !== undefined && (
              <div className="bg-orange-50 rounded-lg p-2">
                <p className="text-xs text-orange-700 mb-1">قیمت رقابتی</p>
                <p className="text-sm font-bold text-orange-900">{supplier.competitivePricing}%</p>
              </div>
            )}
          </div>

          {/* Activity Type & Legal Type */}
          {supplier.activityType && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">نوع فعالیت:</p>
              <p className="text-sm font-medium">
                {supplier.activityType
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean)
                  .map((a) => {
                    switch (a) {
                      case "tolid-konande":
                        return "تولیدکننده";
                      case "varad-konande":
                        return "واردکننده (دارای کارت بازرگانی)";
                      case "forushgah":
                        return "فروشگاه (توزیع‌کننده)";
                      case "namayande-rasmi":
                        return "نماینده رسمی شرکت خارجی";
                      case "tamin-konande":
                        return "تأمین‌کننده";
                      default:
                        return a;
                    }
                  })
                  .join("، ")}
              </p>
            </div>
          )}
          {(supplier.companyType || supplier.legalType) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {supplier.companyType && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  نوع شرکت:{" "}
                  {(() => {
                    switch (supplier.companyType) {
                      case "sahami-khas":
                        return "سهامی خاص";
                      case "sahami-am":
                        return "سهامی عام";
                      case "masooliat-mahdud":
                        return "مسئولیت محدود";
                      default:
                        return supplier.companyType;
                    }
                  })()}
                </span>
              )}
              {supplier.legalType && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  شخصیت حقوقی:{" "}
                  {(() => {
                    switch (supplier.legalType) {
                      case "sahami-khas":
                        return "سهامی خاص";
                      case "sahami-am":
                        return "سهامی عام";
                      case "masooliat-mahdud":
                        return "مسئولیت محدود";
                      default:
                        return supplier.legalType;
                    }
                  })()}
                </span>
              )}
            </div>
          )}
          {(supplier.workingHours || supplier.welcomeMessage) && (
            <div className="mb-3 space-y-1">
              {supplier.workingHours && (
                <p className="text-sm text-gray-700">
                  ⏱ ساعات کاری: {supplier.workingHours}
                </p>
              )}
              {supplier.welcomeMessage && (
                <p className="text-sm text-gray-700">
                  💬 پیام خوشامد: {supplier.welcomeMessage}
                </p>
              )}
            </div>
          )}
          {supplier.legalType && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">نوع شخصیت حقوقی:</p>
              <p className="text-sm font-medium">
                {(() => {
                  switch (supplier.legalType) {
                    case "sahami-khas":
                      return "سهامی خاص";
                    case "sahami-am":
                      return "سهامی عام";
                    case "masooliat-mahdud":
                      return "مسئولیت محدود";
                    default:
                      return supplier.legalType;
                  }
                })()}
              </p>
            </div>
          )}

          {/* Inventory Status & Lead Time */}
          {supplier.inventoryStatus && (
            <div className="bg-yellow-50 rounded-lg p-2 mb-2">
              <p className="text-xs text-yellow-700 mb-1">وضعیت موجودی:</p>
              <p className="text-sm font-medium text-yellow-900">{supplier.inventoryStatus}</p>
            </div>
          )}
          {supplier.leadTime && (
            <div className="bg-blue-50 rounded-lg p-2 mb-3">
              <p className="text-xs text-blue-700 mb-1">Lead Time تحویل:</p>
              <p className="text-sm font-medium text-blue-900">{supplier.leadTime}</p>
            </div>
          )}

          {/* Brands */}
          {supplier.brands && supplier.brands.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">برندهای تحت نمایندگی:</p>
              <div className="flex flex-wrap gap-2">
                {supplier.brands.map((brand, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {typeof brand === 'string' ? brand : brand.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Standards */}
          {supplier.standards && supplier.standards.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">استانداردهای فنی:</p>
              <div className="flex flex-wrap gap-2">
                {supplier.standards.map((standard, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                  >
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {supplier.categories && supplier.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {supplier.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {cat.category}
                </span>
              ))}
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-2 text-sm">
            {supplier.bio &&
              (() => {
                try {
                  const bioData = JSON.parse(supplier.bio);
                  const aboutText = bioData.about;
                  return aboutText ? (
                    <p className="text-gray-700">{aboutText}</p>
                  ) : null;
                } catch {
                  // اگر JSON نبود، متن را مستقیم نشان بده
                  return <p className="text-gray-700">{supplier.bio}</p>;
                }
              })()}
            {supplier.address && (
              <p className="text-gray-600">📍 {supplier.address}</p>
            )}
            {supplier.officePhone && (
              <p className="text-gray-600">📞 {supplier.officePhone}</p>
            )}
            {supplier.email && (
              <p className="text-gray-600">✉️ {supplier.email}</p>
            )}
            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600"
              >
                🌐 {supplier.website}
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-14 z-10">
          <div className="flex">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === "products"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              کالاها ({supplier.products?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === "projects"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              سوابق ({supplier.projects?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 py-3 text-center font-medium ${
                activeTab === "documents"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              مدارک ({supplier.documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-3 text-center font-medium relative ${
                activeTab === "reviews"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600"
              }`}
            >
              نظرات ({supplier.reviews?.length || 0})
              {userRole === "contractor" && companyId && !myReview && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "products" && (
            <div className="space-y-3">
              {supplier.products && supplier.products.length > 0 ? (
                supplier.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{product.name}</h3>
                      {product.fastDelivery && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          ⚡ تحویل فوری
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    {product.brand && (
                      <p className="text-sm text-gray-600">برند: {product.brand}</p>
                    )}
                    {product.price && (
                      <p className="text-lg font-bold text-green-600 mt-2">
                        {product.price}
                      </p>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-700 mt-2">{product.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  کالایی ثبت نشده است
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-3">
              {supplier.projects && supplier.projects.length > 0 ? (
                supplier.projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <h3 className="font-bold mb-2">{project.title}</h3>
                    {project.client && (
                      <p className="text-sm text-gray-600">مشتری: {project.client}</p>
                    )}
                    {project.value && (
                      <p className="text-lg font-bold text-green-600 mt-2">
                        {project.value}
                      </p>
                    )}
                    {project.year && (
                      <p className="text-sm text-gray-600">سال: {project.year}</p>
                    )}
                    {project.description && (
                      <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  سابقه‌ای ثبت نشده است
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-3">
              {supplier.documents && supplier.documents.length > 0 ? (
                supplier.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">{doc.title}</h3>
                        <p className="text-sm text-gray-600">نوع: {doc.type}</p>
                        {doc.isActive !== undefined && (
                          <p className="text-sm text-gray-600 mt-1">
                            وضعیت اعتبار: {doc.isActive ? "✓ فعال" : "✗ غیرفعال"}
                          </p>
                        )}
                        {doc.expiryDate && (
                          <p className="text-sm text-gray-600 mt-1">
                            تاریخ پایان اعتبار: {doc.expiryDate}
                          </p>
                        )}
                      </div>
                      {doc.logo && (
                        <img
                          src={doc.logo}
                          alt={doc.title}
                          className="h-12 w-12 object-contain ml-2"
                        />
                      )}
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm mt-2 inline-block"
                      >
                        {doc.logo ? "مشاهده لوگو" : "دانلود"}
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  مدرکی ثبت نشده است
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-3">
              {/* فرم اضافه/ویرایش نظر - فقط برای پیمانکاران */}
              {userRole === "contractor" && companyId ? (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  {!myReview && !showReviewForm ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      ✍️ افزودن نظر و امتیاز
                    </button>
                  ) : (
                    <div>
                      <h4 className="font-bold mb-3">
                        {myReview ? "ویرایش نظر شما" : "نظر شما"}
                      </h4>
                      
                      {/* انتخاب ستاره */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">
                          امتیاز * (لطفاً یک ستاره انتخاب کنید)
                        </label>
                        <div className="flex gap-2 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`text-4xl transition-transform hover:scale-110 ${
                                star <= reviewRating
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }`}
                              title={`${star} ستاره`}
                            >
                              ⭐
                            </button>
                          ))}
                          {reviewRating > 0 && (
                            <span className="text-sm text-gray-600 mr-2">
                              ({reviewRating} از 5)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* متن نظر */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">
                          نظر (اختیاری)
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نظر خود را بنویسید..."
                        />
                      </div>

                      {/* دکمه‌ها */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSubmitReview}
                          disabled={submittingReview || reviewRating === 0}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                        >
                          {submittingReview
                            ? "در حال ثبت..."
                            : myReview
                            ? "به‌روزرسانی"
                            : "ثبت نظر"}
                        </button>
                        {myReview && (
                          <button
                            onClick={handleDeleteReview}
                            disabled={deletingReview}
                            className="px-4 bg-red-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                          >
                            {deletingReview ? "..." : "حذف"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowReviewForm(false);
                            if (!myReview) {
                              setReviewRating(0);
                              setReviewComment("");
                            }
                          }}
                          className="px-4 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : userRole === "contractor" && !companyId ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800 text-sm">
                    برای ثبت نظر، لطفاً ابتدا پروفایل شرکت خود را تکمیل کنید.
                  </p>
                </div>
              ) : null}

              {/* لیست نظرات */}
              {supplier.reviews && supplier.reviews.length > 0 ? (
                supplier.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(review.contractor?.name && review.contractor.name.length > 0 ? review.contractor.name.charAt(0) : "پ")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {review.contractor?.name || "پیمانکار"}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <svg
                                key={i}
                                className="w-4 h-4 text-amber-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      {myReview?.id === review.id && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="text-blue-600 text-xs"
                        >
                          ویرایش
                        </button>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-2">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  نظری ثبت نشده است
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <ContractorNavigation />
    </div>
  );
}

export default function SharedSupplierProfile() {
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
      <SharedSupplierProfileContent />
    </Suspense>
  );
}
