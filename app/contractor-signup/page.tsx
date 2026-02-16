"use client";

import { useState } from "react";
import Link from "next/link";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function ContractorSignup() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    companyName: "",
    phone: "",
    city: "",
    province: "",
    activityType: "",
    registrationNumber: "",
    email: "",
    officePhone: "",
    // Step 2: Specializations
    specializations: [] as string[],
    // Step 3: Resume (optional)
    // Step 4: Tender Preferences
    tenderTypes: [] as string[],
    industries: [] as string[],
    regions: [] as string[],
    alertFrequency: "daily",
    // Step 5: Smart Features
    smartFeatures: {
      showSuppliers: true,
      showFreelancers: true,
      priceEstimation: true,
    },
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const specializations = [
    "مکانیک (استاتیک)",
    "مکانیک (روتاری)",
    "برق و ابزار دقیق",
    "سیویل",
    "HSE",
    "خرید/بازرگانی",
  ];

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
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
          role: "contractor",
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

    setPhoneLoading(true);
    setPhoneError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          otpCode: otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPhoneVerified(true);
        setOtpSent(false);
        setOtp("");
      } else {
        setPhoneError(data.error || "کد تأیید نامعتبر است");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setPhoneError("خطا در تأیید کد");
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

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/login" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ثبت‌نام پیمانکار</h1>
          <div className="w-10"></div>
        </div>
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            مرحله {step} از ۶
          </p>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">اطلاعات پایه شرکت</h2>
            <p className="text-sm text-gray-600 mb-4">ثبت‌نام ۱ دقیقه‌ای</p>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">نام شرکت *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="مثال: شرکت پیمانکاری صنعتی پارس"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">شماره موبایل مدیر پروژه/بازرگانی *</label>
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
                      disabled={phoneLoading || !formData.phone || formData.phone.length !== 11 || otpSent}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setPhoneError("");
                      }}
                      placeholder="کد تأیید 6 رقمی"
                      maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center tracking-widest"
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
              onProvinceChange={(province) => setFormData({ ...formData, province, city: "" })}
              onCityChange={(city) => setFormData({ ...formData, city })}
              required={true}
            />
            <div>
              <label className="block text-gray-700 mb-2 font-medium">نوع فعالیت (اختیاری)</label>
              <select
                value={formData.activityType}
                onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">انتخاب کنید</option>
                <option value="epc">EPC</option>
                <option value="subcontractor">پیمانکار جزء</option>
                <option value="engineering">مهندسی</option>
                <option value="services">خدمات</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Specializations */}
        {step === 2 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">انتخاب تخصص‌ها</h2>
            <p className="text-sm text-gray-600 mb-6">
              تخصص‌های خود را انتخاب کنید. فید مناقصات بر اساس همین‌ها شخصی‌سازی می‌شود.
            </p>
            <div className="space-y-3">
              {specializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => toggleSpecialization(spec)}
                  className={`w-full p-4 rounded-lg border-2 text-right transition ${
                    formData.specializations.includes(spec)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {spec.includes("مکانیک") ? "🔧" :
                       spec.includes("برق") ? "⚡" :
                       spec.includes("سیویل") ? "🏗️" :
                       spec.includes("HSE") ? "🛡️" : "📋"}
                    </span>
                    <span className="font-medium">{spec}</span>
                  </div>
                </button>
              ))}
            </div>
            {formData.specializations.length > 0 && (
              <p className="mt-4 text-sm text-blue-600">
                {formData.specializations.length} تخصص انتخاب شده
              </p>
            )}
          </div>
        )}

        {/* Step 3: Resume (Optional) */}
        {step === 3 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">بارگذاری رزومه (اختیاری)</h2>
            <p className="text-sm text-gray-600 mb-6">
              این مرحله برای نسخه B2B توسعه است. می‌توانید رد کنید.
            </p>
            <div className="space-y-3">
              {["پروفایل شرکت", "پروژه‌های انجام شده", "گواهینامه‌ها", "ظرفیت پروژه"].map((item) => (
                <div key={item} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <span className="text-3xl block mb-2">📄</span>
                  <p className="text-sm font-medium mb-2">{item}</p>
                  <button className="text-blue-600 text-sm">بارگذاری</button>
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

        {/* Step 4: Tender Preferences */}
        {step === 4 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">تنظیم نیازهای مناقصه‌ای</h2>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">نوع مناقصه</label>
              <div className="flex flex-wrap gap-2">
                {["E", "P", "C"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const types = formData.tenderTypes.includes(type)
                        ? formData.tenderTypes.filter(t => t !== type)
                        : [...formData.tenderTypes, type];
                      setFormData({ ...formData, tenderTypes: types });
                    }}
                    className={`px-4 py-2 rounded-full text-sm border-2 ${
                      formData.tenderTypes.includes(type)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">صنایع مورد علاقه</label>
              <div className="flex flex-wrap gap-2">
                {["پتروشیمی"].map((industry) => (
                  <button
                    key={industry}
                    onClick={() => {
                      const industries = formData.industries.includes(industry)
                        ? formData.industries.filter(i => i !== industry)
                        : [...formData.industries, industry];
                      setFormData({ ...formData, industries });
                    }}
                    className={`px-4 py-2 rounded-full text-sm border-2 ${
                      formData.industries.includes(industry)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">مناطق جغرافیایی</label>
              <div className="flex flex-wrap gap-2">
                {["ماهشهر"].map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      const regions = formData.regions.includes(region)
                        ? formData.regions.filter(r => r !== region)
                        : [...formData.regions, region];
                      setFormData({ ...formData, regions });
                    }}
                    className={`px-4 py-2 rounded-full text-sm border-2 ${
                      formData.regions.includes(region)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">فرکانس هشدارها</label>
              <select
                value={formData.alertFrequency}
                onChange={(e) => setFormData({ ...formData, alertFrequency: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="daily">روزانه</option>
                <option value="weekly">هفتگی</option>
              </select>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                🔥 این تنظیمات سیستم پیشنهاد مناقصه را فعال می‌کند
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Smart Features */}
        {step === 5 && (
          <div className="bg-white rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">فعال‌سازی امکانات هوشمند</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.smartFeatures.showSuppliers}
                  onChange={(e) => setFormData({
                    ...formData,
                    smartFeatures: { ...formData.smartFeatures, showSuppliers: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">نمایش تأمین‌کنندگان مرتبط</p>
                  <p className="text-xs text-gray-600">تأمین‌کنندگان مناسب برای پروژه‌های شما</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.smartFeatures.showFreelancers}
                  onChange={(e) => setFormData({
                    ...formData,
                    smartFeatures: { ...formData.smartFeatures, showFreelancers: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">نمایش فریلنسرهای مناسب</p>
                  <p className="text-xs text-gray-600">فریلنسرهای مرتبط با پروژه‌های شما</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.smartFeatures.priceEstimation}
                  onChange={(e) => setFormData({
                    ...formData,
                    smartFeatures: { ...formData.smartFeatures, priceEstimation: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">تخمین اولیه و حدودی قیمت پروژه</p>
                  <p className="text-xs text-gray-600">برآورد هوشمند هزینه پروژه‌ها</p>
                </div>
              </label>
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
                <p className="text-sm text-gray-700">نام شرکت: {formData.companyName || "-"}</p>
                <p className="text-sm text-gray-700">تخصص‌ها: {formData.specializations.length} مورد</p>
                <p className="text-sm text-gray-700">مناطق: {formData.regions.length} مورد</p>
              </div>
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                <input type="checkbox" className="w-5 h-5 mt-1" required />
                <span className="text-sm">شرایط استفاده را مطالعه کرده‌ام و می‌پذیرم</span>
              </label>
            </div>
            <button
              onClick={() => {
                if (globalThis.window) {
                  globalThis.window.location.href = "/home";
                }
              }}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-medium text-lg"
            >
              فعال‌سازی داشبورد و ورود به فید مناقصات
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 6 && (
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
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              بعدی →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

