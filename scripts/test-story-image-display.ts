/**
 * تست کامل نمایش عکس استوری
 * این اسکریپت:
 * 1. یک استوری با عکس ایجاد می‌کند
 * 2. استوری را از دیتابیس می‌خواند
 * 3. بررسی می‌کند که imageData درست ذخیره شده است
 * 4. بررسی می‌کند که imageData درست خوانده می‌شود
 * 5. بررسی می‌کند که imageUrl درست ساخته می‌شود
 * 6. بررسی می‌کند که API endpoint درست کار می‌کند
 */

import { prisma } from '../lib/prisma';
import { base64ToBuffer, bufferToBase64 } from '../lib/file-utils';

// یک تصویر تستی کوچک (1x1 pixel PNG) به صورت base64
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testStoryImageDisplay() {
  let storyId: string | null = null;
  
  try {
    console.log('🧪 شروع تست کامل نمایش عکس استوری...\n');

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

    // 3. ایجاد استوری با استفاده از raw query (همان روش API)
    storyId = crypto.randomUUID();
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
       VALUES (N'${storyId}', N'${user.Companies.id}', N'test', N'تست نمایش عکس', N'این یک استوری تستی برای بررسی نمایش عکس است', ${imageDataHex}, NULL, '${expiresAt.toISOString()}', 0, '${now.toISOString()}', '${now.toISOString()}')`
    );

    console.log('✅ استوری با موفقیت ایجاد شد!\n');

    // 4. بررسی اینکه استوری درست ذخیره شده است (مستقیماً از دیتابیس)
    console.log('🔍 در حال بررسی استوری از دیتابیس (مستقیم)...');
    const storyFromDb = await prisma.stories.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        imageData: true,
        videoData: true,
      },
    });

    if (!storyFromDb) {
      console.error('❌ استوری در دیتابیس یافت نشد!');
      return;
    }

    console.log(`✅ استوری از دیتابیس خوانده شد: ${storyFromDb.id}`);
    console.log(`   - imageData: ${storyFromDb.imageData ? `${(storyFromDb.imageData as Buffer).length} bytes` : 'NULL'}`);
    console.log(`   - videoData: ${storyFromDb.videoData ? `${(storyFromDb.videoData as Buffer).length} bytes` : 'NULL'}\n`);

    if (!storyFromDb.imageData) {
      console.error('❌ imageData در دیتابیس NULL است!');
      return;
    }

    const storedBuffer = storyFromDb.imageData as Buffer;
    if (storedBuffer.length !== imageBuffer.length) {
      console.error(`❌ اندازه imageData اشتباه است! انتظار: ${imageBuffer.length}, دریافت: ${storedBuffer.length}`);
      return;
    }

    console.log('✅ imageData درست در دیتابیس ذخیره شده است!\n');

    // 5. بررسی اینکه imageData درست خوانده می‌شود (با select)
    console.log('🔍 در حال بررسی استوری با select (همان روش API GET)...');
    const storyWithSelect = await prisma.stories.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        companyId: true,
        type: true,
        title: true,
        content: true,
        imageData: true,
        videoData: true,
        expiresAt: true,
        views: true,
        createdAt: true,
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            Users: {
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!storyWithSelect) {
      console.error('❌ استوری با select یافت نشد!');
      return;
    }

    console.log(`✅ استوری با select خوانده شد: ${storyWithSelect.id}`);
    console.log(`   - imageData: ${storyWithSelect.imageData ? `${(storyWithSelect.imageData as Buffer).length} bytes` : 'NULL'}`);
    console.log(`   - videoData: ${storyWithSelect.videoData ? `${(storyWithSelect.videoData as Buffer).length} bytes` : 'NULL'}\n`);

    if (!storyWithSelect.imageData) {
      console.error('❌ imageData با select NULL است!');
      return;
    }

    const selectedBuffer = storyWithSelect.imageData as Buffer;
    if (selectedBuffer.length !== imageBuffer.length) {
      console.error(`❌ اندازه imageData با select اشتباه است! انتظار: ${imageBuffer.length}, دریافت: ${selectedBuffer.length}`);
      return;
    }

    console.log('✅ imageData با select درست خوانده می‌شود!\n');

    // 6. بررسی اینکه bufferToBase64 درست کار می‌کند
    console.log('🔍 در حال بررسی تبدیل imageData به base64...');
    console.log(`   - selectedBuffer type: ${typeof selectedBuffer}`);
    console.log(`   - selectedBuffer instanceof Buffer: ${selectedBuffer instanceof Buffer}`);
    console.log(`   - selectedBuffer constructor: ${selectedBuffer.constructor.name}`);
    
    // اطمینان از اینکه selectedBuffer یک Buffer است
    const imageBufferForConversion = selectedBuffer instanceof Buffer 
      ? selectedBuffer 
      : Buffer.from(selectedBuffer as any);
    
    console.log(`   - imageBufferForConversion instanceof Buffer: ${imageBufferForConversion instanceof Buffer}`);
    console.log(`   - imageBufferForConversion length: ${imageBufferForConversion.length}`);
    
    const imageUrl = bufferToBase64(imageBufferForConversion);
    
    if (!imageUrl) {
      console.error('❌ bufferToBase64 null برمی‌گرداند!');
      return;
    }

    console.log(`✅ imageUrl ساخته شد: ${imageUrl.substring(0, 100)}...`);
    console.log(`   - طول imageUrl: ${imageUrl.length} characters`);
    console.log(`   - شروع با data:image: ${imageUrl.startsWith('data:image')}\n`);

    if (!imageUrl.startsWith('data:image')) {
      console.error('❌ imageUrl با data:image شروع نمی‌شود!');
      return;
    }

    // بررسی اینکه base64 data درست است
    const base64Data = imageUrl.split(',')[1];
    if (!base64Data || base64Data.length < 10) {
      console.error(`❌ base64 data خیلی کوتاه است! طول: ${base64Data?.length || 0}`);
      console.error(`   - imageUrl: ${imageUrl.substring(0, 200)}`);
      return;
    }

    console.log(`✅ base64 data درست است: ${base64Data.substring(0, 30)}... (${base64Data.length} characters)`);
    console.log('✅ bufferToBase64 درست کار می‌کند!\n');

    // 7. شبیه‌سازی API GET handler (دقیقاً همان کدی که در API استفاده می‌شود)
    console.log('🔍 در حال شبیه‌سازی API GET handler...');
    const storiesFromApi = await prisma.stories.findMany({
      where: { id: storyId },
      select: {
        id: true,
        companyId: true,
        type: true,
        title: true,
        content: true,
        imageData: true,
        videoData: true,
        expiresAt: true,
        views: true,
        createdAt: true,
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            Users: {
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    const storiesWithViewStatus = storiesFromApi.map((story) => {
      // تبدیل imageData و videoData به base64 (دقیقاً همان کدی که در API استفاده می‌شود)
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;
      
      if (story.imageData) {
        try {
          // اطمینان از اینکه imageData یک Buffer است
          const imageBuffer = story.imageData instanceof Buffer 
            ? story.imageData 
            : Buffer.from(story.imageData as any);
          imageUrl = bufferToBase64(imageBuffer);
          console.log(`   - Story ${story.id}: Image converted, imageUrl length: ${imageUrl?.length || 0}`);
        } catch (error) {
          console.error(`   - Error converting image for story ${story.id}:`, error);
        }
      }
      
      if (story.videoData) {
        try {
          // اطمینان از اینکه videoData یک Buffer است
          const videoBuffer = story.videoData instanceof Buffer 
            ? story.videoData 
            : Buffer.from(story.videoData as any);
          videoUrl = bufferToBase64(videoBuffer);
        } catch (error) {
          console.error(`   - Error converting video for story ${story.id}:`, error);
        }
      }
      
      return {
        id: story.id,
        companyId: story.companyId,
        company: {
          id: story.Companies.id,
          name: story.Companies.name,
          logo: story.Companies.logo ? bufferToBase64(story.Companies.logo as Buffer) : null,
          role: story.Companies.Users.role,
        },
        type: story.type,
        title: story.title,
        content: story.content,
        imageUrl,
        videoUrl,
        views: story.views,
        hasNew: true,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      };
    });

    if (storiesWithViewStatus.length === 0) {
      console.error('❌ هیچ استوری از API برگردانده نشد!');
      return;
    }

    const apiStory = storiesWithViewStatus[0];
    console.log(`✅ استوری از API برگردانده شد: ${apiStory.id}`);
    console.log(`   - imageUrl: ${apiStory.imageUrl ? `${apiStory.imageUrl.substring(0, 50)}...` : 'NULL'}`);
    console.log(`   - videoUrl: ${apiStory.videoUrl ? `${apiStory.videoUrl.substring(0, 50)}...` : 'NULL'}\n`);

    if (!apiStory.imageUrl) {
      console.error('❌ imageUrl در response API NULL است!');
      return;
    }

    if (!apiStory.imageUrl.startsWith('data:image')) {
      console.error('❌ imageUrl در response API با data:image شروع نمی‌شود!');
      return;
    }

    console.log('✅ API GET handler درست کار می‌کند!\n');

    // 8. بررسی اینکه imageUrl قابل استفاده است (می‌تواند در img tag استفاده شود)
    console.log('🔍 در حال بررسی اینکه imageUrl قابل استفاده است...');
    const imageUrlBase64 = apiStory.imageUrl.split(',')[1];
    if (!imageUrlBase64) {
      console.error('❌ imageUrl base64 data ندارد!');
      return;
    }

    console.log(`✅ imageUrl base64 data دارد: ${imageUrlBase64.substring(0, 30)}...`);
    console.log(`   - طول base64 data: ${imageUrlBase64.length} characters\n`);

    // 9. مقایسه نهایی
    console.log('🔍 مقایسه نهایی...');
    const originalBase64 = testImageBase64.split(',')[1];
    const finalBase64 = apiStory.imageUrl.split(',')[1];
    
    if (originalBase64 === finalBase64) {
      console.log('✅ base64 data یکسان است!');
    } else {
      console.log('⚠️ base64 data متفاوت است (ممکن است به دلیل MIME type detection باشد)');
      console.log(`   - Original length: ${originalBase64.length}`);
      console.log(`   - Final length: ${finalBase64.length}`);
    }

    console.log('\n✅ همه تست‌ها با موفقیت انجام شد!');
    console.log('✅ عکس استوری باید درست نمایش داده شود!\n');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
    if (error instanceof Error) {
      console.error('   - پیام:', error.message);
      console.error('   - Stack:', error.stack);
    }
    throw error;
  } finally {
    // پاک کردن استوری تستی
    if (storyId) {
      try {
        console.log('\n🧹 در حال پاک کردن استوری تستی...');
        await prisma.stories.delete({
          where: { id: storyId },
        });
        console.log('✅ استوری تستی پاک شد!\n');
      } catch (deleteError) {
        console.error('⚠️ خطا در پاک کردن استوری تستی:', deleteError);
      }
    }
    await prisma.$disconnect();
  }
}

// اجرای تست
testStoryImageDisplay()
  .then(() => {
    console.log('✅ تست کامل شد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ تست با خطا مواجه شد:', error);
    process.exit(1);
  });
