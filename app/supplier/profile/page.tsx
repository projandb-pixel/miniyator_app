"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";
import PersianDatePicker from "@/components/PersianDatePicker";

export default function SupplierProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    role: string;
    company?: {
      name?: string;
      legalType?: string;
      activityType?: string;
      isKnowledgeBased?: boolean;
      companyType?: string;
      registrationNumber?: string;
      nationalId?: string;
      address?: string;
      officePhone?: string;
      email?: string;
      website?: string;
      workingHours?: string;
      welcomeMessage?: string;
      bio?: string;
      city?: string;
      province?: string;
      logo?: string;
      categories?: Array<{ category: string }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    legalType: "",
    isKnowledgeBased: false,
    activityType: [] as string[],
    companyType: "", // نگه‌داری برای سازگاری
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
    projectHistory: [] as Array<{
      client: string;
      contractTitle: string;
      amount: string;
      startDate: string;
      endDate: string;
      status: "جاری" | "اتمام";
    }>,
    equipmentMachinery: [] as Array<{ name: string }>,
    personnel: [] as Array<{ name: string; role: string }>,
    specializedSoftware: [] as Array<{ name: string }>,
  });

  const [vendorMemberships, setVendorMemberships] = useState<
    Array<{
      id: string;
      name: string;
      isActive: boolean;
      expiryDate: string;
      logo?: string;
    }>
  >([]);

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    isActive: false,
    expiryDate: "",
    logo: "",
  });

  const categories = [
    "مکانیک استاتیک",
    "مکانیک روتاری",
    "برق",
    "ابزاردقیق",
    "آنالایزر",
    "F&G",
    "IT (نرم‌افزار، سخت افزار، شبکه و نظارت تصویری)",
    "سیویل",
    "تجهیزات عمومی",
    "مواد شیمیایی",
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchProfile(storedUserId);
    } else {
      if (globalThis.window !== undefined) {
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
            legalType:
              data.user.company.legalType ||
              data.user.company.companyType ||
              "",
            isKnowledgeBased: data.user.company.isKnowledgeBased || false,
            activityType: data.user.company.activityType
              ? typeof data.user.company.activityType === "string"
                ? data.user.company.activityType.split(",").filter(Boolean)
                : []
              : [],
            companyType:
              data.user.company.companyType ||
              data.user.company.legalType ||
              "",
            registrationNumber: data.user.company.registrationNumber || "",
            nationalId: data.user.company.nationalId || "",
            address: data.user.company.address || "",
            officePhone: data.user.company.officePhone || "",
            email: data.user.company.email || "",
            website: data.user.company.website || "",
            workingHours: data.user.company.workingHours || "",
            welcomeMessage: data.user.company.welcomeMessage || "",
            bio: (() => {
              if (!data.user.company.bio) return "";
              try {
                const bioData = JSON.parse(data.user.company.bio);
                return bioData.about || "";
              } catch {
                return data.user.company.bio;
              }
            })(),
            categories:
              data.user.company.categories?.map(
                (c: { category: string }) => c.category
              ) || [],
            city: data.user.company.city || "",
            province: data.user.company.province || "",
            logo: data.user.company.logo || "",
            projectHistory: [],
            equipmentMachinery: [],
            personnel: [],
            specializedSoftware: [],
          });

          // Parse additional data from bio if exists
          let bioData: any = {};
          if (data.user.company.bio) {
            try {
              bioData = JSON.parse(data.user.company.bio);
              if (bioData.projectHistory) {
                setProfileForm((prev) => ({
                  ...prev,
                  projectHistory: bioData.projectHistory,
                }));
              }
              if (bioData.equipmentMachinery) {
                setProfileForm((prev) => ({
                  ...prev,
                  equipmentMachinery: bioData.equipmentMachinery,
                }));
              }
              if (bioData.personnel) {
                setProfileForm((prev) => ({
                  ...prev,
                  personnel: bioData.personnel,
                }));
              }
              if (bioData.specializedSoftware) {
                setProfileForm((prev) => ({
                  ...prev,
                  specializedSoftware: bioData.specializedSoftware,
                }));
              }
            } catch {}
          }

          // لود vendorMemberships - اول از company.vendorMemberships، سپس از bio
          const company = data.user.company as {
            vendorMemberships?: unknown;
          };
          let memberships: unknown = null;
          
          if (company.vendorMemberships) {
            try {
              memberships =
                typeof company.vendorMemberships === "string"
                  ? JSON.parse(company.vendorMemberships)
                  : company.vendorMemberships;
            } catch {
              memberships = null;
            }
          } else if (bioData.vendorMemberships) {
            // Fallback: استخراج از bio
            memberships = bioData.vendorMemberships;
          }
          
          setVendorMemberships(
            memberships && Array.isArray(memberships) ? memberships : []
          );
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
    const missing: string[] = [];

    // فقط فیلدهای الزامی: نام شرکت، استان، شهر و نوع فعالیت
    if (!profileForm.name || profileForm.name.trim() === "") {
      missing.push("نام شرکت");
    }
    if (!profileForm.province || profileForm.province.trim() === "") {
      missing.push("استان");
    }
    if (!profileForm.city || profileForm.city.trim() === "") {
      missing.push("شهر");
    }
    if (!profileForm.activityType || profileForm.activityType.length === 0) {
      missing.push("نوع فعالیت");
    }

    return missing;
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    // Trim کردن مقادیر قبل از بررسی
    const trimmedForm = {
      name: profileForm.name?.trim() || "",
      province: profileForm.province?.trim() || "",
      city: profileForm.city?.trim() || "",
      legalType: profileForm.legalType?.trim() || "",
      activityType: profileForm.activityType || [],
    };

    const missing: string[] = [];
    if (!trimmedForm.name) missing.push("نام شرکت");
    if (!trimmedForm.province) missing.push("استان");
    if (!trimmedForm.city) missing.push("شهر");
    if (!profileForm.activityType || profileForm.activityType.length === 0)
      missing.push("نوع فعالیت");

    if (missing.length > 0) {
      console.log("Missing fields:", missing);
      console.log("Form values:", {
        name: trimmedForm.name,
        province: trimmedForm.province,
        city: trimmedForm.city,
        legalType: trimmedForm.legalType,
        activityType: trimmedForm.activityType,
      });
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
            name: trimmedForm.name,
            legalType: trimmedForm.legalType || null,
            activityType: Array.isArray(profileForm.activityType)
              ? profileForm.activityType.join(",")
              : profileForm.activityType || null,
            isKnowledgeBased: profileForm.isKnowledgeBased,
            companyType:
              trimmedForm.legalType || profileForm.companyType || null, // نگه‌داری برای سازگاری
            registrationNumber: profileForm.registrationNumber?.trim() || null,
            nationalId: profileForm.nationalId?.trim() || null,
            city: trimmedForm.city,
            province: trimmedForm.province,
            address: profileForm.address?.trim() || null,
            officePhone: profileForm.officePhone?.trim() || null,
            email: profileForm.email?.trim() || null,
            website: profileForm.website?.trim() || null,
            workingHours: profileForm.workingHours?.trim() || null,
            welcomeMessage: profileForm.welcomeMessage?.trim() || null,
            bio: JSON.stringify({
              about: profileForm.bio?.trim() || "",
              projectHistory: profileForm.projectHistory,
              equipmentMachinery: profileForm.equipmentMachinery,
              personnel: profileForm.personnel,
              specializedSoftware: profileForm.specializedSoftware,
            }),
            logo: profileForm.logo?.trim() || null,
          },
          categories: profileForm.categories,
          vendorMemberships: vendorMemberships, // ذخیره عضویت‌ها
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // بررسی وضعیت تکمیل پروفایل
        const statusResponse = await fetch(
          `/api/auth/profile-status?userId=${userId}`
        );
        const statusData = await statusResponse.json();

        if (statusData.profileCompleted) {
          alert("پروفایل با موفقیت ذخیره شد");
          await fetchProfile(userId);
          if (globalThis.window !== undefined) {
            globalThis.window.location.href = "/supplier/dashboard";
          }
        } else {
          alert(
            "پروفایل ذخیره شد، اما هنوز کامل نشده است. لطفاً تمام فیلدهای الزامی را پر کنید."
          );
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
            <Link
              href="/contractor/dashboard"
              className="text-blue-600 mt-2 inline-block"
            >
              رفتن به داشبورد پیمانکار
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      <style jsx global>{`
        .category-btn-text {
          color: #000000 !important;
          font-weight: 700 !important;
        }
      `}</style>
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
              لطفاً اطلاعات زیر را تکمیل کنید تا بتوانید از تمام امکانات استفاده
              کنید
            </p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                نام شرکت *
              </label>
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
              <label className="block text-sm font-medium mb-1">
                نوع شخصیت حقوقی
              </label>
              <select
                value={profileForm.legalType}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    legalType: e.target.value,
                    companyType: e.target.value, // نگه‌داری برای سازگاری
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">انتخاب کنید</option>
                <option value="sahami-khas">سهامی خاص</option>
                <option value="sahami-am">سهامی عام</option>
                <option value="masooliat-mahdud">مسئولیت محدود</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={profileForm.isKnowledgeBased}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      isKnowledgeBased: e.target.checked,
                    }))
                  }
                  className="w-5 h-5"
                />
                <span className="text-gray-700 font-medium">
                  شرکت دانش بنیان هستید؟
                </span>
              </label>
              {profileForm.isKnowledgeBased && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src="/knowledge-based-logo.png"
                    alt="لوگوی دانش بنیان"
                    className="h-8 w-auto"
                    onError={(e) => {
                      // اگر لوگو وجود نداشت، یک placeholder نمایش بده
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span className="text-sm text-green-600 font-medium">
                    ✓ لوگوی دانش بنیان
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                نوع فعالیت * (امکان انتخاب چندگانه)
              </label>
              <div className="space-y-2">
                {[
                  { value: "tolid-konande", label: "تولیدکننده" },
                  {
                    value: "varad-konande",
                    label: "واردکننده (دارای کارت بازرگانی)",
                  },
                  { value: "forushgah", label: "فروشگاه (توزیع‌کننده)" },
                  {
                    value: "namayande-rasmi",
                    label: "نماینده رسمی شرکت خارجی",
                  },
                  { value: "tamin-konande", label: "تأمین‌کننده" },
                ].map((activity) => (
                  <button
                    key={activity.value}
                    type="button"
                    onClick={() => {
                      const current = profileForm.activityType || [];
                      const newActivityType = current.includes(activity.value)
                        ? current.filter((a) => a !== activity.value)
                        : [...current, activity.value];
                      setProfileForm({
                        ...profileForm,
                        activityType: newActivityType,
                      });
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-right transition ${
                      (profileForm.activityType || []).includes(activity.value)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    {activity.label}
                  </button>
                ))}
              </div>
              {(profileForm.activityType || []).length > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  {(profileForm.activityType || []).length} مورد انتخاب شده
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              لطفاً کیبورد خود را روی انگلیسی قرار دهید
            </p>

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
              <label className="block text-sm font-medium mb-1">
                تلفن دفتر
              </label>
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
                  setProfileForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
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
                  setProfileForm((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                شماره ثبت
              </label>
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
              <label className="block text-sm font-medium mb-1">
                درباره شرکت
              </label>
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
              <label className="block text-sm font-medium mb-1">
                ساعات کاری
              </label>
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
              <label className="block text-sm font-medium mb-1">
                پیام خوشامد
              </label>
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
              <label className="block text-sm font-medium mb-1">
                لوگو شرکت
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
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
                      setProfileForm((prev) => ({
                        ...prev,
                        logo: reader.result as string,
                      }));
                    };
                    reader.onerror = () => {
                      alert("خطا در خواندن فایل. لطفاً دوباره تلاش کنید");
                      e.target.value = ""; // پاک کردن انتخاب
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              {profileForm.logo && (
                <div className="mt-2">
                  <img
                    src={profileForm.logo}
                    alt="لوگوی شرکت"
                    className="h-20 w-20 object-contain rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                حوزه فعالیت
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`category-btn-text px-4 py-2 rounded-full text-sm border-2 shadow-md ${
                      profileForm.categories.includes(cat)
                        ? "border-blue-700 bg-blue-300"
                        : "border-gray-500 bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {profileForm.categories.length > 0 && (
                <p className="text-sm text-black mt-2 font-bold">
                  {profileForm.categories.length} مورد انتخاب شده
                </p>
              )}
            </div>

            {/* سوابق تجربی */}
            <div>
              <label className="block text-sm font-medium mb-2">
                سوابق تجربی
              </label>
              <div className="space-y-4">
                {profileForm.projectHistory.map((project, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">سابقه {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newHistory = profileForm.projectHistory.filter(
                            (_, i) => i !== index
                          );
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm"
                      >
                        حذف
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        کارفرما
                      </label>
                      <input
                        type="text"
                        value={project.client}
                        onChange={(e) => {
                          const newHistory = [...profileForm.projectHistory];
                          newHistory[index].client = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="نام کارفرما"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        عنوان قرارداد
                      </label>
                      <input
                        type="text"
                        value={project.contractTitle}
                        onChange={(e) => {
                          const newHistory = [...profileForm.projectHistory];
                          newHistory[index].contractTitle = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="عنوان قرارداد"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          مبلغ
                        </label>
                        <input
                          type="text"
                          value={project.amount}
                          onChange={(e) => {
                            const newHistory = [...profileForm.projectHistory];
                            newHistory[index].amount = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              projectHistory: newHistory,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="مبلغ قرارداد"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          وضعیت
                        </label>
                        <select
                          value={project.status}
                          onChange={(e) => {
                            const newHistory = [...profileForm.projectHistory];
                            newHistory[index].status = e.target.value as
                              | "جاری"
                              | "اتمام";
                            setProfileForm((prev) => ({
                              ...prev,
                              projectHistory: newHistory,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="جاری">جاری</option>
                          <option value="اتمام">اتمام</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          تاریخ شروع
                        </label>
                        <PersianDatePicker
                          value={project.startDate}
                          onChange={(value) => {
                            const newHistory = [...profileForm.projectHistory];
                            newHistory[index].startDate = value;
                            setProfileForm((prev) => ({
                              ...prev,
                              projectHistory: newHistory,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                          placeholder="تاریخ شروع"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          تاریخ پایان
                        </label>
                        <PersianDatePicker
                          value={project.endDate}
                          onChange={(value) => {
                            const newHistory = [...profileForm.projectHistory];
                            newHistory[index].endDate = value;
                            setProfileForm((prev) => ({
                              ...prev,
                              projectHistory: newHistory,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                          placeholder="تاریخ پایان"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm((prev) => ({
                      ...prev,
                      projectHistory: [
                        ...prev.projectHistory,
                        {
                          client: "",
                          contractTitle: "",
                          amount: "",
                          startDate: "",
                          endDate: "",
                          status: "جاری",
                        },
                      ],
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  + افزودن سابقه تجربی
                </button>
              </div>
            </div>

            {/* لیست منابع */}
            <div>
              <label className="block text-sm font-medium mb-2">
                لیست منابع
              </label>

              {/* تجهیزات و ماشین‌آلات */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  تجهیزات و ماشین‌آلات
                </h3>
                <div className="space-y-3">
                  {profileForm.equipmentMachinery.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [
                              ...profileForm.equipmentMachinery,
                            ];
                            newItems[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              equipmentMachinery: newItems,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام تجهیز یا ماشین‌آلات"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems =
                              profileForm.equipmentMachinery.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              equipmentMachinery: newItems,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        equipmentMachinery: [
                          ...prev.equipmentMachinery,
                          { name: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن تجهیزات و ماشین‌آلات
                  </button>
                </div>
              </div>

              {/* پرسنل کلیدی */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">پرسنل کلیدی</h3>
                <div className="space-y-3">
                  {profileForm.personnel.map((person, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => {
                            const newPersonnel = [...profileForm.personnel];
                            newPersonnel[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              personnel: newPersonnel,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mr-2"
                          placeholder="نام"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPersonnel = profileForm.personnel.filter(
                              (_, i) => i !== index
                            );
                            setProfileForm((prev) => ({
                              ...prev,
                              personnel: newPersonnel,
                            }));
                          }}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                      <input
                        type="text"
                        value={person.role}
                        onChange={(e) => {
                          const newPersonnel = [...profileForm.personnel];
                          newPersonnel[index].role = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            personnel: newPersonnel,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="سمت"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        personnel: [...prev.personnel, { name: "", role: "" }],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن پرسنل کلیدی
                  </button>
                </div>
              </div>

              {/* نرم‌افزارهای تخصصی */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  نرم‌افزارهای تخصصی
                </h3>
                <div className="space-y-3">
                  {profileForm.specializedSoftware.map((software, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <input
                          type="text"
                          value={software.name}
                          onChange={(e) => {
                            const newSoftware = [
                              ...profileForm.specializedSoftware,
                            ];
                            newSoftware[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              specializedSoftware: newSoftware,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام نرم‌افزار"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSoftware =
                              profileForm.specializedSoftware.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              specializedSoftware: newSoftware,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        specializedSoftware: [
                          ...prev.specializedSoftware,
                          { name: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن نرم‌افزار تخصصی
                  </button>
                </div>
              </div>
            </div>

            {/* عضویت در وندور لیست‌ها */}
            <div>
              <label className="block text-sm font-medium mb-2">
                عضویت در وندور لیست‌ها، انجمن‌ها و کمیته‌ها
              </label>
              <div className="space-y-3">
                {vendorMemberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="border-2 border-gray-300 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {membership.logo && (
                          <img
                            src={membership.logo}
                            alt={membership.name}
                            className="h-8 w-8 object-contain"
                          />
                        )}
                        <span className="font-medium">{membership.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setVendorMemberships((prev) =>
                            prev.filter((m) => m.id !== membership.id)
                          );
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={membership.isActive}
                          onChange={(e) => {
                            setVendorMemberships((prev) =>
                              prev.map((m) =>
                                m.id === membership.id
                                  ? { ...m, isActive: e.target.checked }
                                  : m
                              )
                            );
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">وضعیت اعتبار</span>
                      </label>
                      <PersianDatePicker
                        value={membership.expiryDate}
                        onChange={(value) => {
                          setVendorMemberships((prev) =>
                            prev.map((m) =>
                              m.id === membership.id
                                ? { ...m, expiryDate: value }
                                : m
                            )
                          );
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        placeholder="تاریخ پایان اعتبار"
                      />
                    </div>
                  </div>
                ))}
                {showVendorForm ? (
                  <div className="border-2 border-blue-300 rounded-lg p-3 bg-blue-50">
                    <input
                      type="text"
                      value={newVendor.name}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, name: e.target.value })
                      }
                      placeholder="نام وندور لیست / انجمن / کمیته"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                    />
                    <input
                      type="text"
                      value={newVendor.logo}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, logo: e.target.value })
                      }
                      placeholder="URL لوگو (اختیاری)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newVendor.isActive}
                          onChange={(e) =>
                            setNewVendor({
                              ...newVendor,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">وضعیت اعتبار</span>
                      </label>
                      <PersianDatePicker
                        value={newVendor.expiryDate}
                        onChange={(value) =>
                          setNewVendor({
                            ...newVendor,
                            expiryDate: value,
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        placeholder="تاریخ پایان اعتبار"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          if (newVendor.name) {
                            setVendorMemberships((prev) => [
                              ...prev,
                              {
                                id: crypto.randomUUID(),
                                ...newVendor,
                              },
                            ]);
                            setNewVendor({
                              name: "",
                              isActive: false,
                              expiryDate: "",
                              logo: "",
                            });
                            setShowVendorForm(false);
                          }
                        }}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
                      >
                        افزودن
                      </button>
                      <button
                        onClick={() => {
                          setShowVendorForm(false);
                          setNewVendor({
                            name: "",
                            isActive: false,
                            expiryDate: "",
                            logo: "",
                          });
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVendorForm(true)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600"
                  >
                    + افزودن عضویت جدید
                  </button>
                )}
              </div>
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
                href="/supplier/dashboard"
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
