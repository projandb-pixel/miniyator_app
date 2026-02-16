"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SupplierNavigation from "@/components/supplier/SupplierNavigation";
import PersianDatePicker from "@/components/PersianDatePicker";

const ALLOWED_PHONE = "09128473158";

export default function CreateTender() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    company: "",
    title: "",
    description: "",
    tenderNumber: "",
    tenderType: "",
    publishDate: "",
    deadline: "",
    deliveryLocation: "",
    estimatedMin: "",
    estimatedMax: "",
    categories: [] as string[],
    requirements: [] as Array<{
      category: string;
      item: string;
      quantity?: string;
      description?: string;
    }>,
  });

  const tenderTypes = [
    "EPC",
    "EP",
    "PC",
    "E",
    "P",
    "C",
    "خرید",
    "خدمات",
    "سایر",
  ];

  const categories = [
    "مکانیک استاتیک",
    "مکانیک روتاری",
    "برق و ابزار دقیق",
    "سیویل",
    "HSE",
    "خرید/بازرگانی",
    "سایر",
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchUserProfile(storedUserId);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();
      if (data.user) {
        const phone = data.user.phone || "";
        setUserPhone(phone);
        
        if (phone === ALLOWED_PHONE) {
          setAuthorized(true);
          if (data.user.company) {
            setCompanyName(data.user.company.name || "");
            setFormData((prev) => ({
              ...prev,
              company: data.user.company.name || "",
            }));
          }
        } else {
          setAuthorized(false);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setAuthorized(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // بررسی نوع فایل
      if (!file.type.startsWith("image/")) {
        alert("لطفاً فقط فایل‌های تصویری انتخاب کنید");
        return;
      }

      // بررسی حجم فایل (مثلاً 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`حجم فایل ${file.name} نباید بیشتر از 5 مگابایت باشد`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUploadedImages((prev) => [...prev, base64String]);
      };
      reader.onerror = () => {
        alert(`خطا در خواندن فایل ${file.name}. لطفاً دوباره تلاش کنید`);
      };
      reader.readAsDataURL(file);
    });
    
    // پاک کردن مقدار input برای امکان انتخاب مجدد همان فایل
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        { category: "", item: "", quantity: "", description: "" },
      ],
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const updateRequirement = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      ),
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    if (
      !formData.company ||
      !formData.title ||
      !formData.tenderNumber ||
      !formData.tenderType ||
      !formData.publishDate ||
      !formData.deadline
    ) {
      alert("لطفاً فیلدهای الزامی را پر کنید");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...formData,
          estimatedMin: formData.estimatedMin
            ? Number.parseFloat(formData.estimatedMin)
            : null,
          estimatedMax: formData.estimatedMax
            ? Number.parseFloat(formData.estimatedMax)
            : null,
          images: uploadedImages.length > 0 ? uploadedImages : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("مناقصه با موفقیت ایجاد شد");
        router.push("/supplier/home");
      } else {
        console.error("Error response:", data);
        alert(data.error || "خطا در ایجاد مناقصه");
      }
    } catch (error) {
      console.error("Error creating tender:", error);
      const errorMessage =
        error instanceof Error ? error.message : "خطای ناشناخته";
      alert(`خطا در ایجاد مناقصه: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Link href="/supplier/home" className="text-gray-600">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold">ایجاد مناقصه</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="p-4 pb-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold text-red-700 mb-2">
              دسترسی محدود
            </h2>
            <p className="text-gray-700">
              شما مجاز به ایجاد مناقصه نیستید.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              فقط کاربران مجاز می‌توانند مناقصه ایجاد کنند.
            </p>
          </div>
        </div>
        <SupplierNavigation />
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/supplier/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ایجاد مناقصه</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-20 space-y-4">
        {/* شرکت */}
        <div>
          <label className="block text-sm font-medium mb-1">شرکت *</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="نام شرکت"
            required
          />
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
            placeholder="عنوان مناقصه"
            required
          />
        </div>

        {/* توضیحات */}
        <div>
          <label className="block text-sm font-medium mb-1">توضیحات</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="توضیحات کامل مناقصه..."
          />
        </div>

        {/* شماره مناقصه */}
        <div>
          <label className="block text-sm font-medium mb-1">
            شماره مناقصه *
          </label>
          <input
            type="text"
            value={formData.tenderNumber}
            onChange={(e) =>
              setFormData({ ...formData, tenderNumber: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="مثال: 1403-09-15-012"
            required
          />
        </div>

        {/* نوع مناقصه */}
        <div>
          <label className="block text-sm font-medium mb-1">نوع مناقصه *</label>
          <select
            value={formData.tenderType}
            onChange={(e) =>
              setFormData({ ...formData, tenderType: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">انتخاب کنید</option>
            {tenderTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* تاریخ انتشار */}
        <div>
          <label className="block text-sm font-medium mb-1">
            تاریخ انتشار *
          </label>
          <PersianDatePicker
            value={formData.publishDate}
            onChange={(date) =>
              setFormData({ ...formData, publishDate: date })
            }
          />
        </div>

        {/* مهلت ارسال */}
        <div>
          <label className="block text-sm font-medium mb-1">مهلت ارسال *</label>
          <PersianDatePicker
            value={formData.deadline}
            onChange={(date) => setFormData({ ...formData, deadline: date })}
          />
        </div>

        {/* محل تحویل */}
        <div>
          <label className="block text-sm font-medium mb-1">محل تحویل</label>
          <input
            type="text"
            value={formData.deliveryLocation}
            onChange={(e) =>
              setFormData({ ...formData, deliveryLocation: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="محل تحویل"
          />
        </div>

        {/* محدوده قیمت */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              حداقل قیمت (تومان)
            </label>
            <input
              type="number"
              value={formData.estimatedMin}
              onChange={(e) =>
                setFormData({ ...formData, estimatedMin: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              حداکثر قیمت (تومان)
            </label>
            <input
              type="number"
              value={formData.estimatedMax}
              onChange={(e) =>
                setFormData({ ...formData, estimatedMax: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* دسته‌بندی‌ها */}
        <div>
          <label className="block text-sm font-medium mb-2">
            دسته‌بندی‌ها *
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm border-2 ${
                  formData.categories.includes(cat)
                    ? "border-blue-600 bg-blue-100 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* تصاویر */}
        <div>
          <label className="block text-sm font-medium mb-1">تصاویر</label>
          {uploadedImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
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
                  PNG, JPG, GIF تا 5MB (چند تصویر)
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={image}
                        alt={`Uploaded ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload-more"
              />
              <label
                htmlFor="image-upload-more"
                className="block text-center text-sm text-blue-600 cursor-pointer"
              >
                + افزودن تصویر بیشتر
              </label>
            </div>
          )}
        </div>

        {/* الزامات */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">الزامات</label>
            <button
              type="button"
              onClick={addRequirement}
              className="text-sm text-blue-600"
            >
              + افزودن الزام
            </button>
          </div>
          <div className="space-y-2">
            {formData.requirements.map((req, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg p-3 space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={req.category}
                    onChange={(e) =>
                      updateRequirement(index, "category", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="دسته‌بندی"
                  />
                  <input
                    type="text"
                    value={req.item}
                    onChange={(e) =>
                      updateRequirement(index, "item", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="آیتم"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={req.quantity || ""}
                    onChange={(e) =>
                      updateRequirement(index, "quantity", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="تعداد"
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm"
                  >
                    حذف
                  </button>
                </div>
                <textarea
                  value={req.description || ""}
                  onChange={(e) =>
                    updateRequirement(index, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="توضیحات"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* دکمه ارسال */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "در حال ایجاد..." : "ایجاد مناقصه"}
        </button>
      </form>

      <SupplierNavigation />
    </div>
  );
}

