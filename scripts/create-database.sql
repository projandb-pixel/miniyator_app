-- اسکریپت ایجاد دیتابیس وین تندر
-- این فایل برای ایجاد دیتابیس و کاربر در SQL Server استفاده می‌شود

-- ایجاد دیتابیس (اگر وجود ندارد)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'miniyator')
BEGIN
    CREATE DATABASE miniyator;
    PRINT 'Database miniyator created successfully.';
END
ELSE
BEGIN
    PRINT 'Database miniyator already exists.';
END
GO

-- استفاده از دیتابیس
USE miniyator;
GO

-- ایجاد Login (اگر وجود ندارد)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'ai_user')
BEGIN
    CREATE LOGIN ai_user WITH PASSWORD = 'A@1234567';
    PRINT 'Login ai_user created successfully.';
END
ELSE
BEGIN
    PRINT 'Login ai_user already exists.';
END
GO

-- ایجاد User در دیتابیس (اگر وجود ندارد)
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ai_user')
BEGIN
    CREATE USER ai_user FOR LOGIN ai_user;
    PRINT 'User ai_user created in database.';
END
ELSE
BEGIN
    PRINT 'User ai_user already exists in database.';
END
GO

-- دادن دسترسی کامل به کاربر
ALTER ROLE db_owner ADD MEMBER ai_user;
PRINT 'Permissions granted to ai_user.';
GO

PRINT 'Database setup completed successfully!';
GO





