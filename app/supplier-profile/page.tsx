"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  price: string | null;
  priceRange: string | null;
  description: string | null;
  image: string | null;
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
  email: string | null;
  isVerified: boolean;
  categories: Array<{ category: string }>;
  products: Product[];
  projects: Project[];
  documents: Document[];
  reviews: Review[];
  rating: number;
  activityType?: string;
  legalType?: string;
  companyType?: string;
  workingHours?: string;
  welcomeMessage?: string;
  _count: {
    products: number;
    projects: number;
    reviews: number;
  };
}

export default function SupplierProfile() {
  const [activeTab, setActiveTab] = useState<
    "products" | "projects" | "documents" | "reviews"
  >("products");
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!globalThis.window) return;
    const urlParams = new URLSearchParams(globalThis.window.location.search);
    const supplierId = urlParams.get("id");

    if (supplierId) {
      fetchSupplier(supplierId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSupplier = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${id}`);
      const data = await response.json();

      if (data.supplier) {
        setSupplier(data.supplier);
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.round(rating); // گرد کردن به نزدیک‌ترین عدد صحیح
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
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
    );
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
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Link href="/marketplace" className="text-gray-600">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold">پروفایل تأمین‌کننده</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">تأمین‌کننده یافت نشد</p>
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
          <button onClick={() => window.history.back()} className="text-gray-600">
            ← بازگشت
          </button>
          <h1 className="text-lg font-bold">پروفایل تأمین‌کننده</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pb-20">
        {/* Profile Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden relative">
              {supplier.logo ? (
                <Image
                  src={supplier.logo}
                  alt={supplier.name || "لوگوی شرکت"}
                  fill
                  sizes="96px"
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
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold">{supplier.name}</h2>
                {supplier.isVerified && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ تأیید شده
                  </span>
                )}
              {supplier.isKnowledgeBased === true && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  دانش‌بنیان
                </span>
              )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {renderStars(supplier.rating)}
                <span className="text-sm text-gray-600">
                  {supplier.rating.toFixed(1)} ({supplier._count.reviews} نظر)
                </span>
              </div>
              {supplier.bio &&
                (() => {
                  try {
                    const bioData = JSON.parse(supplier.bio);
                    const aboutText = bioData.about;
                    return aboutText ? (
                      <p className="text-sm text-gray-600 mb-2">{aboutText}</p>
                    ) : null;
                  } catch {
                    return (
                      <p className="text-sm text-gray-600 mb-2">
                        {supplier.bio}
                      </p>
                    );
                  }
                })()}
              {(supplier.activityType || supplier.legalType || supplier.companyType) && (
                <div className="flex flex-wrap gap-2 text-xs text-gray-700 mb-2">
                  {supplier.activityType && (
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      نوع فعالیت:{" "}
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
                    </span>
                  )}
                  {supplier.companyType && (
                    <span className="px-2 py-1 bg-gray-100 rounded">
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
                    <span className="px-2 py-1 bg-gray-100 rounded">
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
                <div className="space-y-1 text-sm text-gray-700 mb-2">
                  {supplier.workingHours && (
                    <p>⏱ ساعات کاری: {supplier.workingHours}</p>
                  )}
                  {supplier.welcomeMessage && (
                    <p>💬 پیام خوشامد: {supplier.welcomeMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {supplier.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
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
            {supplier.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>📍</span>
                <span>{supplier.address}</span>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>🌐</span>
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  {supplier.website}
                </a>
              </div>
            )}
            {supplier.officePhone && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>📞</span>
                <span>{supplier.officePhone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>✉️</span>
                <span>{supplier.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {supplier._count.products}
              </p>
              <p className="text-xs text-gray-600">محصول</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {supplier._count.projects}
              </p>
              <p className="text-xs text-gray-600">پروژه</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {supplier.rating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-600">امتیاز</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            {[
              { id: "products", label: "محصولات", icon: "📦" },
              { id: "projects", label: "پروژه‌ها", icon: "🏗️" },
              { id: "documents", label: "مدارک", icon: "📄" },
              { id: "reviews", label: "نظرات", icon: "💬" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as "products" | "projects" | "documents" | "reviews"
                  )
                }
                className={`flex-1 py-3 text-center border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-600"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white min-h-96">
          {activeTab === "products" && (
            <div className="p-4">
              {supplier.products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">📦</span>
                  <p>محصولی ثبت نشده است</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {supplier.products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                        {product.image ? (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-4xl">📦</span>
                          </div>
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm mb-1">
                          {product.name}
                        </h4>
                        {product.brand && (
                          <p className="text-xs text-gray-600 mb-2">
                            برند: {product.brand}
                          </p>
                        )}
                        {product.price && (
                          <p className="text-sm font-bold text-green-600">
                            {product.price}
                          </p>
                        )}
                        {product.priceRange && !product.price && (
                          <p className="text-sm font-bold text-green-600">
                            {product.priceRange}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="p-4 space-y-4">
              {supplier.projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">🏗️</span>
                  <p>پروژه‌ای ثبت نشده است</p>
                </div>
              ) : (
                supplier.projects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-bold mb-2">{project.title}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {project.client && <span>👤 {project.client}</span>}
                      {project.year && <span>📅 {project.year}</span>}
                      {project.value && <span>💰 {project.value}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="p-4 space-y-3">
              {supplier.documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">📄</span>
                  <p>مدرکی ثبت نشده است</p>
                </div>
              ) : (
                supplier.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        {doc.logo ? (
                          <img
                            src={doc.logo}
                            alt={doc.title}
                            className="h-10 w-10 object-contain"
                          />
                        ) : (
                          <span className="text-2xl">📄</span>
                        )}
                        <div className="flex-1">
                          <span className="font-medium block">{doc.title}</span>
                          <p className="text-xs text-gray-500">{doc.type}</p>
                          {doc.isActive !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              وضعیت: {doc.isActive ? "✓ فعال" : "✗ غیرفعال"}
                            </p>
                          )}
                          {doc.expiryDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              تاریخ پایان: {doc.expiryDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm"
                      >
                        {doc.logo ? "مشاهده لوگو" : "دانلود"}
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="p-4 space-y-4">
              {supplier.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">💬</span>
                  <p>نظری ثبت نشده است</p>
                </div>
              ) : (
                supplier.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        پ
                      </div>
                      <div>
                        <p className="font-medium">پیمانکار</p>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString(
                              "fa-IR"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="bg-white p-4 border-t border-gray-200 sticky bottom-0">
          <Link href={`/price-inquiry?supplierId=${supplier.id}`}>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
              استعلام قیمت از این تأمین‌کننده
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
