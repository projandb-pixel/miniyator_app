# راهنمای تنظیم دیتابیس وین تندر

## پیش‌نیازها

1. SQL Server باید روی سیستم نصب و در حال اجرا باشد
2. دیتابیس `miniyator` باید ایجاد شده باشد
3. کاربر `ai_user` با رمز `A@1234567` باید وجود داشته باشد

## ایجاد دیتابیس (اگر وجود ندارد)

اگر دیتابیس هنوز ایجاد نشده، می‌توانید از SQL Server Management Studio یا دستورات زیر استفاده کنید:

```sql
-- ایجاد دیتابیس
CREATE DATABASE miniyator;

-- ایجاد کاربر (اگر وجود ندارد)
CREATE LOGIN ai_user WITH PASSWORD = 'A@1234567';

-- دادن دسترسی به کاربر
USE miniyator;
CREATE USER ai_user FOR LOGIN ai_user;
ALTER ROLE db_owner ADD MEMBER ai_user;
```

## نصب وابستگی‌ها

```bash
npm install
```

## تنظیم فایل .env

فایل `.env` را در ریشه پروژه ایجاد کنید و محتوای زیر را در آن قرار دهید:

```env
DATABASE_URL="sqlserver://localhost:1433;database=miniyator;user=ai_user;password=A@1234567;trustServerCertificate=true"
```

**نکته:** اگر SQL Server روی پورت دیگری اجرا می‌شود، پورت را در connection string تغییر دهید.

## ایجاد جداول در دیتابیس

بعد از نصب وابستگی‌ها و تنظیم `.env`، دستورات زیر را اجرا کنید:

```bash
# تولید Prisma Client
npm run db:generate

# ایجاد جداول در دیتابیس
npm run db:push
```

یا برای استفاده از Migration:

```bash
# ایجاد migration
npm run db:migrate
```

## مشاهده دیتابیس با Prisma Studio

```bash
npm run db:studio
```

این دستور یک رابط گرافیکی باز می‌کند که می‌توانید داده‌های دیتابیس را مشاهده و ویرایش کنید.

## ساختار جداول

دیتابیس شامل جداول زیر است:

- **Users**: کاربران (پیمانکار و تأمین‌کننده)
- **Companies**: اطلاعات شرکت‌ها
- **CompanyCategories**: دسته‌بندی‌های تأمین‌کنندگان
- **Products**: محصولات تأمین‌کنندگان
- **Documents**: مدارک شرکت‌ها
- **Projects**: پروژه‌های قبلی
- **Tenders**: مناقصات
- **TenderCategories**: دسته‌بندی‌های مناقصه
- **TenderRequirements**: نیازمندی‌های مناقصه
- **TenderParticipations**: شرکت در مناقصه
- **PriceInquiries**: استعلام‌های قیمت
- **PriceInquiryResponses**: پاسخ به استعلام
- **Freelancers**: فریلنسرها
- **Likes**: لایک‌های مناقصات
- **Saves**: ذخیره‌های مناقصات
- **Comments**: کامنت‌های مناقصات
- **Reviews**: نظرات و امتیازدهی
- **Notifications**: اعلان‌ها

## استفاده در کد

برای استفاده از Prisma در کد:

```typescript
import { prisma } from "@/lib/prisma";

// مثال: دریافت تمام مناقصات
const tenders = await prisma.tender.findMany({
  include: {
    categories: true,
    likes: true,
  },
});
```

## عیب‌یابی

### خطای اتصال به دیتابیس

1. مطمئن شوید SQL Server در حال اجرا است
2. پورت 1433 باز است
3. نام دیتابیس و کاربر صحیح است
4. رمز عبور صحیح است
5. `trustServerCertificate=true` در connection string وجود دارد

### خطای دسترسی

اگر خطای دسترسی دریافت کردید، مطمئن شوید کاربر `ai_user` دسترسی `db_owner` دارد.
