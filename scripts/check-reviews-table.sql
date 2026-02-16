-- بررسی وجود جدول Reviews و ستون‌های آن
USE miniyator;
GO

-- بررسی وجود جدول
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
BEGIN
    PRINT 'جدول Reviews وجود دارد.';
    
    -- نمایش ستون‌های جدول
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Reviews'
    ORDER BY ORDINAL_POSITION;
    
    -- نمایش تعداد رکوردها
    SELECT COUNT(*) AS TotalReviews FROM Reviews;
END
ELSE
BEGIN
    PRINT 'جدول Reviews وجود ندارد!';
END
GO





