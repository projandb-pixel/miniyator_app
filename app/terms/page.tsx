"use client";

import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function TermsPage() {
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
          <h1 className="text-lg font-bold">شرایط و قوانین وین تندر</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="text-center mb-6">
            <Logo size="md" />
            <h2 className="text-xl font-bold mt-4">شرایط و قوانین استفاده از پلتفرم وین تندر</h2>
            <p className="text-sm text-gray-500 mt-2">آخرین به‌روزرسانی: دی ۱۴۰۳</p>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            <section>
              <h3 className="font-bold text-base mb-2">۱. پذیرش شرایط</h3>
              <p>
                با ثبت‌نام و استفاده از پلتفرم وین تندر، شما به طور کامل و بدون قید و شرط، تمام شرایط و قوانین مندرج در این صفحه را می‌پذیرید. در صورت عدم پذیرش هر یک از این شرایط، لطفاً از استفاده از پلتفرم خودداری کنید.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۲. تعریف کاربر</h3>
              <p>
                کاربران پلتفرم وین تندر شامل پیمانکاران و تأمین‌کنندگان صنعتی هستند که با ثبت‌نام و تأیید هویت، امکان استفاده از خدمات پلتفرم را دریافت می‌کنند.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۳. مسئولیت‌های کاربر</h3>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>ارائه اطلاعات صحیح و به‌روز در هنگام ثبت‌نام و تکمیل پروفایل</li>
                <li>حفظ امنیت حساب کاربری و رمز عبور</li>
                <li>استفاده مناسب و قانونی از پلتفرم</li>
                <li>رعایت قوانین و مقررات جمهوری اسلامی ایران</li>
                <li>عدم انتشار محتوای توهین‌آمیز، غیراخلاقی یا غیرقانونی</li>
                <li>رعایت حقوق مالکیت فکری و معنوی</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۴. خدمات پلتفرم</h3>
              <p>
                وین تندر یک پلتفرم ارتباطی و اطلاعاتی است که امکان ارتباط بین پیمانکاران و تأمین‌کنندگان را فراهم می‌کند. این پلتفرم صرفاً یک واسطه است و مسئولیتی در قبال معاملات و قراردادهای منعقد شده بین کاربران ندارد.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۵. محتوای کاربران</h3>
              <p>
                کاربران مسئول تمام محتوایی هستند که در پلتفرم منتشر می‌کنند. وین تندر حق حذف یا ویرایش هر محتوایی که مغایر با قوانین و مقررات باشد را برای خود محفوظ می‌دارد.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۶. محدودیت مسئولیت</h3>
              <p>
                وین تندر هیچ گونه تضمینی در مورد صحت، کامل بودن یا به‌روز بودن اطلاعات ارائه شده در پلتفرم نمی‌دهد. کاربران باید قبل از تصمیم‌گیری، اطلاعات را به طور مستقل بررسی کنند.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۷. تغییرات در شرایط</h3>
              <p>
                وین تندر حق تغییر، اصلاح یا به‌روزرسانی این شرایط را در هر زمان دارد. ادامه استفاده از پلتفرم پس از اعلام تغییرات، به معنای پذیرش شرایط جدید است.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۸. فسخ حساب کاربری</h3>
              <p>
                وین تندر حق دارد در صورت نقض شرایط استفاده، حساب کاربری هر کاربری را بدون اطلاع قبلی مسدود یا حذف کند.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۹. قوانین حاکم</h3>
              <p>
                این شرایط بر اساس قوانین جمهوری اسلامی ایران تنظیم شده و هر گونه اختلاف در این زمینه در دادگاه‌های صالحه تهران قابل رسیدگی است.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">۱۰. تماس با ما</h3>
              <p>
                در صورت وجود هر گونه سوال یا ابهام در مورد این شرایط، می‌توانید از طریق بخش پشتیبانی با ما تماس بگیرید.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}




