import crypto from 'node:crypto';
import { prisma } from '../lib/prisma';

const sampleImageBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAOCAYAAAA6Z0Y9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AQGDQ0SV0Yc3gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAWklEQVQ4y2NgoBAwEtYwKj8/z8DAwMjIwMDAwLy8vPz5+fn5+fnz8/Pn5+fHz8/Pn58/Hy8vLy9f3z9fXd7e3s7O/u7u7t7e3t7e/vr6+rra2trZ2dnWNycnJ1dXV5eXmZlZWVlZWWVpaYGBgYGBo6OTgYGBgYGBoYGBgYGJQAUAM98BBKs6AGYAAAAASUVORK5CYII=';

type SeedTender = {
  company: string;
  title: string;
  description: string;
  tenderNumber: string;
  tenderType: string;
  publishDate: Date;
  deadline: Date;
  deliveryLocation: string;
  estimatedMin: number;
  estimatedMax: number;
  categories: string[];
  requirements: { category: string; item: string; quantity?: number; description?: string }[];
};

const seedTenders: SeedTender[] = [
  {
    company: 'پتروشیمی بندرامام',
    title: 'مناقصه تأمین تجهیزات برق و ابزار دقیق',
    description:
      'تأمین تجهیزات برق و ابزار دقیق برای واحد تولیدی جدید شامل ترانسمیتر، کنترل‌والو و سیستم کنترل مرکزی',
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
    description:
      'اجرای پروژه‌های عمرانی شامل ساخت ساختمان اداری، سالن اجتماعات و محوطه‌سازی',
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
    description:
      'خرید و تأمین تجهیزات مکانیکی شامل پمپ‌های سانتریفیوژ، کمپرسور و مبدل‌های حرارتی',
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
    description:
      'ارائه خدمات ایمنی، بهداشت و محیط زیست شامل آموزش پرسنل، بازرسی و ممیزی',
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
    description:
      'خرید و تأمین مواد شیمیایی مورد نیاز برای واحد تولیدی شامل کاتالیست، حلال و مواد اولیه',
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

const imagePayload = Buffer.from(JSON.stringify([sampleImageBase64]));

async function main() {
  console.log('🎯 در حال اضافه کردن مناقصه‌های تستی با تصویر...');

  for (const tenderData of seedTenders) {
    const existingTender = await prisma.tenders.findFirst({
      where: {
        tenderNumber: tenderData.tenderNumber,
        company: tenderData.company
      }
    });

    const tenderPayload = {
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
      images: imagePayload,
      status: 'active',
      phase: 'receive_documents',
      updatedAt: new Date(),
      TenderCategories: {
        deleteMany: {},
        create: tenderData.categories.map(cat => ({
          id: crypto.randomUUID(),
          category: cat
        }))
      },
      TenderRequirements: {
        deleteMany: {},
        create: tenderData.requirements.map(req => ({
          id: crypto.randomUUID(),
          category: req.category,
          item: req.item,
          quantity: req.quantity ?? null,
          description: req.description ?? null
        }))
      }
    };

    if (existingTender) {
      await prisma.tenders.update({
        where: {
          id: existingTender.id
        },
        data: tenderPayload
      });

      console.log(`🛠️  اطلاعات مناقصه "${tenderData.title}" به‌روز شد (${tenderData.tenderNumber}).`);
    } else {
      await prisma.tenders.create({
        data: {
          ...tenderPayload,
          id: crypto.randomUUID()
        }
      });

      console.log(`✅ مناقصه "${tenderData.title}" ایجاد شد (${tenderData.tenderNumber}).`);
    }
  }

  console.log('🎉 تمام مناقصه‌های نمونه به همراه تصویر اضافه شدند.');
}

main()
  .catch(error => {
    console.error('❌ خطا در اضافه کردن مناقصه‌ها:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
