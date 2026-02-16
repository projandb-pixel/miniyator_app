import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bufferToBase64 } from '@/lib/file-utils'

// GET - دریافت جزئیات یک مناقصه
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tender = await prisma.tenders.findUnique({
      where: { id },
      include: {
        TenderCategories: true,
        TenderRequirements: true,
        TenderParticipations: {
          include: {
            Companies: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            Likes: true,
            Saves: true,
            Comments: true,
          },
        },
      },
    })

    if (!tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      )
    }

    // دریافت تعداد views برای پیمانکاران و تأمین‌کنندگان
    let contractorViews = 0;
    let supplierViews = 0;
    try {
      const contractorViewsData = await prisma.tenderViews.findMany({
        where: { tenderId: id, userRole: 'contractor' },
        select: { userId: true },
      });
      const uniqueContractorUserIds = new Set(contractorViewsData.map(v => v.userId));
      contractorViews = uniqueContractorUserIds.size;

      const supplierViewsData = await prisma.tenderViews.findMany({
        where: { tenderId: id, userRole: 'supplier' },
        select: { userId: true },
      });
      const uniqueSupplierUserIds = new Set(supplierViewsData.map(v => v.userId));
      supplierViews = uniqueSupplierUserIds.size;
    } catch (error) {
      console.error('Error counting views:', error);
    }

    // دریافت تعداد likes برای پیمانکاران و تأمین‌کنندگان
    let contractorLikes = 0;
    let supplierLikes = 0;
    try {
      const allLikes = await prisma.likes.findMany({
        where: { tenderId: id },
        include: {
          Users: {
            select: {
              role: true,
            },
          },
        },
      });
      
      contractorLikes = allLikes.filter(like => like.Users.role === 'contractor').length;
      supplierLikes = allLikes.filter(like => like.Users.role === 'supplier').length;
    } catch (error) {
      console.error('Error counting likes by role:', error);
    }

    // بررسی وضعیت اعلام آمادگی و ذخیره کاربر (اگر userId ارسال شده باشد)
    let userRegistered = false;
    let userSaved = false;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      try {
        const user = await prisma.users.findUnique({
          where: { id: userId },
          include: { Companies: true },
        });

        if (user && user.Companies) {
          const [participation, save] = await Promise.all([
            prisma.tenderParticipations.findUnique({
              where: {
                tenderId_companyId: {
                  tenderId: id,
                  companyId: user.Companies.id,
                },
              },
            }),
            prisma.saves.findUnique({
              where: {
                userId_tenderId: {
                  userId,
                  tenderId: id,
                },
              },
            }),
          ]);
          userRegistered = !!participation;
          userSaved = !!save;
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    }

    // Convert images blob to comma-separated string
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

    return NextResponse.json({ 
      tender: {
        ...tender,
        images: imagesString,
        contractorViews,
        supplierViews,
        contractorLikes,
        supplierLikes,
        userRegistered,
        userSaved,
      }
    })
  } catch (error) {
    console.error('Error fetching tender:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tender' },
      { status: 500 }
    )
  }
}

