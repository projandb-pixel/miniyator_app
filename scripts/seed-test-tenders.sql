USE miniyator; -- نام دیتابیس شما
GO

-- ***************************************************************
-- اسکریپت ایجاد مناقصات تستی به صورت مستقیم در SQL Server
-- ***************************************************************
-- این اسکریپت را می‌توانید با ابزارهایی مانند sqlcmd، Azure Data Studio، 
-- یا SQL Server Management Studio (SSMS) اجرا کنید.

-- نحوه اجرا با sqlcmd در لینوکس:
-- sqlcmd -S localhost -U ai_user -P "A@1234567" -d miniyator -i scripts/seed-test-tenders.sql
-- (مقادیر -S, -U, -P, -d را مطابق با تنظیمات دیتابیس خود تغییر دهید)

-- ***************************************************************

DECLARE @tenderId1 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenderId2 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenderId3 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenderId4 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenderId5 UNIQUEIDENTIFIER = NEWID();
DECLARE @tenderId6 UNIQUEIDENTIFIER = NEWID();

DECLARE @now DATETIME = GETDATE();

PRINT N'شروع ایجاد مناقصات تستی...';

-- مناقصه ۱: پروژه نصب و راه‌اندازی سیستم برق و ابزار دقیق
INSERT INTO Tenders (
    id, company, title, description, tenderNumber, tenderType,
    publishDate, deadline, documentDeliveryDeadline, deliveryLocation,
    status, phase, estimatedMin, estimatedMax, createdAt, updatedAt
)
VALUES (
    @tenderId1, N'پتروشیمی بندرامام', N'پروژه نصب و راه‌اندازی سیستم برق و ابزار دقیق',
    N'پروژه کامل نصب و راه‌اندازی سیستم برق و ابزار دقیق واحد جدید. ارائه پیشنهاد فنی و مالی.',
    N'1403-' + FORMAT(@now, 'MM-dd') + N'-001', N'EPC',
    @now, DATEADD(day, 14, @now), DATEADD(day, 7, @now), N'دفتر مرکزی - ماهشهر',
    N'active', N'receive_documents', 38000000000, 54000000000, @now, @now
);

INSERT INTO TenderCategories (id, tenderId, category, createdAt)
VALUES 
    (NEWID(), @tenderId1, N'برق', @now),
    (NEWID(), @tenderId1, N'ابزار دقیق', @now),
    (NEWID(), @tenderId1, N'نصب', @now);

INSERT INTO TenderRequirements (id, tenderId, category, item, quantity, description, createdAt)
VALUES
    (NEWID(), @tenderId1, N'برق', N'کابل، ترمینال، تابلو', NULL, N'تجهیزات برق مطابق نقشه', @now),
    (NEWID(), @tenderId1, N'ابزار دقیق', N'ترانسمیتر، سنسور', NULL, N'تجهیزات ابزار دقیق مطابق نقشه', @now);

PRINT N'✅ مناقصه 1 ایجاد شد: ' + N'1403-' + FORMAT(@now, 'MM-dd') + N'-001';

-- مناقصه ۲: تأمین و نصب تجهیزات مکانیکی
INSERT INTO Tenders (
    id, company, title, description, tenderNumber, tenderType,
    publishDate, deadline, documentDeliveryDeadline, deliveryLocation,
    status, phase, estimatedMin, estimatedMax, createdAt, updatedAt
)
VALUES (
    @tenderId2, N'پتروشیمی اروند', N'تأمین و نصب تجهیزات مکانیکی',
    N'تأمین و نصب تجهیزات مکانیکی استاتیک برای واحد بهره‌برداری.',
    N'1403-' + FORMAT(@now, 'MM-dd') + N'-002', N'EPC',
    @now, DATEADD(day, 21, @now), DATEADD(day, 10, @now), N'مجتمع - منطقه ویژه اروند',
    N'active', N'receive_documents', 125000000000, 180000000000, @now, @now
);

INSERT INTO TenderCategories (id, tenderId, category, createdAt)
VALUES 
    (NEWID(), @tenderId2, N'مکانیک', @now),
    (NEWID(), @tenderId2, N'استاتیک', @now),
    (NEWID(), @tenderId2, N'EPC', @now);

INSERT INTO TenderRequirements (id, tenderId, category, item, quantity, description, createdAt)
VALUES
    (NEWID(), @tenderId2, N'مکانیک', N'پمپ سانتریفیوژ', 6, N'نوع پمپ مطابق نقشه', @now),
    (NEWID(), @tenderId2, N'مکانیک', N'کمپرسور', 2, N'مطابق مشخصات فنی', @now);

PRINT N'✅ مناقصه 2 ایجاد شد: ' + N'1403-' + FORMAT(@now, 'MM-dd') + N'-002';

-- مناقصه ۳: استعلام قیمت لوله و اتصالات فولادی
INSERT INTO Tenders (
    id, company, title, description, tenderNumber, tenderType,
    publishDate, deadline, documentDeliveryDeadline, deliveryLocation,
    status, phase, estimatedMin, estimatedMax, createdAt, updatedAt
)
VALUES (
    @tenderId3, N'پتروشیمی پارس', N'استعلام قیمت لوله و اتصالات فولادی',
    N'تأمین لوله و اتصالات فولادی مطابق استاندارد برای پروژه توسعه.',
    N'1403-' + FORMAT(@now, 'MM-dd') + N'-003', N'تأمین کالا',
    @now, DATEADD(day, 10, @now), DATEADD(day, 5, @now), N'عسلویه - انبار مرکزی',
    N'active', N'receive_documents', 12000000000, 18000000000, @now, @now
);

INSERT INTO TenderCategories (id, tenderId, category, createdAt)
VALUES 
    (NEWID(), @tenderId3, N'لوله و اتصالات', @now),
    (NEWID(), @tenderId3, N'فولاد', @now),
    (NEWID(), @tenderId3, N'تأمین کالا', @now);

INSERT INTO TenderRequirements (id, tenderId, category, item, quantity, description, createdAt)
VALUES
    (NEWID(), @tenderId3, N'لوله', N'لوله فولادی بدون درز', 500, N'قطر و ضخامت مطابق لیست', @now),
    (NEWID(), @tenderId3, N'اتصالات', N'زانو، سه‌راه، فلنج', NULL, N'مطابق نقشه و لیست', @now);

PRINT N'✅ مناقصه 3 ایجاد شد: ' + N'1403-' + FORMAT(@now, 'MM-dd') + N'-003';

-- مناقصه ۴: بازسازی و تعمیرات واحد HSE
INSERT INTO Tenders (
    id, company, title, description, tenderNumber, tenderType,
    publishDate, deadline, documentDeliveryDeadline, deliveryLocation,
    status, phase, estimatedMin, estimatedMax, createdAt, updatedAt
)
VALUES (
    @tenderId4, N'پالایشگاه نفت آبادان', N'بازسازی و تعمیرات واحد HSE',
    N'بازسازی ساختمان و تعمیرات تأسیسات واحد HSE و آتش‌نشانی.',
    N'1403-' + FORMAT(@now, 'MM-dd') + N'-004', N'ساختمانی',
    @now, DATEADD(day, 18, @now), DATEADD(day, 8, @now), N'آبادان - سایت پالایشگاه',
    N'active', N'receive_documents', 8000000000, 12000000000, @now, @now
);

INSERT INTO TenderCategories (id, tenderId, category, createdAt)
VALUES 
    (NEWID(), @tenderId4, N'ساختمانی', @now),
    (NEWID(), @tenderId4, N'HSE', @now),
    (NEWID(), @tenderId4, N'تعمیرات', @now);

INSERT INTO TenderRequirements (id, tenderId, category, item, quantity, description, createdAt)
VALUES
    (NEWID(), @tenderId4, N'ساختمانی', N'بازسازی سازه و نما', NULL, N'مطابق نقشه', @now),
    (NEWID(), @tenderId4, N'HSE', N'سیستم اعلام حریق و اطفا', 1, N'مطابق استاندارد', @now);

PRINT N'✅ مناقصه 4 ایجاد شد: ' + N'1403-' + FORMAT(@now, 'MM-dd') + N'-004';

-- مناقصه ۵: تأمین قطعات یدکی ماشین‌آلات حفاری
INSERT INTO Tenders (
    id, company, title, description, tenderNumber, tenderType,
    publishDate, deadline, documentDeliveryDeadline, deliveryLocation,
    status, phase, estimatedMin, estimatedMax, createdAt, updatedAt
)
VALUES (
    @tenderId5, N'شرکت ملی حفاری ایران', N'تأمین قطعات یدکی ماشین‌آلات حفاری',
    N'استعلام قیمت و تأمین قطعات یدکی اصلی برای ماشین‌آلات حفاری.',
    N'1403-' + FORMAT(@now, 'MM-dd') + N'-005', N'تأمین کالا',
    @now, DATEADD(day, 12, @now), NULL, N'تهران - انبار مرکزی',
    N'active', N'receive_documents', 5000000000, 9000000000, @now, @now
);

INSERT INTO TenderCategories (id, tenderId, category, createdAt)
VALUES 
    (NEWID(), @tenderId5, N'قطعات یدکی', @now),
    (NEWID(), @tenderId5, N'حفاری', @now),
    (NEWID(), @tenderId5, N'تأمین کالا', @now);

INSERT INTO TenderRequirements (id, tenderId, category, item, quantity, description, createdAt)
VALUES
    (NEWID(), @tenderId5, N'قطعات یدکی', N'قطعات اصلی ماشین حفاری', NULL, N'مطابق کد کاتالوگ', @now);

PRINT N'✅ مناقصه 5 ایجاد شد: ' + N'1403-' + FORMAT(@now, 'MM-dd') + N'-005';

-- مناقصه ۶: پروژه رنگ‌آمیزی و پوشش خط لوله
INSERT INTO Tenders (
    id, company, title, description, tenderNumber, tenderType,
    publishDate, deadline, documentDeliveryDeadline, deliveryLocation,
    status, phase, estimatedMin, estimatedMax, createdAt, updatedAt
)
VALUES (
    @tenderId6, N'شرکت پتروایمکو', N'پروژه رنگ‌آمیزی و پوشش خط لوله',
    N'رنگ‌آمیزی و پوشش ضد خوردگی خطوط لوله در محدوده سایت.',
    N'1403-' + FORMAT(@now, 'MM-dd') + N'-006', N'پیمانکاری',
    @now, DATEADD(day, 15, @now), DATEADD(day, 6, @now), N'اهواز - سایت پروژه',
    N'active', N'receive_documents', 3500000000, 5500000000, @now, @now
);

INSERT INTO TenderCategories (id, tenderId, category, createdAt)
VALUES 
    (NEWID(), @tenderId6, N'رنگ و پوشش', @now),
    (NEWID(), @tenderId6, N'ضد خوردگی', @now),
    (NEWID(), @tenderId6, N'پیمانکاری', @now);

INSERT INTO TenderRequirements (id, tenderId, category, item, quantity, description, createdAt)
VALUES
    (NEWID(), @tenderId6, N'پوشش', N'رنگ اپوکسی و پوشش سه لایه', NULL, N'مطابق مشخصات فنی', @now);

PRINT N'\n✅ در مجموع 6 مناقصه تستی با موفقیت ایجاد شد.';
