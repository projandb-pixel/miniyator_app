/**
 * تست ایجاد پست خودکار از مناقصه
 * این اسکریپت یک پست تستی ایجاد می‌کند و بررسی می‌کند که آیا درست ذخیره می‌شود
 */

import { prisma } from '../lib/prisma';
import { base64ToBuffer, bufferToBase64 } from '../lib/file-utils';

// یک تصویر تستی کوچک (1x1 pixel PNG) به صورت base64
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testAutoShare() {
  try {
    console.log('🧪 شروع تست ایجاد پست خودکار...\n');

    // 1. پیدا کردن یک کاربر و شرکت برای تست
    const user = await prisma.users.findFirst({
      include: { Companies: true },
    });

    if (!user || !user.Companies) {
      console.error('❌ هیچ کاربر یا شرکتی یافت نشد. لطفاً ابتدا داده‌های تستی ایجاد کنید.');
      return;
    }

    console.log(`✅ کاربر پیدا شد: ${user.id}`);
    console.log(`✅ شرکت پیدا شد: ${user.Companies.id} - ${user.Companies.name}\n`);

    // 2. پیدا کردن یک مناقصه برای تست
    const tender = await prisma.tenders.findFirst();
    if (!tender) {
      console.error('❌ هیچ مناقصه‌ای یافت نشد.');
      return;
    }

    console.log(`✅ مناقصه پیدا شد: ${tender.id} - ${tender.title}\n`);

    // 3. ساخت محتوای پست
    const postContent = `مناقصه: ${tender.title}\n\nشرکت ${tender.company} درخواست ${tender.title} دارد.\n\n`;
    console.log(`✅ محتوای پست ساخته شد:\n${postContent}\n`);

    // 4. تبدیل تصویر به Buffer
    let imageData: Buffer | null = null;
    try {
      const base64Data = testImageBase64.split(',')[1];
      if (base64Data) {
        imageData = base64ToBuffer(base64Data);
        console.log(`✅ تصویر به Buffer تبدیل شد: ${imageData.length} bytes\n`);
      }
    } catch (error) {
      console.error('❌ خطا در تبدیل تصویر:', error);
    }

    // 5. ایجاد پست
    const postId = crypto.randomUUID();
    const now = new Date();

    const postData: any = {
      id: postId,
      companyId: user.Companies.id,
      content: postContent,
      imageData,
      tenderId: tender.id,
      likes: 0,
      comments: 0,
      views: 0,
      updatedAt: now,
    };

    console.log('📝 در حال ایجاد پست...');
    console.log('Post data:', {
      id: postData.id,
      companyId: postData.companyId,
      content: postData.content.substring(0, 50) + '...',
      hasImageData: !!postData.imageData,
      tenderId: postData.tenderId,
    });

    // استفاده از raw query برای ذخیره پست (مشابه استوری)
    if (imageData) {
      const imageDataHex = '0x' + imageData.toString('hex').toUpperCase();
      const escapedContent = postContent.replaceAll("'", "''");
      const contentSql = escapedContent ? `N'${escapedContent}'` : 'NULL';
      const imageDataSql = `CONVERT(varbinary(max), ${imageDataHex})`;

      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO Posts (id, companyId, content, imageData, tenderId, likes, comments, views, createdAt, updatedAt)
         VALUES (N'${postId}', N'${user.Companies.id}', ${contentSql}, ${imageDataSql}, N'${tender.id}', 0, 0, 0, '${now.toISOString()}', '${now.toISOString()}')`
      );
    } else {
      const escapedContent = postContent.replaceAll("'", "''");
      const contentSql = escapedContent ? `N'${escapedContent}'` : 'NULL';

      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO Posts (id, companyId, content, tenderId, likes, comments, views, createdAt, updatedAt)
         VALUES (N'${postId}', N'${user.Companies.id}', ${contentSql}, N'${tender.id}', 0, 0, 0, '${now.toISOString()}', '${now.toISOString()}')`
      );
    }

    console.log('✅ پست با موفقیت ایجاد شد\n');

    // 6. دریافت پست ایجاد شده
    const createdPost = await prisma.posts.findUnique({
      where: { id: postId },
      include: {
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (createdPost) {
      console.log('✅ پست ایجاد شده:');
      console.log('  - ID:', createdPost.id);
      console.log('  - Company:', createdPost.Companies?.name);
      console.log('  - Content:', createdPost.content?.substring(0, 50) + '...');
      console.log('  - Tender ID:', (createdPost as any).tenderId);
      console.log('  - Has Image:', !!createdPost.imageData);
      
      if (createdPost.imageData) {
        const imageUrl = bufferToBase64(createdPost.imageData instanceof Buffer ? createdPost.imageData : Buffer.from(createdPost.imageData as any));
        if (imageUrl) {
          console.log('  - Image URL length:', imageUrl.length);
        } else {
          console.log('  - Image URL: Failed to convert');
        }
      }
    } else {
      console.error('❌ پست ایجاد شده یافت نشد!');
    }

    console.log('\n✅ تست با موفقیت انجام شد!');
  } catch (error) {
    console.error('❌ خطا در تست:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAutoShare();

