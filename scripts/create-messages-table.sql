-- ایجاد جدول Messages برای سیستم پیام‌رسانی
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Messages] (
        [id] NVARCHAR(450) NOT NULL PRIMARY KEY,
        [senderCompanyId] NVARCHAR(450) NOT NULL,
        [receiverCompanyId] NVARCHAR(450) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [read] BIT NOT NULL DEFAULT 0,
        [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    -- ایجاد ایندکس برای بهبود عملکرد
    CREATE INDEX [IX_Messages_SenderCompanyId] ON [dbo].[Messages]([senderCompanyId]);
    CREATE INDEX [IX_Messages_ReceiverCompanyId] ON [dbo].[Messages]([receiverCompanyId]);
    CREATE INDEX [IX_Messages_CreatedAt] ON [dbo].[Messages]([createdAt]);

    -- اضافه کردن Foreign Key اگر جدول Companies وجود داشته باشد
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND type in (N'U'))
    BEGIN
        ALTER TABLE [dbo].[Messages]
        ADD CONSTRAINT [FK_Messages_SenderCompany] FOREIGN KEY ([senderCompanyId]) REFERENCES [dbo].[Companies]([id]) ON DELETE CASCADE;
        
        ALTER TABLE [dbo].[Messages]
        ADD CONSTRAINT [FK_Messages_ReceiverCompany] FOREIGN KEY ([receiverCompanyId]) REFERENCES [dbo].[Companies]([id]) ON DELETE CASCADE;
        
        PRINT 'Foreign keys added to Messages table.';
    END
    ELSE
    BEGIN
        PRINT 'Warning: Companies table does not exist. Foreign keys not added.';
    END

    PRINT 'Table Messages created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Messages already exists.';
    
    -- اگر جدول وجود دارد اما foreign key ندارد، اضافه می‌کنیم
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Companies]') AND type in (N'U'))
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Messages_SenderCompany')
        BEGIN
            ALTER TABLE [dbo].[Messages]
            ADD CONSTRAINT [FK_Messages_SenderCompany] FOREIGN KEY ([senderCompanyId]) REFERENCES [dbo].[Companies]([id]) ON DELETE CASCADE;
        END
        
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Messages_ReceiverCompany')
        BEGIN
            ALTER TABLE [dbo].[Messages]
            ADD CONSTRAINT [FK_Messages_ReceiverCompany] FOREIGN KEY ([receiverCompanyId]) REFERENCES [dbo].[Companies]([id]) ON DELETE CASCADE;
        END
    END
END
GO


