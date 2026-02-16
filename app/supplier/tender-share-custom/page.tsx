"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SupplierNavigation from "@/components/supplier/SupplierNavigation";

interface Tender {
  id: string;
  title: string;
  company: string;
}

function TenderShareCustomContent() {
  const searchParams = useSearchParams();
  const tenderId = searchParams.get("tenderId");

  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // فرم ساده: فقط متن و عکس
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    }

    if (tenderId) {
      fetchTender(tenderId);
    } else {
      setLoading(false);
    }
  }, [tenderId]);

  const fetchTender = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenders/${id}`);
      const data = await response.json();

      if (response.ok && data.tender) {
        setTender(data.tender);
      } else {
        alert(data.error || "مناقصه یافت نشد");
      }
    } catch (error) {
      console.error("Error fetching tender:", error);
      alert("خطا در دریافت اطلاعات مناقصه");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // بررسی اندازه فایل (حداکثر 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم فایل نباید بیشتر از 5 مگابایت باشد");
        e.target.value = ""; // پاک کردن انتخاب
        return;
      }
      // بررسی نوع فایل
      if (!file.type.startsWith("image/")) {
        alert("لطفاً فقط فایل تصویری انتخاب کنید");
        e.target.value = ""; // پاک کردن انتخاب
        return;
      }
      // تبدیل فایل به base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.onerror = () => {
        alert("خطا در خواندن فایل. لطفاً دوباره تلاش کنید");
        e.target.value = ""; // پاک کردن انتخاب
        setImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!userId || !tender) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    if (!content.trim() && !image) {
      alert("لطفاً متن یا تصویر را وارد کنید");
      return;
    }

    setSaving(true);
    try {
      // ایجاد پست در وین گرام با تگ مناقصه
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          content,
          image,
          tenderId: tender.id, // تگ مناقصه
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("پست با موفقیت در وین گرام به اشتراک گذاشته شد");
        if (globalThis.window !== undefined) {
          globalThis.window.location.href = "/supplier/explore";
        }
      } else {
        alert(data.error || "خطا در اشتراک‌گذاری پست");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      alert("خطا در اشتراک‌گذاری پست");
    } finally {
      setSaving(false);
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
            <Link href="/supplier/home" className="text-gray-600">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold">ایجاد پست</h1>
            <div className="w-8"></div>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500 mb-4">مناقصه یافت نشد</p>
          <Link href="/supplier/home" className="text-blue-600 font-medium">
            بازگشت
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/supplier/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ایجاد پست</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Tender Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">مناقصه:</span> {tender.title}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            این پست به مناقصه تگ خواهد شد
          </p>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <h3 className="font-bold mb-3">پیش‌نمایش</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {image && (
              <img
                src={image}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg mb-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
            {content && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                {content}
              </p>
            )}
            {!image && !content && (
              <p className="text-sm text-gray-400 text-center py-8">
                پیش‌نمایش پست شما اینجا نمایش داده می‌شود
              </p>
            )}
            {/* Tender Tag */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Link
                href={`/tender-details?id=${tender.id}`}
                className="inline-flex items-center gap-1 text-blue-600 text-xs hover:text-blue-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span>{tender.title}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <h3 className="font-bold mb-4">محتوا</h3>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">متن پست</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="چه چیزی در ذهن دارید؟"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              تصویر (اختیاری)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            {image && (
              <div className="mt-2 relative">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <svg
                    className="w-4 h-4"
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
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || (!content.trim() && !image)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>در حال ارسال...</span>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>ارسال پست</span>
              </>
            )}
          </button>
        </div>
      </div>

      <SupplierNavigation />
    </div>
  );
}

export default function TenderShareCustom() {
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
      <TenderShareCustomContent />
    </Suspense>
  );
}
