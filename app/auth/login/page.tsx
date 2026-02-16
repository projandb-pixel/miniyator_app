"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

function LoginContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // دریافت URL مقصد از query parameter
  const redirectTo = searchParams.get('redirect');

  const handleLogin = async () => {
    if (!phone || !password) {
      setError("لطفاً شماره موبایل و رمز عبور را وارد کنید");
      return;
    }

    if (phone.length !== 11) {
      setError("شماره موبایل باید 11 رقم باشد");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // اطمینان از ارسال cookie
        body: JSON.stringify({
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      console.log("Login response:", { ok: response.ok, data });

      if (!response.ok) {
        setError(data.error || "خطا در ورود. لطفاً دوباره تلاش کنید.");
        return;
      }

      if (data.success && data.user) {
        console.log("Login successful, user:", data.user);
        // ذخیره userId در localStorage (برای fallback)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userRole", data.user.role);
            console.log("localStorage set:", { userId: data.user.id, role: data.user.role });
          }
        } catch (e) {
          console.warn("Could not save to localStorage:", e);
        }

        // تعیین URL مقصد (بدون نیاز به بررسی پروفایل - middleware خودش بررسی می‌کند)
        let destinationUrl = '';
        
        // اگر redirectTo وجود داشت، به آن صفحه برو
        if (redirectTo && redirectTo.startsWith('/')) {
          destinationUrl = redirectTo;
        } else {
          // هدایت به صفحه اصلی بر اساس role
          destinationUrl = data.user.role === "contractor" 
            ? "/contractor/home" 
            : "/supplier/home";
        }

        // استفاده از صفحه میانی redirect برای اطمینان از set شدن cookie
        console.log("Redirecting to:", destinationUrl);
        console.log("User ID:", data.user.id);
        console.log("Cookies:", document.cookie);
        
        if (typeof window !== 'undefined') {
          // استفاده از صفحه میانی redirect
          const redirectUrl = new URL('/auth/redirect', window.location.origin);
          redirectUrl.searchParams.set('to', destinationUrl);
          redirectUrl.searchParams.set('userId', data.user.id);
          
          // تاخیر کوتاه برای اطمینان از set شدن cookie
          setTimeout(() => {
            console.log("Executing redirect to:", redirectUrl.toString());
            window.location.replace(redirectUrl.toString());
          }, 200);
        }
      } else {
        setError(data.error || "خطا در ورود. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError("خطا در ورود. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 to-white h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md h-full flex flex-col justify-center">
        {/* Logo and Slogan */}
        <div className="mb-4 flex flex-col items-center">
          <Logo size="lg" />
          <p className="text-gray-700 text-sm mt-2 text-center">
            اولین شبکه اجتماعی-صنعتی پیمانکاران و تأمین‌کنندگان ایران
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <h2 className="text-xl font-bold text-center text-gray-800">
            ورود به حساب کاربری
          </h2>
          <p className="text-gray-600 text-center text-xs">
            شماره موبایل و رمز عبور خود را وارد کنید
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              شماره موبایل
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="09123456789"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base"
              maxLength={11}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <label className="block text-sm font-medium text-gray-700">
                رمز عبور
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور خود را وارد کنید"
                className="w-full px-4 py-2.5 pr-24 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {password && (
                  <button
                    type="button"
                    onClick={() => setPassword("")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              لطفاً کیبورد خود را روی حالت انگلیسی قرار دهید
            </p>
          </div>

          <div className="text-right">
            <a
              href="/auth/forgot-password"
              className="text-xs text-blue-600 hover:underline"
            >
              فراموشی رمز عبور؟
            </a>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-base hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "در حال ورود..." : "ورود"}
          </button>
        </div>

        {/* Signup Links and About Us */}
        <div className="mt-3 text-center space-y-1">
          <div>
            <p className="text-gray-600 text-xs inline">حساب کاربری ندارید؟ </p>
            <a
              href="/auth/select-role"
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              ثبت‌نام
            </a>
          </div>
          <div>
            <button
              onClick={() => setShowAboutModal(true)}
              className="text-gray-500 text-xs hover:text-gray-700 underline"
            >
              درباره ما
            </button>
          </div>
        </div>
      </div>

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">درباره ما</h3>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="text-gray-700 space-y-6 text-sm leading-relaxed">
              {/* Introduction */}
              <div>
                <p className="mb-3">
                  وین تندر نخستین پلتفرم هوشمند، یکپارچه و داده‌محور اکوسیستم صنعت ایران است؛ جایی که تأمین‌کنندگان و پیمانکاران در یک محیط دیجیتال گرد هم می‌آیند تا فرآیند شناسایی کالاهای مناقصات، خرید و تأمین تجهیزات پروژه‌های صنعتی با سرعت، شفافیت و کارایی بیشتری انجام شود.
                </p>
                <p className="mb-3">
                  ما وین تندر را با یک هدف روشن ساختیم:
                </p>
                <p className="font-semibold text-gray-800">
                  دیجیتالی‌سازی زنجیره تأمین صنعت ایران و تبدیل اطلاعات پراکنده به یک جریان هوشمند ارزش‌آفرین.
                </p>
                <p className="mt-3">
                  در این مسیر، داده‌ها، قیمت‌ها، مناقصات، توانمندی‌ها و فرصت‌های همکاری در یک پلتفرم متمرکز می‌شوند تا تصمیم‌سازی و اجرا، سریع‌تر، دقیق‌تر و شفاف‌تر انجام شود.
                </p>
              </div>

              {/* Mission */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">مأموریت ما</h4>
                <p>
                  ایجاد اتصال هوشمند، شفاف و قابل اعتماد میان تأمین‌کنندگان تجهیزات، پیمانکاران پروژه‌های صنعتی، با تکیه بر فناوری‌های داده‌کاوی، هوش مصنوعی و پردازش اطلاعات.
                </p>
              </div>

              {/* Values */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">ارزش های وین تندر</h4>
                
                {/* For Contractors */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-bold">✔️</span>
                    <h5 className="font-semibold text-gray-800">برای پیمانکاران</h5>
                  </div>
                  <p className="mb-2 text-gray-600">
                    وین تندر یک ابزار قدرتمند تصمیم‌سازی و یافتن تأمین‌کننده است:
                  </p>
                  <ul className="space-y-1 mr-4 text-gray-700">
                    <li>🔹 مشاهده روزانه و هوشمند مناقصات گردآوری‌شده از پتروشیمی‌ها</li>
                    <li>🔹 مشاهده دسته‌بندی های فنی مناقصه</li>
                    <li>🔹 مشاهده تعداد بازدید پیمانکاران و تأمین‌کنندگان از مناقصات</li>
                    <li>🔹 دسترسی به بازار جامع و دسته‌بندی‌شده تأمین‌کنندگان</li>
                    <li>🔹 فید هوشمند (شبیه اینستاگرام) با قابلیت لایک، ذخیره، اشتراک‌گذاری و نظارت روی مناقصات</li>
                    <li>🔹 داشتن داشبورد اختصاصی با قابلیت های:</li>
                    <li className="mr-4">✅ امکان ارزیابی کیفی لحظه ای</li>
                    <li className="mr-4">✅ تحلیل‌های مبتنی بر داده برای برآورد هزینه و افزایش احتمال برنده‌شدن در هر مناقصه</li>
                    <li className="mr-4">✅ ارسال و دریافت استعلام از تأمین‌کنندگان</li>
                  </ul>
                  <p className="mt-2 font-semibold text-gray-800">
                    برای پیمانکاران وین تندر یعنی: اطلاعات کامل، انتخاب سریع، تصمیم دقیق.
                  </p>
                </div>

                {/* For Suppliers */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-bold">✔️</span>
                    <h5 className="font-semibold text-gray-800">برای تأمین‌کنندگان</h5>
                  </div>
                  <p className="mb-2 text-gray-600">
                    ویترین تخصصی برای کالاهای صنعتی است:
                  </p>
                  <ul className="space-y-1 mr-4 text-gray-700">
                    <li>🔹 ساخت پروفایل حرفه‌ای و نمایش برند، کالاها و سوابق</li>
                    <li>🔹 نمایش کالاها با قیمت، ویژگی‌های فنی و شرایط فروش</li>
                    <li>🔹 دیده شدن توسط پیمانکاران واقعی و فعال در پروژه‌های پتروشیمی</li>
                    <li>🔹 فید هوشمند (شبیه اینستاگرام) با قابلیت لایک، ذخیره، اشتراک‌گذاری و نظارت روی مناقصات</li>
                    <li>🔹 دریافت درخواست‌های استعلام و همکاری به‌صورت مستقیم و هدفمند</li>
                    <li>🔹 مقایسه عملکرد و قیمت‌ها با رقبا</li>
                    <li>🔹 افزایش اعتماد از طریق نشان «تأمین‌کننده تأییدشده»</li>
                    <li>🔹 حضور در یک Marketplace صنعتی بدون نیاز به داشتن وب‌سایت مستقل</li>
                  </ul>
                  <p className="mt-2 font-semibold text-gray-800">
                    برای تأمین‌کنندگان وین تندر یعنی: فروش بیشتر، دیده‌شدن بهتر، ارتباطات دقیق‌تر
                  </p>
                </div>
              </div>

              {/* Vision */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">چشم‌انداز ما</h4>
                <p>
                  ساخت بزرگ‌ترین و قابل اعتمادترین مرکز داده، مناقصه و همکاری صنعت ایران؛ جایی که پیمانکاران، تأمین‌کنندگان و متخصصان، بر پایه‌ی داده، بدون واسطه و با سرعت دیجیتال با یکدیگر کار می‌کنند.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gradient-to-br from-blue-50 to-white h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
