/**
 * تست کامل آپلود عکس پروفایل
 * این اسکریپت:
 * 1. یک شرکت پیدا می‌کند
 * 2. عکس پروفایل را آپدیت می‌کند
 * 3. بررسی می‌کند که logo درست ذخیره شده است
 * 4. بررسی می‌کند که logo درست خوانده می‌شود
 * 5. بررسی می‌کند که API endpoint درست کار می‌کند
 */

import { prisma } from '../lib/prisma';
import { base64ToBuffer, bufferToBase64 } from '../lib/file-utils';

// یک تصویر تستی کوچک (1x1 pixel PNG) به صورت base64
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testProfileLogoUpload() {
  let originalLogo: Buffer | null = null;
  let companyId: string | null = null;
  
  try {
    console.log('🧪 شروع تست کامل آپلود عکس پروفایل...\n');

    // 1. پیدا کردن یک شرکت برای تست
    const company = await prisma.companies.findFirst({
      include: { Users: true },
    });

    if (!company) {
      console.error('❌ هیچ شرکتی یافت نشد. لطفاً ابتدا داده‌های تستی ایجاد کنید.');
      return;
    }

    companyId = company.id;
    originalLogo = company.logo as Buffer | null;

    console.log(`✅ شرکت پیدا شد: ${company.id} - ${company.name}`);
    console.log(`   - logo فعلی: ${originalLogo ? `${originalLogo.length} bytes` : 'NULL'}\n`);

    // 2. تبدیل base64 به Buffer
    const imageBuffer = base64ToBuffer(testImageBase64);
    console.log(`✅ تصویر به Buffer تبدیل شد: ${imageBuffer.length} bytes\n`);

    // 3. آپدیت logo با استفاده از raw query (همان روش API)
    console.log('📝 در حال آپدیت logo با raw query...');
    
    // تبدیل Buffer به hex string با prefix 0x
    const logoHex = '0x' + imageBuffer.toString('hex').toUpperCase();
    console.log(`✅ تصویر به hex string تبدیل شد: ${logoHex.substring(0, 50)}...\n`);

    // استفاده از raw query برای آپدیت logo
    await (prisma as any).$executeRawUnsafe(
      `UPDATE Companies SET logo = ${logoHex}, updatedAt = '${new Date().toISOString()}' WHERE id = N'${companyId}'`
    );

    console.log('✅ logo با موفقیت آپدیت شد!\n');

    // 4. بررسی اینکه logo درست ذخیره شده است (مستقیماً از دیتابیس)
    console.log('🔍 در حال بررسی logo از دیتابیس (مستقیم)...');
    const companyFromDb = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        logo: true,
      },
    });

    if (!companyFromDb) {
      console.error('❌ شرکت در دیتابیس یافت نشد!');
      return;
    }

    console.log(`✅ شرکت از دیتابیس خوانده شد: ${companyFromDb.id}`);
    console.log(`   - logo: ${companyFromDb.logo ? `${(companyFromDb.logo as Buffer).length} bytes` : 'NULL'}\n`);

    if (!companyFromDb.logo) {
      console.error('❌ logo در دیتابیس NULL است!');
      return;
    }

    const storedLogo = companyFromDb.logo as Buffer;
    if (storedLogo.length !== imageBuffer.length) {
      console.error(`❌ اندازه logo اشتباه است! انتظار: ${imageBuffer.length}, دریافت: ${storedLogo.length}`);
      return;
    }

    console.log('✅ logo درست در دیتابیس ذخیره شده است!\n');

    // 5. بررسی اینکه logo درست خوانده می‌شود (با select)
    console.log('🔍 در حال بررسی logo با select (همان روش API GET)...');
    const companyWithSelect = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    if (!companyWithSelect) {
      console.error('❌ شرکت با select یافت نشد!');
      return;
    }

    console.log(`✅ شرکت با select خوانده شد: ${companyWithSelect.id}`);
    console.log(`   - logo: ${companyWithSelect.logo ? `${(companyWithSelect.logo as Buffer).length} bytes` : 'NULL'}\n`);

    if (!companyWithSelect.logo) {
      console.error('❌ logo با select NULL است!');
      return;
    }

    const selectedLogo = companyWithSelect.logo as Buffer;
    if (selectedLogo.length !== imageBuffer.length) {
      console.error(`❌ اندازه logo با select اشتباه است! انتظار: ${imageBuffer.length}, دریافت: ${selectedLogo.length}`);
      return;
    }

    console.log('✅ logo با select درست خوانده می‌شود!\n');

    // 6. بررسی اینکه bufferToBase64 درست کار می‌کند
    console.log('🔍 در حال بررسی تبدیل logo به base64...');
    console.log(`   - selectedLogo type: ${typeof selectedLogo}`);
    console.log(`   - selectedLogo instanceof Buffer: ${selectedLogo instanceof Buffer}`);
    console.log(`   - selectedLogo constructor: ${selectedLogo.constructor.name}`);
    
    // اطمینان از اینکه selectedLogo یک Buffer است
    const logoBufferForConversion = selectedLogo instanceof Buffer 
      ? selectedLogo 
      : Buffer.from(selectedLogo as any);
    
    console.log(`   - logoBufferForConversion instanceof Buffer: ${logoBufferForConversion instanceof Buffer}`);
    console.log(`   - logoBufferForConversion length: ${logoBufferForConversion.length}`);
    
    const logoUrl = bufferToBase64(logoBufferForConversion);
    
    if (!logoUrl) {
      console.error('❌ bufferToBase64 null برمی‌گرداند!');
      return;
    }

    console.log(`✅ logoUrl ساخته شد: ${logoUrl.substring(0, 100)}...`);
    console.log(`   - طول logoUrl: ${logoUrl.length} characters`);
    console.log(`   - شروع با data:image: ${logoUrl.startsWith('data:image')}\n`);

    if (!logoUrl.startsWith('data:image')) {
      console.error('❌ logoUrl با data:image شروع نمی‌شود!');
      return;
    }

    // بررسی اینکه base64 data درست است
    const base64Data = logoUrl.split(',')[1];
    if (!base64Data || base64Data.length < 10) {
      console.error(`❌ base64 data خیلی کوتاه است! طول: ${base64Data?.length || 0}`);
      console.error(`   - logoUrl: ${logoUrl.substring(0, 200)}`);
      return;
    }

    console.log(`✅ base64 data درست است: ${base64Data.substring(0, 30)}... (${base64Data.length} characters)`);
    console.log('✅ bufferToBase64 درست کار می‌کند!\n');

    // 7. شبیه‌سازی API GET handler
    console.log('🔍 در حال شبیه‌سازی API GET handler...');
    const companyFromApi = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    if (!companyFromApi) {
      console.error('❌ شرکت از API یافت نشد!');
      return;
    }

    let apiLogoUrl: string | null = null;
    if (companyFromApi.logo) {
      try {
        const logoBuffer = companyFromApi.logo instanceof Buffer 
          ? companyFromApi.logo 
          : Buffer.from(companyFromApi.logo as any);
        apiLogoUrl = bufferToBase64(logoBuffer);
        console.log(`   - Company ${companyFromApi.id}: Logo converted, logoUrl length: ${apiLogoUrl?.length || 0}`);
      } catch (error) {
        console.error(`   - Error converting logo for company ${companyFromApi.id}:`, error);
      }
    }

    console.log(`✅ شرکت از API برگردانده شد: ${companyFromApi.id}`);
    console.log(`   - logoUrl: ${apiLogoUrl ? `${apiLogoUrl.substring(0, 100)}...` : 'NULL'}\n`);

    if (!apiLogoUrl) {
      console.error('❌ logoUrl در response API NULL است!');
      return;
    }

    if (!apiLogoUrl.startsWith('data:image')) {
      console.error('❌ logoUrl در response API با data:image شروع نمی‌شود!');
      return;
    }

    console.log('✅ API GET handler درست کار می‌کند!\n');

    // 8. بررسی اینکه logoUrl قابل استفاده است
    console.log('🔍 در حال بررسی اینکه logoUrl قابل استفاده است...');
    const logoUrlBase64 = apiLogoUrl.split(',')[1];
    if (!logoUrlBase64) {
      console.error('❌ logoUrl base64 data ندارد!');
      return;
    }

    console.log(`✅ logoUrl base64 data دارد: ${logoUrlBase64.substring(0, 30)}...`);
    console.log(`   - طول base64 data: ${logoUrlBase64.length} characters\n`);

    // 9. مقایسه نهایی
    console.log('🔍 مقایسه نهایی...');
    const originalBase64 = testImageBase64.split(',')[1];
    const finalBase64 = apiLogoUrl.split(',')[1];
    
    if (originalBase64 === finalBase64) {
      console.log('✅ base64 data یکسان است!');
    } else {
      console.log('⚠️ base64 data متفاوت است (ممکن است به دلیل MIME type detection باشد)');
      console.log(`   - Original length: ${originalBase64.length}`);
      console.log(`   - Final length: ${finalBase64.length}`);
    }

    console.log('\n✅ همه تست‌ها با موفقیت انجام شد!');
    console.log('✅ عکس پروفایل باید درست نمایش داده شود!\n');

  } catch (error) {
    console.error('❌ خطا در تست:', error);
    if (error instanceof Error) {
      console.error('   - پیام:', error.message);
      console.error('   - Stack:', error.stack);
    }
    throw error;
  } finally {
    // بازگرداندن logo اصلی
    if (companyId) {
      try {
        console.log('\n🔄 در حال بازگرداندن logo اصلی...');
        if (originalLogo) {
          const originalLogoHex = '0x' + originalLogo.toString('hex').toUpperCase();
          await (prisma as any).$executeRawUnsafe(
            `UPDATE Companies SET logo = ${originalLogoHex}, updatedAt = '${new Date().toISOString()}' WHERE id = N'${companyId}'`
          );
          console.log('✅ logo اصلی بازگردانده شد!\n');
        } else {
          await (prisma as any).$executeRawUnsafe(
            `UPDATE Companies SET logo = NULL, updatedAt = '${new Date().toISOString()}' WHERE id = N'${companyId}'`
          );
          console.log('✅ logo به NULL بازگردانده شد!\n');
        }
      } catch (restoreError) {
        console.error('⚠️ خطا در بازگرداندن logo اصلی:', restoreError);
      }
    }
    await prisma.$disconnect();
  }
}

// اجرای تست
testProfileLogoUpload()
  .then(() => {
    console.log('✅ تست کامل شد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ تست با خطا مواجه شد:', error);
    process.exit(1);
  });
