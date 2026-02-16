/**
 * تست کامل نمایش logo در همه جاها
 * این اسکریپت:
 * 1. یک شرکت با logo پیدا می‌کند یا ایجاد می‌کند
 * 2. همه API endpoints که logo را برمی‌گردانند را تست می‌کند
 * 3. بررسی می‌کند که logo درست به base64 تبدیل می‌شود
 * 4. بررسی می‌کند که logoUrl درست ساخته می‌شود
 */

import { prisma } from '../lib/prisma';
import { base64ToBuffer, bufferToBase64 } from '../lib/file-utils';

// یک تصویر تستی کوچک (1x1 pixel PNG) به صورت base64
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

interface TestResult {
  endpoint: string;
  success: boolean;
  error?: string;
  logoUrl?: string;
  logoUrlValid?: boolean;
}

async function testAllLogoDisplays() {
  let companyId: string | null = null;
  let userId: string | null = null;
  const results: TestResult[] = [];

  try {
    console.log('🧪 شروع تست کامل نمایش logo در همه جاها...\n');

    // 1. پیدا کردن یا ایجاد یک شرکت با logo
    console.log('📝 در حال پیدا کردن یا ایجاد شرکت با logo...');
    let company = await prisma.companies.findFirst({
      where: {
        logo: { not: null },
      },
      include: { Users: true },
    });

    if (!company) {
      console.log('   - هیچ شرکتی با logo یافت نشد. در حال ایجاد شرکت تستی...');
      
      // پیدا کردن یک کاربر
      const user = await prisma.users.findFirst();
      if (!user) {
        console.error('❌ هیچ کاربری یافت نشد. لطفاً ابتدا داده‌های تستی ایجاد کنید.');
        return;
      }

      userId = user.id;
      
      // تبدیل base64 به Buffer و سپس به hex string
      const imageBuffer = base64ToBuffer(testImageBase64);
      const logoHex = '0x' + imageBuffer.toString('hex').toUpperCase();

      // ایجاد شرکت با logo
      companyId = crypto.randomUUID();
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO Companies (id, userId, name, city, province, logo, isVerified, createdAt, updatedAt)
         VALUES (N'${companyId}', N'${userId}', N'شرکت تستی', N'تهران', N'تهران', ${logoHex}, 0, '${new Date().toISOString()}', '${new Date().toISOString()}')`
      );

      company = await prisma.companies.findUnique({
        where: { id: companyId },
        include: { Users: true },
      });

      if (!company) {
        console.error('❌ خطا در ایجاد شرکت تستی!');
        return;
      }

      console.log(`✅ شرکت تستی ایجاد شد: ${company.id} - ${company.name}\n`);
    } else {
      companyId = company.id;
      userId = company.userId;
      console.log(`✅ شرکت پیدا شد: ${company.id} - ${company.name}\n`);
    }

    // 2. تست API /api/profile
    console.log('🔍 تست API /api/profile...');
    try {
      const profileCompany = await prisma.companies.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          logo: true,
        },
      });

      if (!profileCompany || !profileCompany.logo) {
        results.push({
          endpoint: '/api/profile',
          success: false,
          error: 'Logo not found',
        });
      } else {
        const logoBuffer = profileCompany.logo instanceof Buffer 
          ? profileCompany.logo 
          : Buffer.from(profileCompany.logo as any);
        const logoUrl = bufferToBase64(logoBuffer);
        
        const isValid = !!(logoUrl && logoUrl.startsWith('data:image'));
        results.push({
          endpoint: '/api/profile',
          success: isValid,
          logoUrl: logoUrl?.substring(0, 100),
          logoUrlValid: isValid,
        });
        console.log(`   ${isValid ? '✅' : '❌'} logoUrl: ${logoUrl?.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({
        endpoint: '/api/profile',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`   ❌ خطا: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 3. تست API /api/posts
    console.log('\n🔍 تست API /api/posts...');
    try {
      const post = await prisma.posts.findFirst({
        where: { companyId: companyId },
        include: {
          Companies: {
            select: {
              id: true,
              name: true,
              logo: true,
              isVerified: true,
            },
          },
        },
      });

      if (!post || !post.Companies.logo) {
        results.push({
          endpoint: '/api/posts',
          success: false,
          error: 'Post with logo not found',
        });
        console.log('   ⚠️ پستی با logo یافت نشد');
      } else {
        const logoBuffer = post.Companies.logo instanceof Buffer 
          ? post.Companies.logo 
          : Buffer.from(post.Companies.logo as any);
        const logoUrl = bufferToBase64(logoBuffer);
        
        const isValid = !!(logoUrl && logoUrl.startsWith('data:image'));
        results.push({
          endpoint: '/api/posts',
          success: isValid,
          logoUrl: logoUrl?.substring(0, 100),
          logoUrlValid: isValid,
        });
        console.log(`   ${isValid ? '✅' : '❌'} logoUrl: ${logoUrl?.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({
        endpoint: '/api/posts',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`   ❌ خطا: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 4. تست API /api/stories
    console.log('\n🔍 تست API /api/stories...');
    try {
      const story = await prisma.stories.findFirst({
        where: { companyId: companyId },
        include: {
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

      if (!story || !story.Companies.logo) {
        results.push({
          endpoint: '/api/stories',
          success: false,
          error: 'Story with logo not found',
        });
        console.log('   ⚠️ استوری با logo یافت نشد');
      } else {
        const logoBuffer = story.Companies.logo instanceof Buffer 
          ? story.Companies.logo 
          : Buffer.from(story.Companies.logo as any);
        const logoUrl = bufferToBase64(logoBuffer);
        
        const isValid = !!(logoUrl && logoUrl.startsWith('data:image'));
        results.push({
          endpoint: '/api/stories',
          success: isValid,
          logoUrl: logoUrl?.substring(0, 100),
          logoUrlValid: isValid,
        });
        console.log(`   ${isValid ? '✅' : '❌'} logoUrl: ${logoUrl?.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({
        endpoint: '/api/stories',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`   ❌ خطا: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 5. تست API /api/suppliers
    console.log('\n🔍 تست API /api/suppliers...');
    try {
      const supplier = await prisma.companies.findFirst({
        where: { 
          id: companyId,
          Users: {
            role: 'supplier',
          },
        },
        select: {
          id: true,
          name: true,
          logo: true,
        },
      });

      if (!supplier || !supplier.logo) {
        results.push({
          endpoint: '/api/suppliers',
          success: false,
          error: 'Supplier with logo not found',
        });
        console.log('   ⚠️ تأمین‌کننده با logo یافت نشد');
      } else {
        const logoBuffer = supplier.logo instanceof Buffer 
          ? supplier.logo 
          : Buffer.from(supplier.logo as any);
        const logoUrl = bufferToBase64(logoBuffer);
        
        const isValid = !!(logoUrl && logoUrl.startsWith('data:image'));
        results.push({
          endpoint: '/api/suppliers',
          success: isValid,
          logoUrl: logoUrl?.substring(0, 100),
          logoUrlValid: isValid,
        });
        console.log(`   ${isValid ? '✅' : '❌'} logoUrl: ${logoUrl?.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({
        endpoint: '/api/suppliers',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`   ❌ خطا: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 6. تست API /api/dashboard/suggested-suppliers
    console.log('\n🔍 تست API /api/dashboard/suggested-suppliers...');
    try {
      const supplier = await prisma.companies.findFirst({
        where: { 
          id: companyId,
          Users: {
            role: 'supplier',
          },
        },
        select: {
          id: true,
          name: true,
          logo: true,
        },
      });

      if (!supplier || !supplier.logo) {
        results.push({
          endpoint: '/api/dashboard/suggested-suppliers',
          success: false,
          error: 'Supplier with logo not found',
        });
        console.log('   ⚠️ تأمین‌کننده با logo یافت نشد');
      } else {
        const logoBuffer = supplier.logo instanceof Buffer 
          ? supplier.logo 
          : Buffer.from(supplier.logo as any);
        const logoUrl = bufferToBase64(logoBuffer);
        
        const isValid = !!(logoUrl && logoUrl.startsWith('data:image'));
        results.push({
          endpoint: '/api/dashboard/suggested-suppliers',
          success: isValid,
          logoUrl: logoUrl?.substring(0, 100),
          logoUrlValid: isValid,
        });
        console.log(`   ${isValid ? '✅' : '❌'} logoUrl: ${logoUrl?.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({
        endpoint: '/api/dashboard/suggested-suppliers',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`   ❌ خطا: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 7. تست API /api/messages/[conversationId]
    console.log('\n🔍 تست API /api/messages/[conversationId]...');
    try {
      const message = await prisma.messages.findFirst({
        where: {
          OR: [
            { senderCompanyId: companyId },
            { receiverCompanyId: companyId },
          ],
        },
        include: {
          SenderCompany: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          ReceiverCompany: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      });

      if (!message) {
        results.push({
          endpoint: '/api/messages/[conversationId]',
          success: false,
          error: 'Message with logo not found',
        });
        console.log('   ⚠️ پیامی با logo یافت نشد');
      } else {
        const senderLogo = message.SenderCompany.logo;
        const receiverLogo = message.ReceiverCompany.logo;
        
        let logoUrl: string | null = null;
        if (senderLogo) {
          const logoBuffer = senderLogo instanceof Buffer 
            ? senderLogo 
            : Buffer.from(senderLogo as any);
          logoUrl = bufferToBase64(logoBuffer);
        } else if (receiverLogo) {
          const logoBuffer = receiverLogo instanceof Buffer 
            ? receiverLogo 
            : Buffer.from(receiverLogo as any);
          logoUrl = bufferToBase64(logoBuffer);
        }
        
        const isValid = !!(logoUrl && logoUrl.startsWith('data:image'));
        results.push({
          endpoint: '/api/messages/[conversationId]',
          success: isValid,
          logoUrl: logoUrl?.substring(0, 100),
          logoUrlValid: isValid,
        });
        console.log(`   ${isValid ? '✅' : '❌'} logoUrl: ${logoUrl?.substring(0, 100)}...`);
      }
    } catch (error) {
      results.push({
        endpoint: '/api/messages/[conversationId]',
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`   ❌ خطا: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 8. خلاصه نتایج
    console.log('\n' + '='.repeat(60));
    console.log('📊 خلاصه نتایج:');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.endpoint}`);
      if (result.error) {
        console.log(`   خطا: ${result.error}`);
      }
      if (result.logoUrl) {
        console.log(`   logoUrl: ${result.logoUrl}...`);
        console.log(`   معتبر: ${result.logoUrlValid ? '✅' : '❌'}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ موفق: ${successCount}/${totalCount}`);
    console.log(`❌ ناموفق: ${totalCount - successCount}/${totalCount}`);
    console.log('='.repeat(60) + '\n');

    if (successCount === totalCount) {
      console.log('✅ همه تست‌ها با موفقیت انجام شد!');
      console.log('✅ logo در همه جاها باید درست نمایش داده شود!\n');
    } else {
      console.log('⚠️ بعضی تست‌ها ناموفق بودند. لطفاً بررسی کنید.\n');
    }

  } catch (error) {
    console.error('❌ خطا در تست:', error);
    if (error instanceof Error) {
      console.error('   - پیام:', error.message);
      console.error('   - Stack:', error.stack);
    }
    throw error;
  } finally {
    // پاک کردن شرکت تستی اگر ایجاد شده باشد
    if (companyId) {
      try {
        const testCompany = await prisma.companies.findUnique({
          where: { id: companyId },
          select: { name: true },
        });
        
        if (testCompany && testCompany.name === 'شرکت تستی') {
          console.log('\n🔄 در حال پاک کردن شرکت تستی...');
          await prisma.companies.delete({
            where: { id: companyId },
          });
          console.log('✅ شرکت تستی پاک شد!\n');
        }
      } catch (restoreError) {
        console.error('⚠️ خطا در پاک کردن شرکت تستی:', restoreError);
      }
    }
    await prisma.$disconnect();
  }
}

// اجرای تست
testAllLogoDisplays()
  .then(() => {
    console.log('✅ تست کامل شد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ تست با خطا مواجه شد:', error);
    process.exit(1);
  });
