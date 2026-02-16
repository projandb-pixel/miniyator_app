import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ایجاد استان‌ها و شهرهای ایران
  console.log("📍 Creating provinces and cities...");

  const provincesData = [
    {
      name: "تهران",
      cities: [
        "تهران",
        "اسلامشهر",
        "ورامین",
        "شهریار",
        "کرج",
        "فیروزکوه",
        "دماوند",
      ],
    },
    {
      name: "خوزستان",
      cities: [
        "اهواز",
        "آبادان",
        "خرمشهر",
        "ماهشهر",
        "دزفول",
        "اندیمشک",
        "بهبهان",
      ],
    },
    {
      name: "اصفهان",
      cities: [
        "اصفهان",
        "کاشان",
        "نجف‌آباد",
        "خمینی‌شهر",
        "شاهین‌شهر",
        "فولادشهر",
      ],
    },
    {
      name: "فارس",
      cities: ["شیراز", "مرودشت", "کازرون", "جهرم", "فسا", "داراب"],
    },
    {
      name: "مازندران",
      cities: ["ساری", "بابل", "آمل", "قائمشهر", "بهشهر", "نوشهر"],
    },
    { name: "گیلان", cities: ["رشت", "انزلی", "لاهیجان", "لنگرود", "رودسر"] },
    {
      name: "آذربایجان شرقی",
      cities: ["تبریز", "مراغه", "میانه", "مرند", "شبستر"],
    },
    {
      name: "آذربایجان غربی",
      cities: ["ارومیه", "خوی", "مهاباد", "میاندوآب", "بوکان"],
    },
    { name: "کرمان", cities: ["کرمان", "رفسنجان", "سیرجان", "بم", "جیرفت"] },
    {
      name: "خراسان رضوی",
      cities: ["مشهد", "نیشابور", "سبزوار", "قوچان", "تربت حیدریه"],
    },
    { name: "بوشهر", cities: ["بوشهر", "برازجان", "گناوه", "دیر", "کنگان"] },
    { name: "هرمزگان", cities: ["بندرعباس", "قشم", "کیش", "بندرلنگه", "بستک"] },
    { name: "یزد", cities: ["یزد", "اردکان", "مهریز", "ابرکوه", "تفت"] },
    { name: "سمنان", cities: ["سمنان", "شاهرود", "گرگان", "بجنورد", "گنبد"] },
    {
      name: "لرستان",
      cities: ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز", "پل‌دختر"],
    },
    { name: "کردستان", cities: ["سنندج", "مریوان", "بانه", "سقز", "قروه"] },
    {
      name: "همدان",
      cities: ["همدان", "ملایر", "تویسرکان", "کبودرآهنگ", "نهاوند"],
    },
    {
      name: "چهارمحال و بختیاری",
      cities: ["شهرکرد", "بروجن", "فارسان", "لردگان", "اردل"],
    },
    {
      name: "کهگیلویه و بویراحمد",
      cities: ["یاسوج", "گچساران", "دوگنبدان", "دهدشت"],
    },
    { name: "زنجان", cities: ["زنجان", "ابهر", "قیدار", "خدابنده", "ماهنشان"] },
    {
      name: "قزوین",
      cities: ["قزوین", "البرز", "تاکستان", "آبیک", "بوئین‌زهرا"],
    },
    {
      name: "اردبیل",
      cities: ["اردبیل", "پارس‌آباد", "خلخال", "مشگین‌شهر", "گرمی"],
    },
    {
      name: "سیستان و بلوچستان",
      cities: ["زاهدان", "چابهار", "ایرانشهر", "خاش", "زابل"],
    },
    {
      name: "ایلام",
      cities: ["ایلام", "دهلران", "آبدانان", "دره‌شهر", "مهران"],
    },
    { name: "مرکزی", cities: ["اراک", "ساوه", "خمین", "دلیجان", "شازند"] },
    { name: "قم", cities: ["قم", "جعفریه", "سلفچگان", "کهک"] },
    {
      name: "البرز",
      cities: ["کرج", "فردیس", "هشتگرد", "ساوجبلاغ", "نظرآباد"],
    },
    {
      name: "گلستان",
      cities: ["گرگان", "گنبد کاووس", "علی‌آباد", "آق‌قلا", "کردکوی"],
    },
    {
      name: "خراسان شمالی",
      cities: ["بجنورد", "اسفراین", "شیروان", "آشخانه", "گرمه"],
    },
    {
      name: "خراسان جنوبی",
      cities: ["بیرجند", "قائن", "فردوس", "طبس", "نهبندان"],
    },
    { name: "سایر", cities: ["سایر"] },
  ];

  for (const provinceData of provincesData) {
    const province = await prisma.provinces.upsert({
      where: { name: provinceData.name },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: provinceData.name,
      },
    });

    // ایجاد شهرها
    for (const cityName of provinceData.cities) {
      await prisma.cities.upsert({
        where: {
          provinceId_name: {
            provinceId: province.id,
            name: cityName,
          },
        },
        update: {},
        create: {
          id: crypto.randomUUID(),
          name: cityName,
          provinceId: province.id,
        },
      });
    }
  }

  console.log("✅ Provinces and cities created!");

  // ایجاد کاربران نمونه
  const contractorUser = await prisma.users.upsert({
    where: { phone: "09123456789" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      phone: "09123456789",
      role: "contractor",
      updatedAt: new Date(),
    },
  });

  // ایجاد کاربران پیمانکار بیشتر
  const contractorUsers = [];
  for (let i = 1; i <= 15; i++) {
    const user = await prisma.users.upsert({
      where: { phone: `0912345678${i.toString().padStart(1, "0")}` },
      update: {},
      create: {
        id: crypto.randomUUID(),
        phone: `0912345678${i.toString().padStart(1, "0")}`,
        role: "contractor",
        updatedAt: new Date(),
      },
    });
    contractorUsers.push(user);
  }

  const supplierUser1 = await prisma.users.upsert({
    where: { phone: "09111111111" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      phone: "09111111111",
      role: "supplier",
      updatedAt: new Date(),
    },
  });

  const supplierUser2 = await prisma.users.upsert({
    where: { phone: "09222222222" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      phone: "09222222222",
      role: "supplier",
      updatedAt: new Date(),
    },
  });

  // ایجاد کاربران تأمین‌کننده بیشتر
  const supplierUsers = [];
  for (let i = 1; i <= 10; i++) {
    const phoneNumber = `092111111${i.toString().padStart(2, "0")}`;
    const user = await prisma.users.upsert({
      where: { phone: phoneNumber },
      update: {},
      create: {
        id: crypto.randomUUID(),
        phone: phoneNumber,
        role: "supplier",
        isVerified: true,
        updatedAt: new Date(),
      },
    });
    supplierUsers.push(user);

    // ایجاد company برای هر تأمین‌کننده
    await prisma.companies.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        name: `تأمین‌کننده ${i}`,
        logo: null,
        city: "تهران",
        province: "تهران",
        isVerified: true,
        updatedAt: new Date(),
        CompanyCategories: {
          create: [
            { id: crypto.randomUUID(), category: "برق" },
            { id: crypto.randomUUID(), category: "ابزار دقیق" },
          ],
        },
        Products: {
          create: [
            {
              id: crypto.randomUUID(),
              name: `محصول تستی ${i}`,
              category: "برق",
              brand: "تست",
              price: "1000000 تومان",
              updatedAt: new Date(),
            },
          ],
        },
      },
    });
  }

  console.log("✅ Supplier companies created!");

  // ایجاد شرکت‌های تأمین‌کننده
  const company1 = await prisma.companies.upsert({
    where: { userId: supplierUser1.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      userId: supplierUser1.id,
      name: "شرکت تأمین تجهیزات صنعتی پارس",
      logo: null,
      city: "تهران",
      province: "تهران",
      isVerified: true,
      updatedAt: new Date(),
      CompanyCategories: {
        create: [
          { id: crypto.randomUUID(), category: "برق" },
          { id: crypto.randomUUID(), category: "ابزار دقیق" },
        ],
      },
      Products: {
        create: [
          {
            id: crypto.randomUUID(),
            name: "ترانسمیتر فشار",
            category: "ابزار دقیق",
            brand: "Yokogawa",
            updatedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            name: "کابل برق",
            category: "برق",
            brand: "سیمان",
            updatedAt: new Date(),
          },
        ],
      },
    },
  });

  const company2 = await prisma.companies.upsert({
    where: { userId: supplierUser2.id },
    update: {},
    create: {
      id: crypto.randomUUID(),
      userId: supplierUser2.id,
      name: "مهندسی مکانیک خلیج فارس",
      logo: null,
      city: "ماهشهر",
      province: "خوزستان",
      isVerified: true,
      updatedAt: new Date(),
      CompanyCategories: {
        create: [
          { id: crypto.randomUUID(), category: "مکانیک استاتیک" },
          { id: crypto.randomUUID(), category: "مکانیک روتاری" },
        ],
      },
      Products: {
        create: [
          {
            id: crypto.randomUUID(),
            name: "پمپ سانتریفیوژ",
            category: "مکانیک",
            brand: "Grundfos",
            updatedAt: new Date(),
          },
        ],
      },
    },
  });

  // ایجاد مناقصات
  const tender1 = await prisma.tenders.create({
    data: {
      id: crypto.randomUUID(),
      company: "پتروشیمی بندرامام",
      title: "پروژه نصب و راه‌اندازی سیستم برق و ابزار دقیق",
      description: "پروژه کامل نصب و راه‌اندازی سیستم برق و ابزار دقیق",
      tenderNumber: "1403-09-15-012",
      tenderType: "EPC",
      publishDate: new Date("2024-12-06"),
      deadline: new Date("2024-12-16"),
      deliveryLocation: "دفتر مرکزی - ماهشهر",
      estimatedMin: 38000000000,
      estimatedMax: 54000000000,
      updatedAt: new Date(),
      TenderCategories: {
        create: [
          { id: crypto.randomUUID(), category: "برق" },
          { id: crypto.randomUUID(), category: "ابزار دقیق" },
          { id: crypto.randomUUID(), category: "نصب" },
        ],
      },
      TenderRequirements: {
        create: [
          {
            id: crypto.randomUUID(),
            category: "برق",
            item: "کابل، ترمینال، تابلو",
            description: "تجهیزات برق مطابق نقشه",
          },
          {
            id: crypto.randomUUID(),
            category: "ابزار دقیق",
            item: "ترانسمیتر، سنسور",
            description: "تجهیزات ابزار دقیق مطابق نقشه",
          },
        ],
      },
    },
  });

  const tender2 = await prisma.tenders.create({
    data: {
      id: crypto.randomUUID(),
      company: "پتروشیمی اروند",
      title: "تأمین و نصب تجهیزات مکانیکی استاتیک",
      description: "تأمین و نصب تجهیزات مکانیکی استاتیک",
      tenderNumber: "1403-09-14-011",
      tenderType: "EPC",
      publishDate: new Date("2024-12-05"),
      deadline: new Date("2024-12-19"),
      deliveryLocation: "دفتر مرکزی - ماهشهر",
      estimatedMin: 125000000000,
      estimatedMax: 180000000000,
      updatedAt: new Date(),
      TenderCategories: {
        create: [
          { id: crypto.randomUUID(), category: "مکانیک" },
          { id: crypto.randomUUID(), category: "استاتیک" },
          { id: crypto.randomUUID(), category: "EPC" },
        ],
      },
      TenderRequirements: {
        create: [
          {
            id: crypto.randomUUID(),
            category: "مکانیک",
            item: "پمپ سانتریفیوژ",
            quantity: 6,
            description: "نوع پمپ مطابق نقشه",
          },
        ],
      },
    },
  });

  // ایجاد TenderView برای مناقصه‌ها
  console.log("👁️ Creating tender views...");

  // برای tender1: 12 پیمانکار و 8 تأمین‌کننده
  for (let i = 0; i < 12 && i < contractorUsers.length; i++) {
    await prisma.tenderViews.upsert({
      where: {
        tenderId_userId: {
          tenderId: tender1.id,
          userId: contractorUsers[i].id,
        },
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenderId: tender1.id,
        userId: contractorUsers[i].id,
        userRole: "contractor",
      },
    });
  }

  for (let i = 0; i < 8 && i < supplierUsers.length; i++) {
    await prisma.tenderViews.upsert({
      where: {
        tenderId_userId: {
          tenderId: tender1.id,
          userId: supplierUsers[i].id,
        },
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenderId: tender1.id,
        userId: supplierUsers[i].id,
        userRole: "supplier",
      },
    });
  }

  // برای tender2: 18 پیمانکار و 12 تأمین‌کننده
  for (let i = 0; i < 18 && i < contractorUsers.length; i++) {
    await prisma.tenderViews.upsert({
      where: {
        tenderId_userId: {
          tenderId: tender2.id,
          userId: contractorUsers[i].id,
        },
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenderId: tender2.id,
        userId: contractorUsers[i].id,
        userRole: "contractor",
      },
    });
  }

  for (let i = 0; i < 12 && i < supplierUsers.length; i++) {
    await prisma.tenderViews.upsert({
      where: {
        tenderId_userId: {
          tenderId: tender2.id,
          userId: supplierUsers[i].id,
        },
      },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenderId: tender2.id,
        userId: supplierUsers[i].id,
        userRole: "supplier",
      },
    });
  }

  console.log("✅ Tender views created!");

  // ایجاد فریلنسرها
  const freelancers = [
    {
      name: "احمد رضایی",
      phone: "09301234567",
      skill: "برق‌کار صنعتی",
      experience: "۱۰ سال",
      dailyRate: "۲.۵ میلیون",
      location: "ماهشهر",
      available: true,
      rating: 4.8,
      avatar: null,
    },
    {
      name: "محمد کریمی",
      phone: "09301234568",
      skill: "تکنسین ابزاردقیق",
      experience: "۷ سال",
      dailyRate: "۲ میلیون",
      location: "ماهشهر",
      available: true,
      rating: 4.6,
      avatar: null,
    },
    {
      name: "علی احمدی",
      phone: "09301234569",
      skill: "جوشکار صنعتی",
      experience: "۱۲ سال",
      dailyRate: "۳ میلیون",
      location: "تهران",
      available: false,
      rating: 4.9,
      avatar: null,
    },
  ];

  for (const freelancer of freelancers) {
    await prisma.freelancers.upsert({
      where: { phone: freelancer.phone },
      update: {},
      create: {
        ...freelancer,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
    });
  }

  // ایجاد اعلان‌ها
  const notifications = [
    {
      userId: contractorUser.id,
      type: "tender",
      title: "مناقصه جدید",
      message: "مناقصه جدید در حوزه تخصص شما: پروژه برق و ابزار دقیق",
      url: `/tender-details?id=${tender1.id}`,
      tenderId: tender1.id,
      read: false,
    },
    {
      userId: contractorUser.id,
      type: "deadline",
      title: "پایان مهلت نزدیک است",
      message: "مهلت شرکت در مناقصه پتروشیمی بندرامام تا ۴ روز دیگر",
      url: `/tender-details?id=${tender1.id}`,
      tenderId: tender1.id,
      read: false,
    },
  ];

  for (const notification of notifications) {
    await prisma.notifications
      .create({
        data: {
          ...notification,
          id: crypto.randomUUID(),
        },
      })
      .catch(() => {
        // Ignore duplicates
      });
  }

  // ایجاد معرفی شرکت‌های پتروشیمی
  console.log("🏭 Creating company introductions...");

  const companyIntroductions = [
    {
      companyName: "پتروشیمی اروند",
      title: "پتروشیمی اروند - پیشرو در صنعت پتروشیمی ایران",
      description: `پتروشیمی اروند یکی از بزرگ‌ترین و پیشرفته‌ترین مجتمع‌های پتروشیمی در کشور است که در منطقه ویژه اقتصادی اروند واقع شده است. این شرکت با بهره‌گیری از فناوری‌های روز دنیا و نیروی انسانی متخصص، در تولید محصولات پتروشیمی با کیفیت و استانداردهای بین‌المللی فعالیت می‌کند.

پتروشیمی اروند با هدف توسعه پایدار و رعایت استانداردهای زیست‌محیطی، در راستای تحقق اهداف کلان صنعت پتروشیمی کشور گام برمی‌دارد.`,
      history: `تأسیس پتروشیمی اروند به سال ۱۳۸۵ برمی‌گردد و از همان ابتدا با هدف تولید محصولات پتروشیمی با کیفیت و رقابتی در بازارهای داخلی و خارجی فعالیت خود را آغاز کرد.

این شرکت در طول سال‌های فعالیت خود، با اجرای پروژه‌های متعدد و سرمایه‌گذاری در بخش‌های مختلف، به یکی از قطب‌های مهم صنعت پتروشیمی در منطقه تبدیل شده است.`,
      achievements: `• دریافت گواهینامه‌های بین‌المللی ISO 9001, ISO 14001, ISO 45001
• تولید بیش از ۵ میلیون تن محصولات پتروشیمی در سال
• صادرات به بیش از ۳۰ کشور جهان
• ایجاد اشتغال برای بیش از ۵۰۰۰ نفر
• دریافت جایزه بهترین شرکت پتروشیمی در سال ۱۴۰۲`,
      facilities: `• واحدهای تولیدی مجهز به آخرین فناوری‌های روز
• آزمایشگاه‌های پیشرفته کنترل کیفیت
• سیستم‌های ایمنی و HSE مطابق با استانداردهای بین‌المللی
• امکانات رفاهی و ورزشی برای پرسنل
• مرکز تحقیقات و توسعه`,
    },
    {
      companyName: "پتروشیمی بندر امام",
      title: "پتروشیمی بندر امام - بزرگ‌ترین مجتمع پتروشیمی کشور",
      description: `پتروشیمی بندر امام به عنوان بزرگ‌ترین مجتمع پتروشیمی کشور، در منطقه ویژه اقتصادی بندر امام خمینی (ره) واقع شده است. این شرکت با ظرفیت تولید بیش از ۱۰ میلیون تن محصولات پتروشیمی در سال، نقش مهمی در تأمین نیازهای داخلی و صادرات محصولات پتروشیمی دارد.`,
      history: `پتروشیمی بندر امام در سال ۱۳۵۸ تأسیس شد و از همان ابتدا به عنوان یکی از پروژه‌های کلیدی صنعت پتروشیمی کشور شناخته شد. این شرکت با گذشت بیش از ۴ دهه فعالیت، همواره در خط مقدم توسعه صنعت پتروشیمی کشور قرار داشته است.`,
      achievements: `• بزرگ‌ترین مجتمع پتروشیمی کشور
• تولید بیش از ۱۰ میلیون تن محصول در سال
• صادرات به بیش از ۵۰ کشور جهان
• ایجاد اشتغال برای بیش از ۱۵۰۰۰ نفر
• دریافت گواهینامه‌های متعدد بین‌المللی`,
      facilities: `• ۱۵ واحد تولیدی مختلف
• بندر اختصاصی برای صادرات
• سیستم‌های پیشرفته کنترل و مانیتورینگ
• مراکز تحقیقاتی و توسعه
• امکانات کامل HSE`,
    },
    {
      companyName: "پتروشیمی پارس",
      title: "پتروشیمی پارس - پیشگام در تولید اتیلن و پلی‌اتیلن",
      description: `پتروشیمی پارس به عنوان یکی از بزرگ‌ترین تولیدکنندگان اتیلن و پلی‌اتیلن در خاورمیانه، در منطقه عسلویه واقع شده است. این شرکت با بهره‌گیری از فناوری‌های پیشرفته و نیروی انسانی متخصص، در تولید محصولات با کیفیت و رقابتی فعالیت می‌کند.`,
      history: `پتروشیمی پارس در سال ۱۳۷۸ تأسیس شد و با هدف تولید محصولات پایه پتروشیمی برای تأمین نیاز صنایع پایین‌دستی، فعالیت خود را آغاز کرد. این شرکت در طول سال‌های فعالیت خود، همواره در خط مقدم تولید محصولات پتروشیمی با کیفیت قرار داشته است.`,
      achievements: `• بزرگ‌ترین تولیدکننده اتیلن در خاورمیانه
• تولید بیش از ۳ میلیون تن محصول در سال
• صادرات به کشورهای مختلف منطقه
• دریافت گواهینامه‌های بین‌المللی
• ایجاد اشتغال برای بیش از ۳۰۰۰ نفر`,
      facilities: `• واحدهای تولیدی اتیلن و پلی‌اتیلن
• سیستم‌های پیشرفته کنترل فرآیند
• آزمایشگاه‌های کنترل کیفیت
• امکانات ایمنی و HSE
• مرکز تحقیقات و توسعه`,
    },
  ];

  for (const intro of companyIntroductions) {
    await prisma.companyIntroductions.upsert({
      where: { companyName: intro.companyName },
      update: {
        title: intro.title,
        description: intro.description,
        history: intro.history,
        achievements: intro.achievements,
        facilities: intro.facilities,
      },
      create: {
        ...intro,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
    });
  }

  console.log("✅ Company introductions created!");

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
