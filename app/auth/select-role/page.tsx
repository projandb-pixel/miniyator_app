"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function SelectRole() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<
    "contractor" | "supplier" | null
  >(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/auth/quick-register?role=${selectedRole}`);
    }
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 to-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Slogan */}
        <div className="mb-12 flex flex-col items-center">
          <Logo size="lg" />
          <p className="text-gray-700 text-md mt-4 text-center">
            اولین شبکه اجتماعی-صنعتی پیمانکاران و تأمین‌کنندگان ایران
          </p>
        </div>

        {/* Role Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            انتخاب نوع کاربری
          </h2>
          <p className="text-gray-600 text-center text-sm">
            لطفاً نوع کاربری خود را انتخاب کنید
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setSelectedRole("contractor")}
              className={`w-full py-4 px-6 rounded-lg font-medium transition text-right ${
                selectedRole === "contractor"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">پیمانکار</span>
                {selectedRole === "contractor" && (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm mt-2 opacity-90">
                فقط برای شرکت‌های پیمانکاری
              </p>
            </button>

            <button
              onClick={() => setSelectedRole("supplier")}
              className={`w-full py-4 px-6 rounded-lg font-medium transition text-right ${
                selectedRole === "supplier"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">تأمین‌کننده</span>
                {selectedRole === "supplier" && (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm mt-2 opacity-90">
                برای تأمین‌کنندگان تجهیزات و مواد
              </p>
            </button>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`w-full text-white py-3 rounded-lg font-medium text-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedRole === "contractor"
                ? "bg-blue-600 hover:bg-blue-700"
                : selectedRole === "supplier"
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {selectedRole === "contractor"
              ? "پیمانکار و ادامه"
              : selectedRole === "supplier"
              ? "تأمین‌کننده و ادامه"
              : "ادامه"}
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <a href="/auth/login" className="text-blue-600 font-medium">
              ورود
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
