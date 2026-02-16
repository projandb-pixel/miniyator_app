"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

export default function CreateStory() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    content: "",
    imageUrl: "",
    videoUrl: "",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // بررسی نوع فایل
      if (!file.type.startsWith("image/")) {
        alert("لطفاً یک فایل تصویری انتخاب کنید");
        e.target.value = ""; // پاک کردن انتخاب
        return;
      }

      // بررسی حجم فایل (مثلاً 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم فایل نباید بیشتر از 5 مگابایت باشد");
        e.target.value = ""; // پاک کردن انتخاب
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, imageUrl: base64String });
      };
      reader.onerror = () => {
        alert("خطا در خواندن فایل. لطفاً دوباره تلاش کنید");
        e.target.value = ""; // پاک کردن انتخاب
        setImagePreview(null);
        setFormData({ ...formData, imageUrl: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: "" });
  };

  const storyTypes = [
    { value: "progress", label: " مراحل پیشرفت پروژه", icon: "📸" },
    { value: "need", label: " اعلام نیاز فوری", icon: "⚠️" },
    { value: "subcontractor", label: " فراخوان همکاری", icon: "🤝" },
    { value: "inventory", label: " موجودی لحظه‌ای", icon: "📦" },
    { value: "discount", label: " تخفیف‌های ویژه", icon: "💰" },
    { value: "new-product", label: " معرفی محصول جدید", icon: "🆕" },
    { value: "service", label: " اطلاعیه خدمات پس از فروش", icon: "🔧" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    if (!formData.type || !formData.title) {
      alert("لطفاً نوع و عنوان استوری را انتخاب کنید");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("استوری با موفقیت ایجاد شد");
        router.push("/contractor/home");
      } else {
        console.error("Error response:", data);
        alert(data.error || "خطا در ایجاد استوری");
      }
    } catch (error) {
      console.error("Error creating story:", error);
      const errorMessage =
        error instanceof Error ? error.message : "خطای ناشناخته";
      alert(`خطا در ایجاد استوری: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ایجاد استوری</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-20 space-y-4">
        {/* نوع استوری */}
        <div>
          <label className="block text-sm font-medium mb-2">نوع استوری *</label>
          <div className="space-y-2">
            {storyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`w-full p-4 rounded-lg border-2 text-right transition ${
                  formData.type === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <span className="text-lg mr-2">{type.icon}</span>
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* عنوان */}
        <div>
          <label className="block text-sm font-medium mb-1">عنوان *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="مثال: نیاز فوری به تجهیزات برق"
            required
          />
        </div>

        {/* محتوا */}
        <div>
          <label className="block text-sm font-medium mb-1">محتوا</label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="توضیحات کامل..."
          />
        </div>

        {/* تصویر */}
        <div>
          <label className="block text-sm font-medium mb-1">تصویر</label>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  برای آپلود تصویر کلیک کنید
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF تا 5MB
                </span>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg text-sm"
              >
                حذف تصویر
              </button>
            </div>
          )}
        </div>

        {/* ویدیو */}
        <div>
          <label className="block text-sm font-medium mb-1">URL ویدیو</label>
          <input
            type="url"
            value={formData.videoUrl}
            onChange={(e) =>
              setFormData({ ...formData, videoUrl: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="https://example.com/video.mp4"
          />
        </div>

        {/* دکمه ارسال */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "در حال ایجاد..." : "ایجاد استوری"}
        </button>
      </form>

      <ContractorNavigation />
    </div>
  );
}
