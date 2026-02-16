import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت استعلام‌های دریافتی یک تأمین‌کننده
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    // دریافت تمام استعلام‌هایی که به این تأمین‌کننده ارسال شده‌اند
    // این کار از طریق notification انجام می‌شود، اما بهتر است مستقیماً از PriceInquiry استفاده کنیم
    // برای این کار باید لیست استعلام‌ها را بگیریم و بررسی کنیم که آیا این تأمین‌کننده در لیست supplierIds بوده یا نه
    
    // راه حل بهتر: از notification استفاده کنیم
    const supplier = await prisma.companies.findUnique({
      where: { id: supplierId },
      select: { userId: true },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // دریافت notification های مربوط به استعلام قیمت
    const notifications = await prisma.notifications.findMany({
      where: {
        userId: supplier.userId,
        type: 'price_inquiry',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // استخراج inquiryId از URL notification
    const inquiryIds = notifications
      .map(n => {
        const match = n.url?.match(/\/price-inquiries\/([^\/]+)/)
        return match ? match[1] : null
      })
      .filter((id): id is string => id !== null)

    if (inquiryIds.length === 0) {
      return NextResponse.json({ inquiries: [] })
    }

    // دریافت استعلام‌ها
    const inquiries = await prisma.priceInquiries.findMany({
      where: {
        id: {
          in: inquiryIds,
        },
      },
      include: {
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        PriceInquiryResponses: {
          where: {
            supplierId: supplierId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Error fetching received inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch received inquiries' },
      { status: 500 }
    )
  }
}

