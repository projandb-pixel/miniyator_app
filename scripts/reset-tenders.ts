import crypto from 'node:crypto';
import { prisma } from '../lib/prisma';

// یک تصویر base64 نمونه (یک تصویر 1x1 پیکسل PNG شفاف)
const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function main() {
  console.log('🗑️  در حال پاک کردن همه مناقصات...');
  
  // پاک کردن همه مناقصات و داده‌های مرتبط
  await prisma.tenderViews.deleteMany({});
  await prisma.tenderRequirements.deleteMany({});
  await prisma.tenderParticipations.deleteMany({});
  await prisma.tenderCategories.deleteMany({});
  await prisma.comments.deleteMany({});
  await prisma.likes.deleteMany({});
  await prisma.saves.deleteMany({});
  await prisma.notifications.deleteMany({});
  await prisma.tenders.deleteMany({});
  
  console.log('✅ همه مناقصات پاک شدند');
  
  console.log('📝 در حال ایجاد 5 مناقصه تستی...');
  
  const testTenders = [
    {
      company: 'پتروشیمی بندرامام',
      title: 'مناقصه تأمین تجهیزات برق و ابزار دقیق',
      description: 'تأمین تجهیزات برق و ابزار دقیق برای واحد تولیدی جدید شامل ترانسمیتر، کنترل‌والو، و سیستم کنترل مرکزی',
      tenderNumber: 'TND-2024-001',
      tenderType: 'EPC',
      publishDate: new Date('2024-01-15'),
      deadline: new Date('2024-02-15'),
      deliveryLocation: 'بندرامام خمینی، استان خوزستان',
      estimatedMin: 50000000000,
      estimatedMax: 75000000000,
      categories: ['برق و ابزار دقیق', 'مکانیک استاتیک'],
      requirements: [
        {
          category: 'برق',
          item: 'ترانسمیتر فشار',
          quantity: 50,
          description: 'ترانسمیتر فشار با دقت بالا، رنج 0-100 بار'
        },
        {
          category: 'ابزار دقیق',
          item: 'کنترل‌والو',
          quantity: 30,
          description: 'کنترل‌والو برقی با قطر 2 اینچ'
        }
      ]
    },
    {
      company: 'پتروشیمی پارس',
      title: 'مناقصه اجرای پروژه سیویل',
      description: 'اجرای پروژه‌های عمرانی شامل ساخت ساختمان اداری، سالن اجتماعات و محوطه‌سازی',
      tenderNumber: 'TND-2024-002',
      tenderType: 'C',
      publishDate: new Date('2024-01-20'),
      deadline: new Date('2024-03-20'),
      deliveryLocation: 'عسلویه، استان بوشهر',
      estimatedMin: 20000000000,
      estimatedMax: 30000000000,
      categories: ['سیویل'],
      requirements: [
        {
          category: 'سیویل',
          item: 'بتن آماده',
          quantity: 5000,
          description: 'بتن آماده با مقاومت 250 کیلوگرم بر سانتیمتر مربع'
        },
        {
          category: 'سیویل',
          item: 'آرماتور',
          quantity: 200,
          description: 'آرماتور فولادی با قطر 16 و 20 میلیمتر'
        }
      ]
    },
    {
      company: 'پتروشیمی جم',
      title: 'مناقصه خرید تجهیزات مکانیکی',
      description: 'خرید و تأمین تجهیزات مکانیکی شامل پمپ‌های سانتریفیوژ، کمپرسور و مبدل‌های حرارتی',
      tenderNumber: 'TND-2024-003',
      tenderType: 'خرید',
      publishDate: new Date('2024-02-01'),
      deadline: new Date('2024-03-01'),
      deliveryLocation: 'جم، استان بوشهر',
      estimatedMin: 15000000000,
      estimatedMax: 20000000000,
      categories: ['مکانیک روتاری', 'مکانیک استاتیک'],
      requirements: [
        {
          category: 'مکانیک',
          item: 'پمپ سانتریفیوژ',
          quantity: 10,
          description: 'پمپ سانتریفیوژ با دبی 100 متر مکعب بر ساعت'
        },
        {
          category: 'مکانیک',
          item: 'کمپرسور',
          quantity: 5,
          description: 'کمپرسور پیستونی با ظرفیت 50 متر مکعب بر دقیقه'
        }
      ]
    },
    {
      company: 'پتروشیمی فجر',
      title: 'مناقصه خدمات HSE',
      description: 'ارائه خدمات ایمنی، بهداشت و محیط زیست شامل آموزش پرسنل، بازرسی و ممیزی',
      tenderNumber: 'TND-2024-004',
      tenderType: 'خدمات',
      publishDate: new Date('2024-02-10'),
      deadline: new Date('2024-02-25'),
      deliveryLocation: 'عسلویه، استان بوشهر',
      estimatedMin: 5000000000,
      estimatedMax: 8000000000,
      categories: ['HSE'],
      requirements: [
        {
          category: 'HSE',
          item: 'دوره آموزش ایمنی',
          quantity: 200,
          description: 'دوره 40 ساعته آموزش ایمنی برای پرسنل'
        },
        {
          category: 'HSE',
          item: 'بازرسی تجهیزات',
          quantity: 1,
          description: 'بازرسی سالانه تمام تجهیزات ایمنی'
        }
      ]
    },
    {
      company: 'پتروشیمی اروند',
      title: 'مناقصه خرید مواد شیمیایی',
      description: 'خرید و تأمین مواد شیمیایی مورد نیاز برای واحد تولیدی شامل کاتالیست، حلال و مواد اولیه',
      tenderNumber: 'TND-2024-005',
      tenderType: 'خرید',
      publishDate: new Date('2024-02-15'),
      deadline: new Date('2024-03-15'),
      deliveryLocation: 'ماهشهر، استان خوزستان',
      estimatedMin: 30000000000,
      estimatedMax: 40000000000,
      categories: ['خرید/بازرگانی'],
      requirements: [
        {
          category: 'مواد شیمیایی',
          item: 'کاتالیست',
          quantity: 100,
          description: 'کاتالیست پلاتین با خلوص 99.9%'
        },
        {
          category: 'مواد شیمیایی',
          item: 'حلال',
          quantity: 500,
          description: 'حلال آلی با درجه خلوص آزمایشگاهی'
        }
      ]
    }
  ];

  // تبدیل تصویر base64 به Buffer
  const imageBuffer = Buffer.from(
    JSON.stringify([sampleImageBase64])
  );

  for (const tenderData of testTenders) {
    const tender = await prisma.tenders.create({
      data: {
        id: crypto.randomUUID(),
        company: tenderData.company,
        title: tenderData.title,
        description: tenderData.description,
        tenderNumber: tenderData.tenderNumber,
        tenderType: tenderData.tenderType,
        publishDate: tenderData.publishDate,
        deadline: tenderData.deadline,
        deliveryLocation: tenderData.deliveryLocation,
        estimatedMin: tenderData.estimatedMin,
        estimatedMax: tenderData.estimatedMax,
        images: imageBuffer,
        status: 'active',
        phase: 'receive_documents',
        updatedAt: new Date(),
        TenderCategories: {
          create: tenderData.categories.map(cat => ({
            id: crypto.randomUUID(),
            category: cat
          }))
        },
        TenderRequirements: {
          create: tenderData.requirements.map(req => ({
            id: crypto.randomUUID(),
            category: req.category,
            item: req.item,
            quantity: req.quantity || null,
            description: req.description || null
          }))
        }
      }
    });

    console.log(`✅ مناقصه "${tender.title}" ایجاد شد (${tender.tenderNumber})`);
  }

  console.log('🎉 5 مناقصه تستی با موفقیت ایجاد شدند!');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

