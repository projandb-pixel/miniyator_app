"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import UserCountDisplay from "@/components/UserCountDisplay";

function QuickRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") as "contractor" | "supplier" | null;

  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [userCounts, setUserCounts] = useState({ contractors: 0, suppliers: 0 });

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

  // اگر role وجود نداشت، به صفحه انتخاب نقش هدایت کن
  if (!role || (role !== "contractor" && role !== "supplier")) {
    router.push("/auth/select-role");
    return null;
  }

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 11) {
      setPhoneError("شماره موبایل باید 11 رقم باشد");
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
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
          phone: phone.trim(),
          role: role,
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
          phone: phone.trim(),
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

  const handleRegister = async () => {
    // اعتبارسنجی
    if (!phoneVerified) {
      setError("لطفاً ابتدا شماره موبایل را با کد تأیید تأیید کنید");
      return;
    }

    if (!phone || !companyName || !password || !confirmPassword) {
      setError("لطفاً همه فیلدها را پر کنید");
      return;
    }

    if (phone.length !== 11) {
      setError("شماره موبایل باید 11 رقم باشد");
      return;
    }

    if (password.length < 6) {
      setError("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    if (password !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          password,
          companyName: companyName.trim(),
          role,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // ذخیره userId در localStorage
        localStorage.setItem("userId", data.user.id);

        // هدایت به صفحه تکمیل پروفایل
        if (role === "contractor") {
          window.location.href = "/contractor/profile";
        } else {
          window.location.href = "/supplier/profile";
        }
      } else {
        setError(data.error || "خطا در ثبت‌نام");
      }
    } catch (error) {
      console.error("Error registering:", error);
      setError("خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`mobile-container bg-gradient-to-br min-h-screen flex items-center justify-center p-4 ${
        role === "supplier"
          ? "from-orange-50 to-white"
          : "from-blue-50 to-white"
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo and Slogan */}
        <div className="mb-8 flex flex-col items-center">
          <Logo size="lg" />
          <p className="text-gray-700 text-md mt-4 text-center">
            اولین شبکه اجتماعی-صنعتی پیمانکاران و تأمین‌کنندگان ایران
          </p>
          <UserCountDisplay
            contractorCount={userCounts.contractors}
            supplierCount={userCounts.suppliers}
          />
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            ثبت‌نام {role === "contractor" ? "پیمانکار" : "تأمین‌کننده"}
          </h2>
          <p className="text-gray-600 text-center text-sm">
            اطلاعات اولیه را وارد کنید
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره موبایل *
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ""));
                      setPhoneError("");
                      setPhoneVerified(false);
                      setOtpSent(false);
                    }}
                    disabled={phoneVerified}
                    placeholder="09123456789"
                    className={`flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none text-lg disabled:bg-gray-100 ${
                      role === "supplier"
                        ? "focus:border-orange-500"
                        : "focus:border-blue-500"
                    }`}
                    maxLength={11}
                  />
                {!phoneVerified && (
                  <button
                    onClick={handleSendOTP}
                    disabled={phoneLoading || !phone || phone.length !== 11 || otpSent}
                    className={`px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                      role === "supplier"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
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
                    placeholder="کد 6 رقمی"
                    className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none text-lg text-center ${
                      role === "supplier"
                        ? "focus:border-orange-500"
                        : "focus:border-blue-500"
                    }`}
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerifyOTP}
                    disabled={phoneLoading || !otp || otp.length !== 6}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {phoneLoading ? "در حال بررسی..." : "تأیید کد"}
                  </button>
                </div>
              )}
              {phoneError && (
                <p className="text-red-600 text-sm">{phoneError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نام شرکت
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="مثال: شرکت پیمانکاری صنعتی پارس"
              className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none ${
                role === "supplier"
                  ? "focus:border-orange-500"
                  : "focus:border-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل 6 کاراکتر"
              className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none ${
                role === "supplier"
                  ? "focus:border-orange-500"
                  : "focus:border-blue-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تکرار رمز عبور
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تکرار رمز عبور"
              className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none ${
                role === "supplier"
                  ? "focus:border-orange-500"
                  : "focus:border-blue-500"
              }`}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full text-white py-3 rounded-lg font-medium text-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
              role === "supplier"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "در حال ثبت‌نام..." : "ثبت‌نام و ادامه"}
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
            ورود شما به معنای پذیرش{" "}
            <a
              href="/terms"
              className={`underline ${
                role === "supplier"
                  ? "text-orange-600 hover:text-orange-700"
                  : "text-blue-600 hover:text-blue-700"
              }`}
              target="_blank"
            >
              شرایط و قوانین وین تندر
            </a>
            {" "}و{" "}
            <a
              href="/privacy"
              className={`underline ${
                role === "supplier"
                  ? "text-orange-600 hover:text-orange-700"
                  : "text-blue-600 hover:text-blue-700"
              }`}
              target="_blank"
            >
              قوانین حریم خصوصی
            </a>
            {" "}است
          </p>

          <button
            onClick={() => router.push("/auth/select-role")}
            className="w-full text-gray-600 py-2 text-sm"
          >
            بازگشت به انتخاب نقش
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <a
              href="/auth/login"
              className={`font-medium ${
                role === "supplier"
                  ? "text-orange-600 hover:text-orange-700"
                  : "text-blue-600 hover:text-blue-700"
              }`}
            >
              ورود
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function QuickRegister() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gradient-to-br from-blue-50 to-white min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <QuickRegisterContent />
    </Suspense>
  );
}


