/**
 * اسکریپت ایجاد مناقصات تستی
 * در هر محیطی که پروژه وین‌تندر را اجرا می‌کنید، این فایل را می‌توانید همراه ببرید.
 *
 * پیش‌نیاز در محل اجرا:
 * ۱. فایل .env با DATABASE_URL معتبر (اتصال به همان دیتابیس پروژه)
 * ۲. اجرای قبلی: npx prisma generate
 *
 * نحوه اجرا از ریشه پروژه:
 *   npx tsx scripts/seed-test-tenders.ts
 *
 * یا با npm:
 *   npm run seed:test-tenders
 * (در صورت اضافه کردن اسکریپت به package.json)
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// بارگذاری .env از ریشه پروژه (برای اجرا در محیط دیگر)
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL در .env یا .env.local تنظیم نشده است.");
  process.exit(1);
}

function parseConnectionString(connectionString: string) {
  const url = connectionString.replace(/^sqlserver:\/\//, "");
  const [hostPort, ...params] = url.split(";");
  const [server, portStr] = hostPort.split(":");
  const port = portStr ? Number.parseInt(portStr, 10) : 1433;
  const adapterConfig: {
    server: string;
    port: number;
    database?: string;
    user?: string;
    password?: string;
    options?: { encrypt?: boolean; trustServerCertificate?: boolean };
  } = { server, port, options: {} };
  for (const param of params) {
    const [key, value] = param.split("=");
    if (!key || !value) continue;
    switch (key.toLowerCase()) {
      case "database":
        adapterConfig.database = value;
        break;
      case "user":
        adapterConfig.user = value;
        break;
      case "password":
        adapterConfig.password = value;
        break;
      case "trustservercertificate":
        adapterConfig.options = adapterConfig.options || {};
        adapterConfig.options.trustServerCertificate = value.toLowerCase() === "true";
        break;
    }
  }
  return adapterConfig;
}

const adapter = new PrismaMssql(parseConnectionString(DATABASE_URL));
const prisma = new PrismaClient({ adapter });

function uuid() {
  return crypto.randomUUID();
}

const now = new Date();
const inDays = (d: number) => {
  const d2 = new Date(now);
  d2.setDate(d2.getDate() + d);
  return d2;
};

const testTenders = [
  {
    company: "پتروشیمی بندرامام",
    title: "پروژه نصب و راه‌اندازی سیستم برق و ابزار دقیق",
    description:
      "پروژه کامل نصب و راه‌اندازی سیستم برق و ابزار دقیق واحد جدید. ارائه پیشنهاد فنی و مالی.",
    tenderNumber: `1403-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-001`,
    tenderType: "EPC",
    publishDate: now,
    deadline: inDays(14),
    documentDeliveryDeadline: inDays(7),
    deliveryLocation: "دفتر مرکزی - ماهشهر",
    estimatedMin: 38_000_000_000,
    estimatedMax: 54_000_000_000,
    categories: ["برق", "ابزار دقیق", "نصب"],
    requirements: [
      { category: "برق", item: "کابل، ترمینال، تابلو", quantity: null, description: "تجهیزات برق مطابق نقشه" },
      { category: "ابزار دقیق", item: "ترانسمیتر، سنسور", quantity: null, description: "تجهیزات ابزار دقیق مطابق نقشه" },
    ],
  },
  {
    company: "پتروشیمی اروند",
    title: "تأمین و نصب تجهیزات مکانیکی",
    description: "تأمین و نصب تجهیزات مکانیکی استاتیک برای واحد بهره‌برداری.",
    tenderNumber: `1403-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-002`,
    tenderType: "EPC",
    publishDate: now,
    deadline: inDays(21),
    documentDeliveryDeadline: inDays(10),
    deliveryLocation: "مجتمع - منطقه ویژه اروند",
    estimatedMin: 125_000_000_000,
    estimatedMax: 180_000_000_000,
    categories: ["مکانیک", "استاتیک", "EPC"],
    requirements: [
      { category: "مکانیک", item: "پمپ سانتریفیوژ", quantity: 6, description: "نوع پمپ مطابق نقشه" },
      { category: "مکانیک", item: "کمپرسور", quantity: 2, description: "مطابق مشخصات فنی" },
    ],
  },
  {
    company: "پتروشیمی پارس",
    title: "استعلام قیمت لوله و اتصالات فولادی",
    description: "تأمین لوله و اتصالات فولادی مطابق استاندارد برای پروژه توسعه.",
    tenderNumber: `1403-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-003`,
    tenderType: "تأمین کالا",
    publishDate: now,
    deadline: inDays(10),
    documentDeliveryDeadline: inDays(5),
    deliveryLocation: "عسلویه - انبار مرکزی",
    estimatedMin: 12_000_000_000,
    estimatedMax: 18_000_000_000,
    categories: ["لوله و اتصالات", "فولاد", "تأمین کالا"],
    requirements: [
      { category: "لوله", item: "لوله فولادی بدون درز", quantity: 500, description: "قطر و ضخامت مطابق لیست" },
      { category: "اتصالات", item: "زانو، سه‌راه، فلنج", quantity: null, description: "مطابق نقشه و لیست" },
    ],
  },
  {
    company: "پالایشگاه نفت آبادان",
    title: "بازسازی و تعمیرات واحد HSE",
    description: "بازسازی ساختمان و تعمیرات تأسیسات واحد HSE و آتش‌نشانی.",
    tenderNumber: `1403-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-004`,
    tenderType: "ساختمانی",
    publishDate: now,
    deadline: inDays(18),
    documentDeliveryDeadline: inDays(8),
    deliveryLocation: "آبادان - سایت پالایشگاه",
    estimatedMin: 8_000_000_000,
    estimatedMax: 12_000_000_000,
    categories: ["ساختمانی", "HSE", "تعمیرات"],
    requirements: [
      { category: "ساختمانی", item: "بازسازی سازه و نما", quantity: null, description: "مطابق نقشه" },
      { category: "HSE", item: "سیستم اعلام حریق و اطفا", quantity: 1, description: "مطابق استاندارد" },
    ],
  },
  {
    company: "شرکت ملی حفاری ایران",
    title: "تأمین قطعات یدکی ماشین‌آلات حفاری",
    description: "استعلام قیمت و تأمین قطعات یدکی اصلی برای ماشین‌آلات حفاری.",
    tenderNumber: `1403-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-005`,
    tenderType: "تأمین کالا",
    publishDate: now,
    deadline: inDays(12),
    documentDeliveryDeadline: null,
    deliveryLocation: "تهران - انبار مرکزی",
    estimatedMin: 5_000_000_000,
    estimatedMax: 9_000_000_000,
    categories: ["قطعات یدکی", "حفاری", "تأمین کالا"],
    requirements: [
      { category: "قطعات یدکی", item: "قطعات اصلی ماشین حفاری", quantity: null, description: "مطابق کد کاتالوگ" },
    ],
  },
  {
    company: "شرکت پتروایمکو",
    title: "پروژه رنگ‌آمیزی و پوشش خط لوله",
    description: "رنگ‌آمیزی و پوشش ضد خوردگی خطوط لوله در محدوده سایت.",
    tenderNumber: `1403-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-006`,
    tenderType: "پیمانکاری",
    publishDate: now,
    deadline: inDays(15),
    documentDeliveryDeadline: inDays(6),
    deliveryLocation: "اهواز - سایت پروژه",
    estimatedMin: 3_500_000_000,
    estimatedMax: 5_500_000_000,
    categories: ["رنگ و پوشش", "ضد خوردگی", "پیمانکاری"],
    requirements: [
      { category: "پوشش", item: "رنگ اپوکسی و پوشش سه لایه", quantity: null, description: "مطابق مشخصات فنی" },
    ],
  },
];

async function main() {
  console.log("🌱 شروع ایجاد مناقصات تستی...\n");

  for (const t of testTenders) {
    const tenderId = uuid();
    await prisma.tenders.create({
      data: {
        id: tenderId,
        company: t.company,
        title: t.title,
        description: t.description,
        tenderNumber: t.tenderNumber,
        tenderType: t.tenderType,
        publishDate: t.publishDate,
        deadline: t.deadline,
        documentDeliveryDeadline: t.documentDeliveryDeadline ?? undefined,
        deliveryLocation: t.deliveryLocation,
        status: "active",
        phase: "receive_documents",
        estimatedMin: t.estimatedMin,
        estimatedMax: t.estimatedMax,
        updatedAt: now,
        TenderCategories: {
          create: t.categories.map((category) => ({
            id: uuid(),
            category,
          })),
        },
        TenderRequirements: {
          create: t.requirements.map((r) => ({
            id: uuid(),
            category: r.category,
            item: r.item,
            quantity: r.quantity ?? undefined,
            description: r.description ?? undefined,
          })),
        },
      },
    });
    console.log(`  ✅ ${t.tenderNumber} — ${t.title}`);
  }

  console.log(`\n✅ در مجموع ${testTenders.length} مناقصه تستی ایجاد شد.`);
}

main()
  .catch((e) => {
    console.error("❌ خطا:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
