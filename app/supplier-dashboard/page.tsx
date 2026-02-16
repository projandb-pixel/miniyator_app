"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import SupplierNavigation from "@/components/supplier/SupplierNavigation";

interface Profile {
  role: string;
  company?: {
    id: string;
    name: string;
    logo?: string | null;
    isVerified: boolean;
    products?: Array<{
      id: string;
      name: string;
      category: string;
      price?: string | null;
    }>;
    projects?: Array<{
      id: string;
      title: string;
      client?: string | null;
      value?: string | null;
    }>;
    reviews?: Array<{ id: string }>;
  };
}

const ALLOWED_PHONE_FOR_TENDER = "09128473158";

export default function SupplierDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    brand: "",
    price: "",
    priceRange: "",
    description: "",
    specifications: "",
    unit: "",
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    client: "",
    value: "",
    year: "",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      // بررسی نقش کاربر
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.role === "contractor") {
              // اگر پیمانکار است، به صفحه پیمانکار هدایت کن
              if (globalThis.window !== undefined) {
                globalThis.window.location.href = "/contractor/dashboard";
              }
            } else {
              setUserId(storedUserId);
              fetchProfile(storedUserId);
            }
          }
        })
        .catch(() => {
          setLoading(false);
        });
    } else if (globalThis.window !== undefined) {
      globalThis.window.location.href = "/auth/login";
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();

      if (data.user) {
        setProfile(data.user);
        setUserPhone(data.user.phone || null);
        // بررسی دقیق‌تر وجود company
        if (!data.user?.company?.id) {
          // اگر company وجود ندارد یا id ندارد، پروفایل ناقص است
          console.log("Company not found or incomplete");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!userId || !profile?.company) {
      alert("لطفاً ابتدا پروفایل خود را تکمیل کنید");
      return;
    }

    if (!productForm.name || !productForm.category) {
      alert("نام و دسته‌بندی محصول الزامی است");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/supplier/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: profile.company.id,
          ...productForm,
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // بدنه غیر JSON
      }

      if (response.ok) {
        alert("محصول با موفقیت اضافه شد");
        setProductForm({
          name: "",
          category: "",
          brand: "",
          price: "",
          priceRange: "",
          description: "",
          specifications: "",
          unit: "",
        });
        setShowProductForm(false);
        fetchProfile(userId);
      } else {
        const msg =
          data?.error ||
          data?.details ||
          data?.message ||
          "خطا در افزودن محصول";
        const code = data?.code ? ` (code: ${data.code})` : "";
        alert(`${msg}${code}`);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("خطا در افزودن محصول");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = async () => {
    if (!userId || !profile?.company) {
      alert("لطفاً ابتدا پروفایل خود را تکمیل کنید");
      return;
    }

    if (!projectForm.title) {
      alert("عنوان پروژه الزامی است");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/supplier/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: profile.company.id,
          ...projectForm,
          year: projectForm.year ? Number.parseInt(projectForm.year, 10) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("پروژه با موفقیت اضافه شد");
        setProjectForm({
          title: "",
          description: "",
          client: "",
          value: "",
          year: "",
        });
        setShowProjectForm(false);
        fetchProfile(userId);
      } else {
        alert(data.error || "خطا در افزودن پروژه");
      }
    } catch (error) {
      console.error("Error adding project:", error);
      alert("خطا در افزودن پروژه");
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

  if (!profile?.company?.id) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              لطفاً ابتدا پروفایل خود را تکمیل کنید
            </p>
            <Link
              href="/supplier/profile"
              className="text-blue-600 mt-2 inline-block"
            >
              تکمیل پروفایل
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header with Supplier Profile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
              {profile.company.logo ? (
                <Image
                  src={profile.company.logo}
                  alt={profile.company.name || "لوگوی شرکت"}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                (() => {
                  const name = profile.company.name;
                  return name && name.length > 0 ? name.charAt(0) : "?";
                })()
              )}
            </div>
            <div>
              <h1 className="text-base font-bold">داشبورد تأمین‌کننده</h1>
              <p className="text-sm text-gray-700">{profile.company.name}</p>
              {profile.company.isVerified && (
                <span className="mt-1 inline-block text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  ✓ تأیید شده
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Quick Actions */}
        <div className="bg-white p-3 mb-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">
            عملیات سریع
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowProductForm(true)}
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                افزودن محصول
              </span>
            </button>
            <button
              onClick={() => setShowProjectForm(true)}
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                افزودن پروژه
              </span>
            </button>
            {userPhone === ALLOWED_PHONE_FOR_TENDER && (
              <Link
                href="/supplier/tenders/create"
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200"
              >
                <svg
                  className="w-5 h-5 text-orange-600 mb-1"
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
                  ایجاد مناقصه
                </span>
              </Link>
            )}
            <Link
              href="/supplier/messages"
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
              href="/supplier/home?tab=inquiries"
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                استعلام‌ها
              </span>
            </Link>
            <Link
              href="/supplier/marketplace"
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
              href="/supplier/saved"
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <svg
                className="w-5 h-5 text-indigo-600 mb-1"
                fill="none"
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
              <span className="text-xs font-medium text-gray-700">ذخیره شده</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 mb-4 rounded-lg">
          <h3 className="font-bold mb-3">آمار</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {profile.company.products?.length || 0}
              </p>
              <p className="text-xs text-gray-600">محصول</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {profile.company.projects?.length || 0}
              </p>
              <p className="text-xs text-gray-600">پروژه</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {profile.company.reviews?.length || 0}
              </p>
              <p className="text-xs text-gray-600">نظر</p>
            </div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white p-4 mb-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">محصولات اخیر</h3>
            <button
              onClick={() => setShowProductForm(true)}
              className="text-blue-600 text-sm"
            >
              + افزودن
            </button>
          </div>
          {profile.company.products && profile.company.products.length > 0 ? (
            <div className="space-y-2">
              {profile.company.products.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-xs text-gray-600">{product.category}</p>
                  {product.price && (
                    <p className="text-sm font-bold text-green-600 mt-1">
                      {product.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              محصولی ثبت نشده است
            </p>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-white p-4 mb-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">پروژه‌های اخیر</h3>
            <button
              onClick={() => setShowProjectForm(true)}
              className="text-blue-600 text-sm"
            >
              + افزودن
            </button>
          </div>
          {profile.company.projects && profile.company.projects.length > 0 ? (
            <div className="space-y-2">
              {profile.company.projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <h4 className="font-medium">{project.title}</h4>
                  {project.client && (
                    <p className="text-xs text-gray-600">
                      مشتری: {project.client}
                    </p>
                  )}
                  {project.value && (
                    <p className="text-sm font-bold text-green-600 mt-1">
                      {project.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              پروژه‌ای ثبت نشده است
            </p>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">افزودن محصول</h2>
              <button
                onClick={() => setShowProductForm(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="product-name"
                  className="block text-sm font-medium mb-1"
                >
                  نام محصول *
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="product-category"
                  className="block text-sm font-medium mb-1"
                >
                  دسته‌بندی *
                </label>
                <select
                  id="product-category"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  <option value="برق">برق</option>
                  <option value="ابزار دقیق">ابزار دقیق</option>
                  <option value="مکانیک">مکانیک</option>
                  <option value="سیویل">سیویل</option>
                  <option value="مواد شیمیایی">مواد شیمیایی</option>
                  <option value="تجهیزات عمومی">تجهیزات عمومی</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="product-brand"
                  className="block text-sm font-medium mb-1"
                >
                  برند
                </label>
                <input
                  id="product-brand"
                  type="text"
                  value={productForm.brand}
                  onChange={(e) =>
                    setProductForm({ ...productForm, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="نام برند محصول"
                />
              </div>
              <div>
                <label
                  htmlFor="product-price"
                  className="block text-sm font-medium mb-1"
                >
                  قیمت
                </label>
                <input
                  id="product-price"
                  type="text"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: ۱۵ میلیون تومان"
                />
              </div>
              <div>
                <label
                  htmlFor="product-price-range"
                  className="block text-sm font-medium mb-1"
                >
                  بازه قیمت
                </label>
                <input
                  id="product-price-range"
                  type="text"
                  value={productForm.priceRange}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      priceRange: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: ۱۰-۲۰ میلیون تومان"
                />
              </div>
              <div>
                <label
                  htmlFor="product-unit"
                  className="block text-sm font-medium mb-1"
                >
                  واحد
                </label>
                <input
                  id="product-unit"
                  type="text"
                  value={productForm.unit}
                  onChange={(e) =>
                    setProductForm({ ...productForm, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: عدد، کیلوگرم"
                />
              </div>
              <div>
                <label
                  htmlFor="product-description"
                  className="block text-sm font-medium mb-1"
                >
                  توضیحات
                </label>
                <textarea
                  id="product-description"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="توضیحات محصول"
                />
              </div>
              <div>
                <label
                  htmlFor="product-specifications"
                  className="block text-sm font-medium mb-1"
                >
                  مشخصات فنی
                </label>
                <textarea
                  id="product-specifications"
                  value={productForm.specifications}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      specifications: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مشخصات فنی محصول"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddProduct}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button
                  onClick={() => setShowProductForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">افزودن پروژه</h2>
              <button
                onClick={() => setShowProjectForm(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="project-title"
                  className="block text-sm font-medium mb-1"
                >
                  عنوان پروژه *
                </label>
                <input
                  id="project-title"
                  type="text"
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="project-description"
                  className="block text-sm font-medium mb-1"
                >
                  توضیحات
                </label>
                <textarea
                  id="project-description"
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="توضیحات پروژه"
                />
              </div>
              <div>
                <label
                  htmlFor="project-client"
                  className="block text-sm font-medium mb-1"
                >
                  مشتری
                </label>
                <input
                  id="project-client"
                  type="text"
                  value={projectForm.client}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, client: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="نام مشتری"
                />
              </div>
              <div>
                <label
                  htmlFor="project-value"
                  className="block text-sm font-medium mb-1"
                >
                  ارزش پروژه
                </label>
                <input
                  id="project-value"
                  type="text"
                  value={projectForm.value}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, value: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: ۲۵ میلیارد تومان"
                />
              </div>
              <div>
                <label
                  htmlFor="project-year"
                  className="block text-sm font-medium mb-1"
                >
                  سال
                </label>
                <input
                  id="project-year"
                  type="number"
                  value={projectForm.year}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, year: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: ۱۴۰۲"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddProject}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button
                  onClick={() => setShowProjectForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SupplierNavigation />
    </div>
  );
}
