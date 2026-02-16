"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";
import UserCountDisplay from "@/components/UserCountDisplay";

type Step = 1 | 2 | 3;

export default function ContractorSignup() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Step 1: اطلاعات پایه شرکت
    legalType: "", // نوع شخصیت حقوقی
    companyName: "", // نام کامل شرکت
    nationalId: "", // شناسه ملی
    registrationNumber: "", // شماره ثبت
    establishmentYear: "", // سال تأسیس
    province: "",
    city: "",
    address: "", // آدرس دفتر مرکزی
    officePhone: "", // شماره تلفن شرکت
    email: "", // ایمیل کاری
    phone: "", // شماره موبایل
    letterheadImage: "", // تصویر سربرگ رسمی شرکت

    // Step 2: حوزه تخصصی فعالیت
    mainActivityAreas: [] as string[], // EPC, PC
    technicalAreas: [] as string[], // حوزه‌های فنی
    equipmentList: "", // لیست تجهیزات و ماشین‌آلات (اختیاری)
    keyPersonnelCount: "", // تعداد نیروهای کلیدی (اختیاری)

    // Step 3: رتبه و صلاحیت فنی
    rank: "", // رتبه 1-5
    rankCertificate: "", // گواهی رتبه‌بندی
    ministryCertificate: "", // گواهی صلاحیت پیمانکاری وزارت نفت
    hseCertificate: "", // گواهی صلاحیت ایمنی پیمانکاران
    qualificationCertificate: "", // گواهی تایید صلاحیت پیمانکاری
    iso9001: false,
    iso14001: false,
    iso45001: false,
    iso50001: false,
    wpsPqr: false, // تاییدیه صلاحیت جوشکاری
    asme: false,
    api: false,
    personnelCertificates: "", // گواهی‌های مربوط به پرسنل
  });

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userCounts, setUserCounts] = useState({ contractors: 0, suppliers: 0 });
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const legalTypes = [
    { value: "sahami-khas", label: "سهامی خاص" },
    { value: "sahami-am", label: "سهامی عام" },
    { value: "masooliat-mahdud", label: "مسئولیت محدود" },
  ];

  const mainActivityAreas = [
    { value: "epc", label: "EPC (Design – Procurement – Construction)" },
    { value: "pc", label: "PC (Procurement – Construction)" },
  ];

  const technicalAreas = [
    "مکانیک (استاتیک: مخازن، پایپینگ، مبدل و ....)",
    "مکانیک (روتاری: کمپرسور، پمپ و...)",
    "برق",
    "ابزار دقیق، اتوماسیون صنعتی و کنترل",
    "آنالایزر",
    "F&G",
    "IT (نرم‌افزار، سخت افزار، شبکه و نظارت تصویری)",
    "سیویل و سازه",
    "تعمیرات و نگهداری (O&M)",
    "رنگ، عایق، سندبلاست",
    "HSE خدمات ایمنی",
    "بازرسی فنی (QA/QC)",
  ];

  const ranks = [
    { value: "1", label: "رتبه ۱ (بالاترین)" },
    { value: "2", label: "رتبه ۲" },
    { value: "3", label: "رتبه ۳" },
    { value: "4", label: "رتبه ۴" },
    { value: "5", label: "رتبه ۵" },
  ];

  const toggleArrayItem = (
    array: string[],
    item: string,
    field: "mainActivityAreas" | "technicalAreas"
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
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
    if (step === 1) {
      // اعتبارسنجی مرحله 1
      if (!phoneVerified) {
        setPhoneError("لطفاً شماره موبایل را تأیید کنید");
        return;
      }
      if (
        !formData.companyName ||
        !formData.phone
      ) {
        setPhoneError("لطفاً فیلدهای الزامی (نام شرکت و شماره موبایل) را پر کنید");
        return;
      }
    }
    if (step === 2) {
      // اعتبارسنجی مرحله 2
      if (
        formData.mainActivityAreas.length === 0 ||
        formData.technicalAreas.length === 0
      ) {
        setPhoneError("لطفاً حداقل یک حوزه اصلی و یک حوزه فنی را انتخاب کنید");
        return;
      }
    }
    if (step < 3) setStep((step + 1) as Step);
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

  const handleSubmit = async () => {
    // اعتبارسنجی نهایی
    if (!phoneVerified) {
      setPhoneError("لطفاً شماره موبایل را تأیید کنید");
      return;
    }

    try {
      // ایجاد/به‌روزرسانی پروفایل
      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.companyName,
          legalType: formData.legalType,
          nationalId: formData.nationalId,
          registrationNumber: formData.registrationNumber,
          establishmentYear: formData.establishmentYear,
          province: formData.province,
          city: formData.city,
          address: formData.address,
          officePhone: formData.officePhone,
          email: formData.email,
          phone: formData.phone,
          logo: formData.letterheadImage,
          categories: formData.technicalAreas,
          // سایر فیلدها را می‌توان در schema اضافه کرد
        }),
      });

      const profileData = await profileResponse.json();

      if (profileData.success || profileData.user) {
        // ذخیره userId در localStorage
        if (profileData.user?.id) {
          localStorage.setItem("userId", profileData.user.id);
        }
        // هدایت به داشبورد
        setTimeout(() => {
          router.push("/contractor/dashboard");
        }, 500);
      } else {
        setPhoneError("خطا در ثبت اطلاعات. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setPhoneError("خطا در ثبت اطلاعات. لطفاً دوباره تلاش کنید.");
    }
  };

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/auth/login" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">ثبت‌نام پیمانکار</h1>
          <div className="w-10"></div>
        </div>
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            مرحله {step} از ۳
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
        {/* Step 1: اطلاعات پایه شرکت */}
        {step === 1 && (
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-bold mb-4">🔵 ۱) اطلاعات پایه شرکت</h2>

            {/* الف) مشخصات حقوقی */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">الف) مشخصات حقوقی</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  نوع شخصیت حقوقی
                </label>
                <select
                  value={formData.legalType}
                  onChange={(e) =>
                    setFormData({ ...formData, legalType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">انتخاب کنید</option>
                  {legalTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ب) اطلاعات هویتی شرکت */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                ب) اطلاعات هویتی شرکت
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    نام کامل شرکت *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="نام کامل شرکت"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      شناسه ملی
                    </label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) =>
                        setFormData({ ...formData, nationalId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="شناسه ملی"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      شماره ثبت
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="شماره ثبت"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    سال تأسیس
                  </label>
                  <input
                    type="number"
                    value={formData.establishmentYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      // فقط اعداد را قبول کن و حداکثر 4 رقم
                      const numericValue = value.replace(/\D/g, "").slice(0, 4);
                      setFormData({
                        ...formData,
                        establishmentYear: numericValue,
                      });
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      // اگر مقدار وارد شده و کمتر از 4 رقم است، پاک کن
                      if (value && value.length < 4) {
                        setFormData({
                          ...formData,
                          establishmentYear: "",
                        });
                      }
                    }}
                    maxLength={4}
                    min="1300"
                    max="1500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="مثال: ۱۳۸۰"
                  />
                </div>

                <ProvinceCitySelect
                  selectedProvince={formData.province}
                  selectedCity={formData.city}
                  onProvinceChange={(province) =>
                    setFormData({ ...formData, province, city: "" })
                  }
                  onCityChange={(city) => setFormData({ ...formData, city })}
                  required={false}
                />
                <p className="text-xs text-gray-500 mt-2 mb-4">
                  لطفاً کیبورد خود را روی انگلیسی قرار دهید
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    آدرس دفتر مرکزی
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="آدرس کامل دفتر مرکزی"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    شماره تلفن شرکت
                  </label>
                  <input
                    type="tel"
                    value={formData.officePhone}
                    onChange={(e) =>
                      setFormData({ ...formData, officePhone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="02112345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    ایمیل کاری
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
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
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {phoneLoading
                            ? "..."
                            : otpSent
                            ? "ارسال شد"
                            : "ارسال کد"}
                        </button>
                      )}
                      {phoneVerified && (
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium whitespace-nowrap flex items-center">
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
                            setOtp(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            );
                            setPhoneError("");
                          }}
                          placeholder="کد تأیید 6 رقمی"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center tracking-widest"
                        />
                        <button
                          onClick={handleVerifyOTP}
                          disabled={phoneLoading || !otp || otp.length !== 6}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    تصویر سربرگ رسمی شرکت
                  </label>
                  <input
                    type="url"
                    value={formData.letterheadImage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        letterheadImage: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="URL تصویر سربرگ"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: حوزه تخصصی فعالیت */}
        {step === 2 && (
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-bold mb-4">🔵 ۲) حوزه تخصصی فعالیت</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">حوزه‌های اصلی *</h3>
              <div className="space-y-2">
                {mainActivityAreas.map((area) => (
                  <button
                    key={area.value}
                    onClick={() =>
                      toggleArrayItem(
                        formData.mainActivityAreas,
                        area.value,
                        "mainActivityAreas"
                      )
                    }
                    className={`w-full p-3 rounded-lg border-2 text-right transition ${
                      formData.mainActivityAreas.includes(area.value)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">حوزه‌های فنی *</h3>
              <p className="text-sm text-gray-600 mb-3">
                ✔ پیمانکار می‌تواند چند مورد انتخاب کند.
              </p>
              <div className="space-y-2">
                {technicalAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() =>
                      toggleArrayItem(
                        formData.technicalAreas,
                        area,
                        "technicalAreas"
                      )
                    }
                    className={`w-full p-3 rounded-lg border-2 text-right transition ${
                      formData.technicalAreas.includes(area)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                مدارک اختیاری ولی بسیار مهم:
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    لیست تجهیزات و ماشین‌آلات
                  </label>
                  <textarea
                    value={formData.equipmentList}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        equipmentList: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="لیست تجهیزات و ماشین‌آلات..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    تعداد نیروهای کلیدی (مهندس، تکنسین، جوشکار، برقکار، …)
                  </label>
                  <input
                    type="text"
                    value={formData.keyPersonnelCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        keyPersonnelCount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="مثال: 50 نفر"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: رتبه و صلاحیت فنی */}
        {step === 3 && (
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <h2 className="text-xl font-bold mb-4">
              🔵 ۳) رتبه و صلاحیت فنی پیمانکار
            </h2>

            {/* الف) رتبه‌بندی رسمی */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                الف) رتبه‌بندی رسمی
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  رتبه (رتبه ۱ بالاترین)
                </label>
                <select
                  value={formData.rank}
                  onChange={(e) =>
                    setFormData({ ...formData, rank: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">انتخاب کنید</option>
                  {ranks.map((rank) => (
                    <option key={rank.value} value={rank.value}>
                      {rank.label}
                    </option>
                  ))}
                </select>
              </div>
              {formData.rank && (
                <div className="space-y-3 bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800">
                    مدارک الزامی اگر دارای رتبه باشد:
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      گواهی رتبه‌بندی از سازمان برنامه و بودجه
                    </label>
                    <input
                      type="url"
                      value={formData.rankCertificate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rankCertificate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="URL گواهی"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      گواهی صلاحیت پیمانکاری وزارت نفت (در صورت وجود)
                    </label>
                    <input
                      type="url"
                      value={formData.ministryCertificate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ministryCertificate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="URL گواهی"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ب) گواهینامه‌ها و مدارک تخصصی */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                ب) گواهینامه‌ها و مدارک تخصصی
              </h3>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-red-600">
                  گواهینامه‌های الزامی برای صنعت نفت، گاز و پتروشیمی:
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      گواهی صلاحیت ایمنی پیمانکاران (HSE) - وزارت کار *
                    </label>
                    <input
                      type="url"
                      value={formData.hseCertificate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hseCertificate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="URL گواهی"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      گواهی تایید صلاحیت پیمانکاری – سازمان برنامه و بودجه *
                    </label>
                    <input
                      type="url"
                      value={formData.qualificationCertificate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualificationCertificate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="URL گواهی"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-blue-600">
                  استانداردهای مدیریتی (اختیاری):
                </p>
                <div className="space-y-2">
                  {[
                    { key: "iso9001", label: "ISO 9001 سیستم مدیریت کیفیت" },
                    {
                      key: "iso14001",
                      label: "ISO 14001 مدیریت محیط زیست",
                    },
                    {
                      key: "iso45001",
                      label: "ISO 45001 مدیریت ایمنی و بهداشت",
                    },
                    {
                      key: "iso50001",
                      label:
                        "ISO 50001 مدیریت انرژی (برای پروژه‌های نفت و گاز)",
                    },
                  ].map((iso) => (
                    <label
                      key={iso.key}
                      className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData[iso.key as keyof typeof formData] as boolean
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [iso.key]: e.target.checked,
                          })
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-gray-700 font-medium">
                        {iso.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-blue-600">
                  گواهینامه‌های حرفه‌ای (اختیاری):
                </p>
                <div className="space-y-2">
                  {[
                    {
                      key: "wpsPqr",
                      label: "تاییدیه صلاحیت جوشکاری (WPS/PQR)",
                    },
                    {
                      key: "asme",
                      label: "گواهی ASME (برای مخازن و تجهیزات تحت فشار)",
                    },
                    {
                      key: "api",
                      label:
                        "گواهی API (در صورت کار با خطوط لوله، تانک، مخازن)",
                    },
                  ].map((cert) => (
                    <label
                      key={cert.key}
                      className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData[cert.key as keyof typeof formData] as boolean
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [cert.key]: e.target.checked,
                          })
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-gray-700 font-medium">
                        {cert.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  گواهی‌های مربوط به پرسنل (اختیاری ولی مهم)
                </label>
                <textarea
                  value={formData.personnelCertificates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      personnelCertificates: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="توضیحات گواهی‌های پرسنل..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium"
            >
              ← قبلی
            </button>
          )}
          {step < 3 ? (
            <>
              <button
                onClick={nextStep}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                بعدی →
              </button>
              <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed w-full">
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
          ) : (
            <>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                تایید و ورود به داشبورد
              </button>
              <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed w-full">
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
    </div>
  );
}
