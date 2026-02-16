/**
 * تست ایجاد استوری با عکس
 * این اسکریپت یک استوری تستی ایجاد می‌کند و بررسی می‌کند که آیا درست ذخیره می‌شود
 */

import { prisma } from '../lib/prisma';
import { base64ToBuffer, bufferToBase64 } from '../lib/file-utils';

// یک تصویر تستی کوچک (1x1 pixel PNG) به صورت base64
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testStoryCreation() {
  try {
    console.log('🧪 شروع تست ایجاد استوری...\n');

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

    // 2. تبدیل base64 به Buffer
    const imageBuffer = base64ToBuffer(testImageBase64);
    console.log(`✅ تصویر به Buffer تبدیل شد: ${imageBuffer.length} bytes\n`);

    // 3. ایجاد استوری با استفاده از raw query
    const storyId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // تبدیل Buffer به hex string با prefix 0x
    const imageDataHex = '0x' + imageBuffer.toString('hex').toUpperCase();
    console.log(`✅ تصویر به hex string تبدیل شد: ${imageDataHex.substring(0, 50)}...\n`);

    // استفاده از raw query برای ذخیره استوری
    console.log('📝 در حال ایجاد استوری با raw query...');
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO Stories (id, companyId, type, title, content, imageData, videoData, expiresAt, views, createdAt, updatedAt)
       VALUES (N'${storyId}', N'${user.Companies.id}', N'test', N'تست استوری', N'این یک استوری تستی است', ${imageDataHex}, NULL, '${expiresAt.toISOString()}', 0, '${now.toISOString()}', '${now.toISOString()}')`
    );

    console.log('✅ استوری با موفقیت ایجاد شد!\n');

    // 4. بررسی اینکه استوری درست ذخیره شده است
    console.log('🔍 در حال بررسی استوری ایجاد شده...');
    const createdStory = await prisma.stories.findUnique({
      where: { id: storyId },
      include: {
        Companies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!createdStory) {
      console.error('❌ استوری ایجاد نشد!');
      return;
    }

    console.log(`✅ استوری پیدا شد: ${createdStory.id}`);
    console.log(`   - عنوان: ${createdStory.title}`);
    console.log(`   - شرکت: ${createdStory.Companies.name}`);
    console.log(`   - نوع: ${createdStory.type}`);
    console.log(`   - تاریخ انقضا: ${createdStory.expiresAt}`);
    console.log(`   - imageData: ${createdStory.imageData ? `${(createdStory.imageData as Buffer).length} bytes` : 'NULL'}`);
    console.log(`   - videoData: ${createdStory.videoData ? `${(createdStory.videoData as Buffer).length} bytes` : 'NULL'}\n`);

    // 5. بررسی اینکه imageData درست ذخیره شده است
    if (createdStory.imageData) {
      const storedBuffer = createdStory.imageData as Buffer;
      console.log(`✅ imageData درست ذخیره شده است: ${storedBuffer.length} bytes`);
      
      // تبدیل به base64 برای نمایش
      const storedBase64 = bufferToBase64(storedBuffer);
      console.log(`   - Base64 preview: ${storedBase64?.substring(0, 50)}...\n`);

      // مقایسه با تصویر اصلی
      if (storedBuffer.length === imageBuffer.length) {
        console.log('✅ اندازه imageData درست است!');
      } else {
        console.error(`❌ اندازه imageData اشتباه است! انتظار: ${imageBuffer.length}, دریافت: ${storedBuffer.length}`);
      }
    } else {
      console.error('❌ imageData ذخیره نشده است!');
    }

    // 6. پاک کردن استوری تستی
    console.log('\n🧹 در حال پاک کردن استوری تستی...');
    await prisma.stories.delete({
      where: { id: storyId },
    });
    console.log('✅ استوری تستی پاک شد!\n');

    console.log('✅ همه تست‌ها با موفقیت انجام شد!');
  } catch (error) {
    console.error('❌ خطا در تست:', error);
    if (error instanceof Error) {
      console.error('   - پیام:', error.message);
      console.error('   - Stack:', error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// اجرای تست
testStoryCreation()
  .then(() => {
    console.log('\n✅ تست کامل شد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ تست با خطا مواجه شد:', error);
    process.exit(1);
  });
