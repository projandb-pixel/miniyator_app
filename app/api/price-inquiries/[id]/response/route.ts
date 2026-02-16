import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - پاسخ دادن به یک استعلام
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { supplierId, price, deliveryTime, notes } = body

    if (!supplierId || !price) {
      return NextResponse.json(
        { error: 'Supplier ID and price are required' },
        { status: 400 }
      )
    }

    // بررسی اینکه آیا قبلاً پاسخ داده شده
    const existingResponse = await prisma.priceInquiryResponses.findFirst({
      where: {
        inquiryId: id,
        supplierId: supplierId,
      },
    })

    if (existingResponse) {
      return NextResponse.json(
        { error: 'You have already responded to this inquiry' },
        { status: 400 }
      )
    }

    // ایجاد پاسخ
    const response = await prisma.priceInquiryResponses.create({
      data: {
        id: crypto.randomUUID(),
        inquiryId: id,
        supplierId: supplierId,
        price,
        deliveryTime: deliveryTime || null,
        notes: notes || null,
      },
    })

    // دریافت اطلاعات استعلام برای notification
    const inquiry = await prisma.priceInquiries.findUnique({
      where: { id },
      include: {
        Companies: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    })

    // ایجاد notification برای پیمانکار
    if (inquiry && inquiry.Companies.userId) {
      const supplier = await prisma.companies.findUnique({
        where: { id: supplierId },
        select: { name: true },
      })

      await prisma.notifications.create({
        data: {
          id: crypto.randomUUID(),
          userId: inquiry.Companies.userId,
          type: 'price_inquiry_response',
          title: 'پاسخ به استعلام',
          message: `${supplier?.name || 'یک تأمین‌کننده'} به استعلام شما پاسخ داد`,
          url: `/my-inquiries`,
        },
      })
    }

    return NextResponse.json({ response }, { status: 201 })
  } catch (error) {
    console.error('Error creating inquiry response:', error)
    return NextResponse.json(
      { error: 'Failed to create inquiry response' },
      { status: 500 }
    )
  }
}






