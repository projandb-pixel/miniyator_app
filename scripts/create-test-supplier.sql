-- ایجاد یک تأمین‌کننده تستی
-- ابتدا یک کاربر تأمین‌کننده ایجاد می‌کنیم

-- 1. ایجاد کاربر
DECLARE @userId UNIQUEIDENTIFIER = NEWID();
DECLARE @companyId UNIQUEIDENTIFIER = NEWID();

INSERT INTO [User] (id, phone, role, isVerified, createdAt, updatedAt)
VALUES (@userId, '09123456789', 'supplier', 1, GETDATE(), GETDATE());

-- 2. ایجاد شرکت تأمین‌کننده
INSERT INTO [Company] (
    id, 
    userId, 
    name, 
    companyType, 
    city, 
    province, 
    address, 
    officePhone, 
    email, 
    website, 
    bio, 
    isVerified, 
    createdAt, 
    updatedAt
)
VALUES (
    @companyId,
    @userId,
    N'تأمین‌کننده تستی',
    N'تولیدی',
    N'تهران',
    N'تهران',
    N'تهران، خیابان ولیعصر',
    '02112345678',
    'test@supplier.com',
    'https://test-supplier.com',
    N'این یک تأمین‌کننده تستی است برای بررسی عملکرد سیستم',
    1,
    GETDATE(),
    GETDATE()
);

-- 3. اضافه کردن دسته‌بندی
INSERT INTO [CompanyCategory] (id, companyId, category, createdAt, updatedAt)
VALUES 
    (NEWID(), @companyId, N'مکانیک (استاتیک)', GETDATE(), GETDATE()),
    (NEWID(), @companyId, N'برق و ابزاردقیق', GETDATE(), GETDATE());

-- 4. اضافه کردن یک محصول تستی
INSERT INTO [Product] (
    id,
    companyId,
    name,
    category,
    brand,
    price,
    description,
    createdAt,
    updatedAt
)
VALUES (
    NEWID(),
    @companyId,
    N'محصول تستی 1',
    N'مکانیک (استاتیک)',
    N'برند تست',
    N'1000000 تومان',
    N'این یک محصول تستی است',
    GETDATE(),
    GETDATE()
);

-- نمایش اطلاعات ایجاد شده
SELECT 
    u.id AS UserId,
    u.phone,
    u.role,
    c.id AS CompanyId,
    c.name AS CompanyName,
    c.city,
    c.province
FROM [User] u
INNER JOIN [Company] c ON c.userId = u.id
WHERE u.id = @userId;

PRINT N'تأمین‌کننده تستی با موفقیت ایجاد شد!';
PRINT N'User ID: ' + CAST(@userId AS NVARCHAR(36));
PRINT N'Company ID: ' + CAST(@companyId AS NVARCHAR(36));





