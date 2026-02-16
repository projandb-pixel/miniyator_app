-- اسکریپت بازگردانی دیتابیس از فایل بک‌آپ
USE master;
GO

-- ابتدا دیتابیس را ایجاد کنید اگر وجود ندارد
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'miniyator')
BEGIN
    CREATE DATABASE miniyator;
    PRINT 'Database created.';
END
GO

-- بستن اتصالات فعال به دیتابیس
ALTER DATABASE miniyator SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- بازگردانی دیتابیس
RESTORE DATABASE miniyator
FROM DISK = 'miniyator.bak'
WITH REPLACE;
GO

-- بازگشت دیتابیس به حالت چند کاربره
ALTER DATABASE miniyator SET MULTI_USER;
GO

PRINT 'Database restored successfully!';
GO