"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

interface Supplier {
  id: string;
  name: string;
  logo: string;
  categories: string[];
  productCount: number;
  verified: boolean;
  priceLevel: "low" | "medium" | "high";
  rating: number;
}

export default function SharedMarketplace() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/suppliers?limit=50");
      const data = await response.json();

      if (response.ok) {
        if (data.suppliers && Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers);
        } else {
          setSuppliers([]);
        }
      } else {
        console.error("Error fetching suppliers:", data.error);
        setSuppliers([]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriceLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "high":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriceLevelText = (level: string) => {
    switch (level) {
      case "low":
        return "ارزان";
      case "medium":
        return "متوسط";
      case "high":
        return "بالا";
      default:
        return "";
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

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-800">
            بازار تأمین‌کنندگان
          </h1>
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 text-gray-600"
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
        </div>
      </div>

      {/* Suppliers List */}
      <div className="pb-20">
        {suppliers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-96 p-8">
            <span className="text-6xl mb-4">🏪</span>
            <p className="text-gray-600 text-center mb-4">
              هیچ تأمین‌کننده‌ای وجود ندارد
            </p>
          
          </div>
        )}

        {suppliers.map((supplier) => (
          <Link key={supplier.id} href={`/shared/supplier-profile?id=${supplier.id}`}>
            <div className="bg-white mb-3 p-4 border-b border-gray-100">
              <div className="flex items-start gap-4">
                {/* Logo / Avatar */}
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden bg-blue-600">
                  {supplier.logo ? (
                    <Image
                      src={supplier.logo}
                      alt={supplier.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    supplier.name && supplier.name.length > 0 ? supplier.name.charAt(0) : "?"
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{supplier.name}</h3>
                    {supplier.verified && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        ✓ تأیید شده
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {supplier.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📦 {supplier.productCount} محصول</span>
                    <span>⭐ {supplier.rating}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${getPriceLevelColor(
                        supplier.priceLevel
                      )}`}
                    >
                      {getPriceLevelText(supplier.priceLevel)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Filters Bottom Sheet */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">فیلتر بازار</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">دسته‌بندی</h3>
              <div className="flex flex-wrap gap-2">
                {["برق", "ابزار دقیق", "مکانیک", "سیویل", "مواد شیمیایی"].map(
                  (cat) => (
                    <button
                      key={cat}
                      className="px-4 py-2 border border-gray-300 rounded-full text-sm"
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">بازه قیمت</h3>
              <div className="flex items-center gap-4">
                <input type="range" min="0" max="100" className="flex-1" />
                <div className="flex gap-2 text-sm">
                  <span>ارزان</span>
                  <span>گران</span>
                </div>
              </div>
            </div>

            {/* Brand Filter */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">برند</h3>
              <input
                type="text"
                placeholder="جستجوی برند..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Delivery Time */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">زمان تحویل</h3>
              <div className="flex flex-wrap gap-2">
                {["فوری", "کمتر از ۱ هفته", "۱-۲ هفته", "بیش از ۲ هفته"].map(
                  (time) => (
                    <button
                      key={time}
                      className="px-4 py-2 border border-gray-300 rounded-full text-sm"
                    >
                      {time}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Verified Only */}
            <div className="mb-6">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="font-medium">فقط تأمین‌کنندگان تأیید شده</span>
              </label>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
              اعمال فیلترها
            </button>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <ContractorNavigation />
    </div>
  );
}

