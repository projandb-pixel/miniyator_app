"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";

export default function SupplierProfileComplete() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
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
    logo: "",
  });

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
    } else {
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

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
            categories: data.user.company.categories?.map((c: any) => c.category) || [],
            city: data.user.company.city || "",
            province: data.user.company.province || "",
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

  const toggleCategory = (category: string) => {
    setProfileForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const getMissingFields = () => {
    if (!profile?.company) {
      const required = ["نام شرکت", "شهر", "استان", "نوع شرکت"];
      return required;
    }

    const missing: string[] = [];
    if (!profileForm.name) missing.push("نام شرکت");
    if (!profileForm.province) missing.push("استان");
    if (!profileForm.city) missing.push("شهر");
    if (!profileForm.companyType) missing.push("نوع شرکت");

    return missing;
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
            companyType: profileForm.companyType,
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
          },
          categories: profileForm.categories,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // بررسی وضعیت تکمیل پروفایل
        const statusResponse = await fetch(`/api/auth/profile-status?userId=${userId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.profileCompleted) {
          alert("پروفایل با موفقیت ذخیره شد");
          await fetchProfile(userId);
          if (globalThis.window) {
            globalThis.window.location.href = "/supplier/dashboard";
          }
        } else {
          alert("پروفایل ذخیره شد، اما هنوز کامل نشده است. لطفاً تمام فیلدهای الزامی را پر کنید.");
          await fetchProfile(userId);
        }
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

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // بررسی نقش کاربر
  if (profile && profile.role !== "supplier") {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800">شما به عنوان پیمانکار وارد شده‌اید</p>
            <Link href="/dashboard" className="text-blue-600 mt-2 inline-block">
              رفتن به داشبورد پیمانکار
            </Link>
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
          <Link href="/supplier/dashboard" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">تکمیل پروفایل</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Banner */}
        {getMissingFields().length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              لطفاً اطلاعات زیر را تکمیل کنید تا بتوانید از تمام امکانات استفاده کنید
            </p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">نام شرکت *</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
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
              <label className="block text-sm font-medium mb-1">نوع شرکت *</label>
              <select
                value={profileForm.companyType}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    companyType: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">انتخاب کنید</option>
                <option value="sahami">سهامی</option>
                <option value="masooliat">مسئولیت محدود</option>
                <option value="shakhsi">شخصی</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ایمیل</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">تلفن دفتر</label>
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
                  setProfileForm((prev) => ({ ...prev, address: e.target.value }))
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="آدرس کامل شرکت"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">وب‌سایت</label>
              <input
                type="url"
                value={profileForm.website}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, website: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">شماره ثبت</label>
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
              <label className="block text-sm font-medium mb-1">کد ملی</label>
              <input
                type="text"
                value={profileForm.nationalId}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    nationalId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="کد ملی شرکت"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">درباره شرکت</label>
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
              <label className="block text-sm font-medium mb-1">ساعات کاری</label>
              <input
                type="text"
                value={profileForm.workingHours}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    workingHours: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="مثال: ۸ صبح تا ۶ عصر"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">پیام خوشامد</label>
              <textarea
                value={profileForm.welcomeMessage}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    welcomeMessage: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="پیام خودکار برای استعلام‌های دریافتی..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">لوگو شرکت</label>
              <input
                type="text"
                value={profileForm.logo}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, logo: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="URL لوگو"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">حوزه فعالیت</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm border-2 ${
                      profileForm.categories.includes(cat)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-700"
                    }`}
                  >
                    {cat}
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
              <Link
                href="/supplier-dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                انصراف
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

