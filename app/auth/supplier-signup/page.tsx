"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";
import UserCountDisplay from "@/components/UserCountDisplay";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function SupplierSignup() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    companyName: "",
    legalType: "", // نوع شخصیت حقوقی
    isKnowledgeBased: false, // شرکت دانش بنیان
    activityType: [] as string[], // نوع فعالیت (multi-select)
    phone: "",
    city: "",
    province: "",
    registrationNumber: "",
    address: "",
    officePhone: "",
    email: "",
    website: "",
    // Step 2: Categories
    categories: [] as string[],
    // Step 3: Documents (optional)
    // Step 4: First Product
    productName: "",
    productCategory: "",
    productBrand: "",
    productPrice: "",
    // Step 5: Preferences
    workingHours: "",
    welcomeMessage: "",
    notifications: {
      sms: false,
      whatsapp: false,
      push: true,
    },
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userCounts, setUserCounts] = useState({ contractors: 0, suppliers: 0 });
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const categories = [
    "مکانیک (استاتیک)",
    "مکانیک (روتاری)",
    "برق و ابزاردقیق",
    "سیویل",
    "تجهیزات عمومی",
    "مواد شیمیایی",
    "خدمات مهندسی",
  ];

  const toggleCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSendOTP = async () => {
    if (!formData.phone || formData.phone.length !== 11) {
      setPhoneError("شماره موبایل باید 11 رقم باشد");
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError("شماره موبایل باید با 09 شروع شود و 11 رقم باشد");
      return;
    }

    setPhoneLoading(true);
    setPhoneError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          role: "supplier",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
      } else {
        setPhoneError(data.error || "خطا در ارسال کد تأیید");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setPhoneError("خطا در ارسال کد تأیید");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setPhoneError("کد تأیید باید 6 رقم باشد");
      return;
    }

    if (!formData.phone || formData.phone.length !== 11) {
      setPhoneError("شماره تلفن معتبر نیست");
      return;
    }

    setPhoneLoading(true);
    setPhoneError("");

    try {
      const requestBody = {
        phone: formData.phone.trim(),
        otpCode: otp.trim(),
      };

      console.log("Sending OTP verification:", requestBody);

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone.trim(),
          otpCode: otp.trim(),
        }),
      });

      const data = await response.json();

      console.log("OTP verification response:", data);

      if (data.success && data.user) {
        // ذخیره userId در localStorage
        localStorage.setItem("userId", data.user.id);
        setPhoneVerified(true);
        setOtpSent(false);
        setOtp("");
        setPhoneError("");
      } else {
        setPhoneError(data.error || "کد تأیید نامعتبر است");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setPhoneError("خطا در تأیید کد. لطفاً دوباره تلاش کنید.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !phoneVerified) {
      setPhoneError("لطفاً شماره موبایل را تأیید کنید");
      return;
    }
    if (step < 6) setStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  // دریافت تعداد کاربران
  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const response = await fetch("/api/users/count");
        const data = await response.json();
        if (data.success) {
          setUserCounts({
            contractors: data.contractors || 0,
            suppliers: data.suppliers || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };
    fetchUserCounts();
  }, []);

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/login" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ثبت‌نام تأمین‌کننده</h1>
          <div className="w-10"></div>
        </div>
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded ${
                  s <= step ? "bg-orange-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            مرحله {step} از ۶
          </p>
        </div>
        {/* User Count Display */}
        <div className="px-4 pb-3">
          <UserCountDisplay
            contractorCount={userCounts.contractors}
            supplierCount={userCounts.suppliers}
          />
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">اطلاعات پایه شرکت</h2>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                نام تأمین‌کننده *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="مثال: تأمین تجهیزات صنعتی پارس"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                نوع شخصیت حقوقی *
              </label>
              <select
                value={formData.legalType}
                onChange={(e) =>
                  setFormData({ ...formData, legalType: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
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
                  checked={formData.isKnowledgeBased}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isKnowledgeBased: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
                <span className="text-gray-700 font-medium">
                  شرکت دانش بنیان هستید؟
                </span>
              </label>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
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
                ].map((activity) => (
                  <button
                    key={activity.value}
                    type="button"
                    onClick={() => {
                      const current = formData.activityType || [];
                      const newActivityType = current.includes(activity.value)
                        ? current.filter((a) => a !== activity.value)
                        : [...current, activity.value];
                      setFormData({
                        ...formData,
                        activityType: newActivityType,
                      });
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-right transition ${
                      (formData.activityType || []).includes(activity.value)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-300"
                    }`}
                  >
                    {activity.label}
                  </button>
                ))}
              </div>
              {(formData.activityType || []).length > 0 && (
                <p className="text-xs text-orange-600 mt-2">
                  {(formData.activityType || []).length} مورد انتخاب شده
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              * لطفاً کیبورد خود را روی انگلیسی قرار دهید
            </p>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                شماره موبایل *
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setPhoneError("");
                      setPhoneVerified(false);
                      setOtpSent(false);
                    }}
                    disabled={phoneVerified}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                    placeholder="09123456789"
                    maxLength={11}
                  />
                  {!phoneVerified && (
                    <button
                      onClick={handleSendOTP}
                      disabled={
                        phoneLoading ||
                        !formData.phone ||
                        formData.phone.length !== 11 ||
                        otpSent
                      }
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {phoneLoading ? "..." : otpSent ? "ارسال شد" : "ارسال کد"}
                    </button>
                  )}
                  {phoneVerified && (
                    <div className="px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium whitespace-nowrap flex items-center">
                      ✓ تأیید شد
                    </div>
                  )}
                </div>
                {otpSent && !phoneVerified && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setOtp(value);
                        setPhoneError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6) {
                          handleVerifyOTP();
                        }
                      }}
                      placeholder="کد تأیید 6 رقمی"
                      maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center tracking-widest text-lg"
                      autoFocus
                    />
                    <button
                      onClick={handleVerifyOTP}
                      disabled={phoneLoading || !otp || otp.length !== 6}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {phoneLoading ? "در حال تأیید..." : "تأیید کد"}
                    </button>
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setPhoneError("");
                      }}
                      className="w-full text-gray-600 text-sm"
                    >
                      تغییر شماره موبایل
                    </button>
                  </div>
                )}
                {phoneError && (
                  <p className="text-red-500 text-sm">{phoneError}</p>
                )}
                {otpSent && !phoneVerified && (
                  <p className="text-xs text-gray-500">
                    کد به {formData.phone} ارسال شد
                  </p>
                )}
              </div>
            </div>
            <ProvinceCitySelect
              selectedProvince={formData.province}
              selectedCity={formData.city}
              onProvinceChange={(province) =>
                setFormData({ ...formData, province, city: "" })
              }
              onCityChange={(city) => setFormData({ ...formData, city })}
              required={true}
            />
            <p className="text-xs text-gray-500">
              * فیلدهای اختیاری را می‌توانید بعداً تکمیل کنید
            </p>
            <p className="text-xs text-gray-500 mt-2">
              لطفاً کیبورد خود را روی انگلیسی قرار دهید
            </p>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">انتخاب حوزه فعالیت</h2>
            <p className="text-sm text-gray-600 mb-6">
              حوزه‌های فعالیت خود را انتخاب کنید
            </p>
            <div className="space-y-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                    className={`w-full p-4 rounded-lg border-2 text-right transition ${
                      formData.categories.includes(cat)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {cat.includes("مکانیک")
                        ? "🔧"
                        : cat.includes("برق")
                        ? "⚡"
                        : cat.includes("سیویل")
                        ? "🏗️"
                        : cat.includes("مواد")
                        ? "🧪"
                        : "⚙️"}
                    </span>
                    <span className="font-medium">{cat}</span>
                  </div>
                </button>
              ))}
            </div>
            {formData.categories.length > 0 && (
              <p className="mt-4 text-sm text-orange-600">
                {formData.categories.length} حوزه انتخاب شده
              </p>
            )}
          </div>
        )}

        {/* Step 3: Documents (Optional) */}
        {step === 3 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">بارگذاری مدارک (اختیاری)</h2>
            <p className="text-sm text-gray-600 mb-6">
              بارگذاری مدارک برای افزایش رتبه و اعتبار در Marketplace
            </p>
            <div className="space-y-3">
              {[
                "لوگو",
                "کاتالوگ PDF",
                "معرفی‌نامه",
                "پروژه‌های قبلی",
                "مشتریان قبلی",
              ].map((doc) => (
                <div
                  key={doc}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
                >
                  <span className="text-3xl block mb-2">📄</span>
                  <p className="text-sm font-medium mb-2">{doc}</p>
                  <button className="text-orange-600 text-sm">بارگذاری</button>
                </div>
              ))}
            </div>
            <button
              onClick={nextStep}
              className="mt-4 text-gray-600 text-sm underline"
            >
              رد کردن این مرحله →
            </button>
          </div>
        )}

        {/* Step 4: First Product */}
        {step === 4 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">ثبت اولین محصول</h2>
            <p className="text-sm text-gray-600 mb-4">
              حداقل یک محصول برای حضور در Marketplace لازم است
            </p>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                نام محصول *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) =>
                  setFormData({ ...formData, productName: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="مثال: ترانسمیتر فشار"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                دسته‌بندی *
              </label>
              <select
                value={formData.productCategory}
                onChange={(e) =>
                  setFormData({ ...formData, productCategory: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              >
                <option value="">انتخاب کنید</option>
                <option value="electrical">برق</option>
                <option value="instrumentation">ابزار دقیق</option>
                <option value="mechanical">مکانیک</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                برند
              </label>
              <input
                type="text"
                value={formData.productBrand}
                onChange={(e) =>
                  setFormData({ ...formData, productBrand: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="مثال: Siemens"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                قیمت (اختیاری)
              </label>
              <input
                type="text"
                value={formData.productPrice}
                onChange={(e) =>
                  setFormData({ ...formData, productPrice: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="مثال: ۱۵ میلیون تومان"
              />
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <span className="text-4xl block mb-2">📷</span>
              <p className="text-sm text-gray-600">افزودن عکس محصول</p>
            </div>
          </div>
        )}

        {/* Step 5: Preferences */}
        {step === 5 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">تنظیمات حساب</h2>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                ساعات پاسخ‌گویی
              </label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) =>
                  setFormData({ ...formData, workingHours: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="مثال: ۸ صبح تا ۶ عصر"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                پیام خوشامد
              </label>
              <textarea
                value={formData.welcomeMessage}
                onChange={(e) =>
                  setFormData({ ...formData, welcomeMessage: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="پیام خودکار برای استعلام‌های دریافتی..."
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                دریافت اعلان از طریق:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.notifications.sms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          sms: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span>📱 SMS</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.notifications.whatsapp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          whatsapp: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span>💬 واتساپ</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.notifications.push}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications: {
                          ...formData.notifications,
                          push: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span>🔔 نوتیفیکیشن</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Final Confirmation */}
        {step === 6 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">تأیید نهایی</h2>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">خلاصه اطلاعات:</h3>
                <p className="text-sm text-gray-700">
                  نام تأمین‌کننده: {formData.companyName || "-"}
                </p>
                <p className="text-sm text-gray-700">
                  حوزه‌ها: {formData.categories.length} مورد
                </p>
                <p className="text-sm text-gray-700">
                  محصول: {formData.productName || "-"}
                </p>
              </div>
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <input type="checkbox" className="w-5 h-5 mt-1" required />
                <span className="text-sm">
                  قوانین و شرایط استفاده را مطالعه کرده‌ام و می‌پذیرم
                </span>
              </label>
            </div>
            <button
              onClick={async () => {
                const userId = localStorage.getItem("userId");
                if (!userId) {
                  alert("خطا: لطفاً دوباره وارد شوید");
                  window.location.href = "/auth/login";
                  return;
                }

                // بررسی فیلدهای الزامی
                if (
                  !formData.companyName ||
                  !formData.province ||
                  !formData.city ||
                  !formData.activityType ||
                  formData.activityType.length === 0
                ) {
                  alert(
                    "لطفاً فیلدهای الزامی (نام تأمین‌کننده، استان، شهر، نوع فعالیت) را پر کنید"
                  );
                  return;
                }

                try {
                  // ذخیره داده‌های شرکت
                  const response = await fetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId,
                      companyData: {
                        name: formData.companyName,
                        legalType: formData.legalType || null,
                        activityType: Array.isArray(formData.activityType)
                          ? formData.activityType.join(",")
                          : formData.activityType || null,
                        isKnowledgeBased: formData.isKnowledgeBased,
                        city: formData.city,
                        province: formData.province,
                        registrationNumber: formData.registrationNumber || null,
                        address: formData.address || null,
                        officePhone: formData.officePhone || null,
                        email: formData.email || null,
                        website: formData.website || null,
                        workingHours: formData.workingHours || null,
                        welcomeMessage: formData.welcomeMessage || null,
                      },
                      categories: formData.categories,
                    }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    // اگر محصولی ثبت شده، آن را هم ذخیره کن
                    if (formData.productName && formData.productCategory) {
                      const companyId =
                        data.company?.id || data.user?.company?.id;
                      if (companyId) {
                        await fetch("/api/supplier/products", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            companyId,
                            name: formData.productName,
                            category: formData.productCategory,
                            brand: formData.productBrand || null,
                            price: formData.productPrice || null,
                          }),
                        });
                      }
                    }

                    // دریافت companyId از response
                    const companyId =
                      data.company?.id || data.user?.company?.id;

                    if (!companyId) {
                      console.error("Company ID not found in response:", data);
                      alert("خطا: شرکت ایجاد نشد. لطفاً دوباره تلاش کنید.");
                      return;
                    }

                    alert("ثبت‌نام با موفقیت انجام شد!");
                    // کمی صبر کن تا داده‌ها ذخیره شوند
                    setTimeout(() => {
                      window.location.href = "/supplier/dashboard";
                    }, 1000);
                  } else {
                    alert(data.error || "خطا در ثبت‌نام");
                  }
                } catch (error) {
                  console.error("Error saving profile:", error);
                  alert("خطا در ثبت‌نام");
                }
              }}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-medium text-lg"
            >
              فعال‌سازی پروفایل و ورود به داشبورد
            </button>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              ورود شما به معنای پذیرش{" "}
              <a href="/terms" className="text-blue-600 underline" target="_blank">
                شرایط و قوانین وین تندر
              </a>
              {" "}و{" "}
              <a href="/privacy" className="text-blue-600 underline" target="_blank">
                قوانین حریم خصوصی
              </a>
              {" "}است
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 6 && (
          <>
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
                >
                  ← قبلی
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium"
              >
                بعدی →
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              ورود شما به معنای پذیرش{" "}
              <a href="/terms" className="text-blue-600 underline" target="_blank">
                شرایط و قوانین وین تندر
              </a>
              {" "}و{" "}
              <a href="/privacy" className="text-blue-600 underline" target="_blank">
                قوانین حریم خصوصی
              </a>
              {" "}است
            </p>
          </>
        )}
      </div>
    </div>
  );
}
