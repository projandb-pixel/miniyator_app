"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SupplierNavigation from "@/components/supplier/SupplierNavigation";

interface Supplier {
  id: string;
  name: string;
  logo?: string | null;
  verified: boolean;
  categories: Array<{ category: string }>;
  productCount: number;
  rating: number;
  priceLevel: string;
  city?: string;
  province?: string;
}

export default function SupplierMarketplace() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      // بررسی نقش کاربر
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.role !== "supplier") {
              // اگر پیمانکار است، به صفحه پیمانکار هدایت کن
              if (globalThis.window !== undefined) {
                globalThis.window.location.href = "/contractor/home";
              }
            } else {
              setUserId(storedUserId);
              fetchSuppliers();
            }
          }
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      if (globalThis.window !== undefined) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers?limit=50");
      const data = await response.json();

      if (data.suppliers) {
        // فیلتر کردن خود supplier از لیست
        const filteredSuppliers = data.suppliers.filter(
          (supplier: Supplier) => supplier.id !== userId
        );
        setSuppliers(filteredSuppliers);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceLevelLabel = (level: string) => {
    const labels: { [key: string]: string } = {
      low: "اقتصادی",
      medium: "متوسط",
      high: "گران",
      premium: "پرمیوم",
    };
    return labels[level] || level;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.round(rating); // گرد کردن به نزدیک‌ترین عدد صحیح

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className="w-4 h-4 text-amber-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
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

  return (
    <div className="mobile-container bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">بازار تأمین‌کنندگان</h1>
          <Link
            href="/supplier/dashboard"
            className="text-blue-600 text-sm"
          >
            داشبورد
          </Link>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-600 text-sm mb-4">
          مشاهده سایر تأمین‌کنندگان و مقایسه با رقبا
        </p>

        {suppliers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">هنوز تأمین‌کننده‌ای ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/shared/supplier-profile?id=${supplier.id}`}
                className="block bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {supplier.logo ? (
                      <img
                        src={supplier.logo}
                        alt={supplier.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">🏢</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {supplier.name}
                      </h3>
                      {supplier.verified && (
                        <span className="text-blue-600 text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          تأیید شده
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    {(supplier.city || supplier.province) && (
                      <p className="text-xs text-gray-500 mb-2">
                        {supplier.city && supplier.province
                          ? `${supplier.city}، ${supplier.province}`
                          : supplier.city || supplier.province}
                      </p>
                    )}

                    {/* Categories */}
                    {supplier.categories && supplier.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {supplier.categories.slice(0, 3).map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                          >
                            {cat.category}
                          </span>
                        ))}
                        {supplier.categories.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{supplier.categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium">
                          {supplier.rating.toFixed(1)}
                        </span>
                        <div className="flex">{renderStars(supplier.rating)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span>{supplier.productCount} کالا</span>
                      </div>
                      {supplier.priceLevel && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{getPriceLevelLabel(supplier.priceLevel)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SupplierNavigation />
    </div>
  );
}

