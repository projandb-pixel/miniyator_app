"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function ForgotPassword() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 11) {
      setError("لطفاً شماره موبایل معتبر وارد کنید");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // بعد از 2 ثانیه به صفحه تغییر رمز عبور هدایت کن
        setTimeout(() => {
          router.push(`/auth/reset-password?phone=${phone.trim()}`);
        }, 2000);
      } else {
        setError(data.error || "خطا در ارسال کد");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError("خطا در ارسال کد. لطفاً دوباره تلاش کنید.");
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

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            بازیابی رمز عبور
          </h2>
          <p className="text-gray-600 text-center text-sm">
            شماره موبایل خود را وارد کنید تا کد تأیید برای شما ارسال شود
          </p>

          {!success ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="09123456789"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                  maxLength={11}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "در حال ارسال..." : "ارسال کد تأیید"}
              </button>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              <p className="font-medium">کد تأیید ارسال شد!</p>
              <p className="mt-2">در حال هدایت به صفحه تغییر رمز عبور...</p>
            </div>
          )}

          <button
            onClick={() => router.push("/auth/login")}
            className="w-full text-gray-600 py-2 text-sm"
          >
            بازگشت به صفحه ورود
          </button>
        </div>
      </div>
    </div>
  );
}






