import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bufferToBase64, base64ToBuffer } from '@/lib/file-utils'

// GET - دریافت لیست مناقصات
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10)
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10)
    const company = searchParams.get('company')
    const petrochemicalsParam = searchParams.get('petrochemicals')
    const petrochemicals = petrochemicalsParam 
      ? petrochemicalsParam.split(',').map(p => decodeURIComponent(p)).filter(Boolean)
      : []
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const userId = searchParams.get('userId')
    const saved = searchParams.get('saved') === 'true'

    const where: any = {}
    
    // فیلتر پتروشیمی‌ها یا company
    if (petrochemicals.length > 0) {
      where.company = {
        in: petrochemicals
      }
    } else if (company) {
      where.company = company
    }
    
    // فیلتر محدوده قیمت
    if (minPrice || maxPrice) {
      const priceConditions: any[] = []
      
      if (minPrice && maxPrice) {
        // هر دو حد مشخص شده - مناقصه باید در محدوده باشد
        priceConditions.push({
          OR: [
            // مناقصه‌هایی که estimatedMin در محدوده است
            {
              AND: [
                { estimatedMin: { gte: Number.parseInt(minPrice, 10) } },
                { estimatedMin: { lte: Number.parseInt(maxPrice, 10) } }
              ]
            },
            // مناقصه‌هایی که estimatedMax در محدوده است
            {
              AND: [
                { estimatedMax: { gte: Number.parseInt(minPrice, 10) } },
                { estimatedMax: { lte: Number.parseInt(maxPrice, 10) } }
              ]
            },
            // مناقصه‌هایی که محدوده آن شامل محدوده فیلتر می‌شود
            {
              AND: [
                { estimatedMin: { lte: Number.parseInt(minPrice, 10) } },
                { estimatedMax: { gte: Number.parseInt(maxPrice, 10) } }
              ]
            }
          ]
        })
      } else if (minPrice) {
        // فقط حداقل - estimatedMax باید بیشتر از minPrice باشد
        priceConditions.push({
          OR: [
            { estimatedMin: { gte: Number.parseInt(minPrice, 10) } },
            { estimatedMax: { gte: Number.parseInt(minPrice, 10) } }
          ]
        })
      } else if (maxPrice) {
        // فقط حداکثر - estimatedMin باید کمتر از maxPrice باشد
        priceConditions.push({
          OR: [
            { estimatedMin: { lte: Number.parseInt(maxPrice, 10) } },
            { estimatedMax: { lte: Number.parseInt(maxPrice, 10) } }
          ]
        })
      }
      
      // ترکیب فیلتر قیمت با فیلترهای دیگر
      if (priceConditions.length > 0) {
        const andConditions: any[] = []
        
        // اضافه کردن فیلتر company اگر وجود دارد
        if (where.company) {
          andConditions.push({ company: where.company })
          delete where.company
        }
        
        // اضافه کردن فیلترهای قیمت
        andConditions.push(...priceConditions)
        
        where.AND = andConditions
      }
    }

    // اگر فیلتر saved فعال است، فقط مناقصه‌های ذخیره شده توسط کاربر را برگردان
    let tenders;
    if (saved && userId) {
      const savedTenders = await prisma.saves.findMany({
        where: { userId },
        include: {
          Tenders: {
            include: {
              TenderCategories: true,
              TenderRequirements: true,
              _count: {
                select: {
                  Likes: true,
                  Saves: true,
                  Comments: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`Found ${savedTenders.length} saved tenders for user ${userId}`);
      
      tenders = savedTenders
        .filter(save => save.Tenders !== null) // فیلتر کردن مناقصه‌های حذف شده
        .map(save => ({
          ...save.Tenders,
          savedAt: save.createdAt.toISOString(),
        }));
      
      console.log(`Returning ${tenders.length} valid saved tenders`);
    } else {
      tenders = await prisma.tenders.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          TenderCategories: true,
          TenderRequirements: true,
          _count: {
            select: {
              Likes: true,
              Saves: true,
              Comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    console.log(`Found ${tenders.length} tenders in database`)

    // محاسبه تعداد views برای هر مناقصه بر اساس نقش کاربر
    // برای saved tenders هم باید views محاسبه شود
    let tendersWithViews = tenders;
    
    // بررسی وجود model TenderViews در Prisma Client
    if (prisma.tenderViews) {
      tendersWithViews = await Promise.all(
        tenders.map(async (tender) => {
          try {
            const contractorViews = await prisma.tenderViews.count({
              where: {
                tenderId: tender.id,
                userRole: 'contractor',
              },
            })

            const supplierViews = await prisma.tenderViews.count({
              where: {
                tenderId: tender.id,
                userRole: 'supplier',
              },
            })

            return {
              ...tender,
              contractorViews,
              supplierViews,
            }
          } catch (error) {
            // اگر خطا داد، بدون views برگردان
            return {
              ...tender,
              contractorViews: 0,
              supplierViews: 0,
            }
          }
        })
      )
    } else {
      // اگر TenderView وجود ندارد، فقط 0 برگردان
      tendersWithViews = tenders.map((tender) => ({
        ...tender,
        contractorViews: 0,
        supplierViews: 0,
      }))
    }

    // Convert images blob to comma-separated string for each tender
    // و اضافه کردن userLiked و userSaved
    const tendersWithImages = await Promise.all(
      tendersWithViews.map(async (tender: any) => {
        let imagesString: string | null = null;
        if (tender.images) {
          try {
            const imagesJson = JSON.parse(Buffer.from(tender.images).toString('utf-8'));
            if (Array.isArray(imagesJson)) {
              imagesString = imagesJson.join(',');
            } else {
              // Fallback: convert blob to single base64 string
              imagesString = bufferToBase64(Buffer.from(tender.images));
            }
          } catch {
            // If parsing fails, convert blob to base64
            imagesString = bufferToBase64(tender.images as Buffer);
          }
        }

        // بررسی userLiked و userSaved اگر userId وجود دارد
        let userLiked = false;
        let userSaved = false;
        if (userId) {
          try {
            const [liked, saved] = await Promise.all([
              prisma.likes.findUnique({
                where: {
                  userId_tenderId: {
                    userId,
                    tenderId: tender.id,
                  },
                },
              }),
              prisma.saves.findUnique({
                where: {
                  userId_tenderId: {
                    userId,
                    tenderId: tender.id,
                  },
                },
              }),
            ]);
            userLiked = !!liked;
            userSaved = !!saved;
          } catch (error) {
            console.error('Error checking user status:', error);
          }
        }

        // حفظ savedAt اگر وجود دارد (برای saved tenders)
        const result: any = {
          ...tender,
          images: imagesString,
          userLiked,
          userSaved,
          userFollowing: false, // TODO: پیاده‌سازی follow
        };
        
        // حفظ _count برای شمارنده‌ها
        if (tender._count) {
          result._count = tender._count;
        }
        
        // اگر savedAt وجود دارد (از saved tenders)، آن را حفظ کن
        if (tender.savedAt) {
          result.savedAt = typeof tender.savedAt === 'string' ? tender.savedAt : tender.savedAt.toISOString();
        }
        
        return result;
      })
    );

    console.log(`Returning ${tendersWithImages.length} tenders with views`)
    return NextResponse.json({ tenders: tendersWithImages })
  } catch (error: any) {
    console.error('Error fetching tenders:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch tenders', details: error?.stack },
      { status: 500 }
    )
  }
}

// POST - ایجاد مناقصه جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      company,
      title,
      description,
      tenderNumber,
      tenderType,
      publishDate,
      deadline,
      deliveryLocation,
      categories,
      requirements,
      estimatedMin,
      estimatedMax,
      images,
    } = body

    // بررسی دسترسی: فقط شماره 09128473158 می‌تواند مناقصه ایجاد کند
    const ALLOWED_PHONE = "09128473158";
    
    if (userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { phone: true },
      });

      if (!user || user.phone !== ALLOWED_PHONE) {
        return NextResponse.json(
          { error: "شما مجاز به ایجاد مناقصه نیستید" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Normalize requirements: quantity must be int (schema expects Int?)
    const normalizedRequirements =
      requirements?.map((req: any) => ({
        ...req,
        quantity:
          req?.quantity !== undefined && req.quantity !== null && req.quantity !== ""
            ? Number.parseInt(req.quantity as any, 10)
            : null,
      })) || [];

    const tender = await prisma.tenders.create({
      data: {
        id: crypto.randomUUID(),
        company,
        title,
        description,
        tenderNumber,
        tenderType,
        publishDate: new Date(publishDate),
        deadline: new Date(deadline),
        deliveryLocation,
        estimatedMin,
        estimatedMax,
        images: images && Array.isArray(images) && images.length > 0
          ? Buffer.from(JSON.stringify(images))
          : images && typeof images === 'string' && images.includes(',')
          ? Buffer.from(JSON.stringify(images.split(',').map((img: string) => img.trim())))
          : null,
        updatedAt: new Date(),
        TenderCategories: {
          create: categories?.map((cat: string) => ({ 
            id: crypto.randomUUID(),
            category: cat 
          })) || [],
        },
        TenderRequirements: {
          create: normalizedRequirements.map((req: any) => ({
            id: crypto.randomUUID(),
            ...req,
          })),
        },
      },
      include: {
        TenderCategories: true,
        TenderRequirements: true,
      },
    })

    return NextResponse.json({ tender }, { status: 201 })
  } catch (error) {
    console.error('Error creating tender:', error)
    return NextResponse.json(
      { error: 'Failed to create tender' },
      { status: 500 }
    )
  }
}
