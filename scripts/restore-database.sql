-- اسکریپت بازگردانی دیتابیس از فایل بک‌آپ
USE master;
GO

-- بستن اتصالات فعال به دیتابیس
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'miniyator')
BEGIN
    ALTER DATABASE miniyator SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    PRINT 'Database connections closed.';
END
GO

-- بازگردانی دیتابیس
RESTORE DATABASE miniyator
FROM DISK = 'C:\Backup\miniyator.bak'
WITH REPLACE;
GO

-- بازگشت دیتابیس به حالت چند کاربره
ALTER DATABASE miniyator SET MULTI_USER;
GO

PRINT 'Database restored successfully!';
GO

