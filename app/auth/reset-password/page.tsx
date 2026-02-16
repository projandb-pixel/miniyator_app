"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // اگر phone وجود نداشت، به صفحه فراموشی رمز عبور هدایت کن
  if (!phone) {
    router.push("/auth/forgot-password");
    return null;
  }

  const handleResetPassword = async () => {
    // اعتبارسنجی
    if (!otp || !newPassword || !confirmPassword) {
      setError("لطفاً همه فیلدها را پر کنید");
      return;
    }

    if (otp.length !== 6) {
      setError("کد تأیید باید 6 رقم باشد");
      return;
    }

    if (newPassword.length < 6) {
      setError("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          otpCode: otp.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // هدایت به صفحه لاگین
        alert("رمز عبور با موفقیت تغییر کرد. لطفاً وارد شوید.");
        router.push("/auth/login");
      } else {
        setError(data.error || "خطا در تغییر رمز عبور");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 to-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Slogan */}
        <div className="mb-12 flex flex-col items-center">
          <Logo size="lg" />
          <p className="text-gray-700 text-md mt-4 text-center">
            اتصال تصمیم ساز و هوشمند صنعتی
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            تغییر رمز عبور
          </h2>
          <p className="text-gray-600 text-center text-sm">
            کد تأیید ارسال شده به شماره {phone} را وارد کنید
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              کد تأیید
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg text-center tracking-widest"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز عبور جدید
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="حداقل 6 کاراکتر"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تکرار رمز عبور جدید
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تکرار رمز عبور"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "در حال تغییر..." : "تغییر رمز عبور"}
          </button>

          <button
            onClick={() => router.push("/auth/forgot-password")}
            className="w-full text-gray-600 py-2 text-sm"
          >
            بازگشت
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gradient-to-br from-blue-50 to-white min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}






