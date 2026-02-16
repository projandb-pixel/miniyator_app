"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="mobile-container bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600"
          >
            ← بازگشت
          </button>
          <h1 className="text-lg font-bold">قوانین حریم خصوصی</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="text-center mb-6">
            <Logo size="md" />
            <h2 className="text-xl font-bold mt-4">قوانین حریم خصوصی وین تندر</h2>
            <p className="text-sm text-gray-500 mt-2">آخرین به‌روزرسانی: دی ۱۴۰۳</p>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <section>
              <h3 className="font-bold text-base mb-2">۱. تعهد ما به حریم خصوصی</h3>
              <p>
                وین تندر متعهد است که حریم خصوصی کاربران را رعایت کرده و اطلاعات شخصی آن‌ها را با رعایت بالاترین استانداردهای امنیتی محافظت کند.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۲. اطلاعاتی که جمع‌آوری می‌کنیم</h3>
              <p className="mb-2">ما اطلاعات زیر را از کاربران جمع‌آوری می‌کنیم:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>اطلاعات ثبت‌نام: شماره موبایل، نام شرکت، نوع فعالیت</li>
                <li>اطلاعات پروفایل: آدرس، شماره تماس، ایمیل، وب‌سایت</li>
                <li>اطلاعات فعالیت: مناقصات، استعلام‌ها، پیام‌ها</li>
                <li>اطلاعات فنی: آدرس IP، نوع مرورگر، سیستم عامل</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۳. نحوه استفاده از اطلاعات</h3>
              <p className="mb-2">ما از اطلاعات شما برای موارد زیر استفاده می‌کنیم:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>ارائه و بهبود خدمات پلتفرم</li>
                <li>ارتباط با کاربران و پاسخ به درخواست‌ها</li>
                <li>ارسال اعلان‌ها و به‌روزرسانی‌ها</li>
                <li>تحلیل و بهبود تجربه کاربری</li>
                <li>رعایت قوانین و مقررات</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۴. اشتراک‌گذاری اطلاعات</h3>
              <p>
                ما اطلاعات شخصی کاربران را به هیچ شخص ثالثی نمی‌فروشیم یا اجاره نمی‌دهیم. اطلاعات فقط در موارد زیر با اشخاص ثالث به اشتراک گذاشته می‌شود:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4 mt-2">
                <li>با رضایت صریح کاربر</li>
                <li>برای ارائه خدمات مورد نیاز (مثل ارسال پیامک)</li>
                <li>در صورت الزام قانونی</li>
                <li>برای محافظت از حقوق و امنیت پلتفرم</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۵. امنیت اطلاعات</h3>
              <p>
                ما از روش‌های امنیتی پیشرفته برای محافظت از اطلاعات کاربران استفاده می‌کنیم، از جمله رمزگذاری داده‌ها، کنترل دسترسی و نظارت مستمر بر سیستم‌های امنیتی.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۶. کوکی‌ها و فناوری‌های مشابه</h3>
              <p>
                ما از کوکی‌ها و فناوری‌های مشابه برای بهبود تجربه کاربری و تحلیل استفاده از پلتفرم استفاده می‌کنیم. کاربران می‌توانند تنظیمات مرورگر خود را برای مدیریت کوکی‌ها تغییر دهند.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۷. حقوق کاربران</h3>
              <p className="mb-2">کاربران حق دارند:</p>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>به اطلاعات شخصی خود دسترسی داشته باشند</li>
                <li>اطلاعات نادرست را اصلاح کنند</li>
                <li>درخواست حذف اطلاعات خود را بدهند</li>
                <li>از دریافت پیام‌های تبلیغاتی انصراف دهند</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۸. اطلاعات عمومی</h3>
              <p>
                برخی از اطلاعات شما (مانند نام شرکت، شهر، دسته‌بندی) به صورت عمومی در پلتفرم نمایش داده می‌شود تا سایر کاربران بتوانند با شما ارتباط برقرار کنند.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۹. تغییرات در قوانین حریم خصوصی</h3>
              <p>
                ما ممکن است این قوانین را در آینده به‌روزرسانی کنیم. در صورت تغییرات مهم، از طریق ایمیل یا اعلان در پلتفرم به شما اطلاع خواهیم داد.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۱۰. تماس با ما</h3>
              <p>
                در صورت وجود هر گونه سوال یا نگرانی در مورد حریم خصوصی، می‌توانید از طریق بخش پشتیبانی با ما تماس بگیرید.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}




