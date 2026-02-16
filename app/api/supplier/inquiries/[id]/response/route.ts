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

    let response
    if (existingResponse) {
      // اگر پاسخ وجود دارد، آن را به‌روزرسانی می‌کنیم
      response = await prisma.priceInquiryResponses.update({
        where: {
          id: existingResponse.id,
        },
        data: {
          price,
          deliveryTime: deliveryTime || null,
          notes: notes || null,
        },
      })
      console.log('Updated existing response:', response.id)
    } else {
      // ایجاد پاسخ جدید
      response = await prisma.priceInquiryResponses.create({
        data: {
          id: crypto.randomUUID(),
          inquiryId: id,
          supplierId: supplierId,
          price,
          deliveryTime: deliveryTime || null,
          notes: notes || null,
        },
      })
      console.log('Created new response:', response.id)
    }

    // دریافت اطلاعات استعلام برای notification
    try {
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
      if (inquiry && inquiry.Companies && inquiry.Companies.userId) {
        try {
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
              url: `/contractor/inquiries`,
            },
          })
          console.log('Notification created successfully for contractor')
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError)
          // ادامه می‌دهیم حتی اگر notification ایجاد نشود
        }
      } else {
        console.warn('Inquiry or Companies not found, skipping notification')
      }
    } catch (inquiryError) {
      console.error('Error fetching inquiry for notification:', inquiryError)
      // ادامه می‌دهیم حتی اگر inquiry fetch نشود
    }

    return NextResponse.json({ 
      response: {
        id: response.id,
        inquiryId: response.inquiryId,
        supplierId: response.supplierId,
        price: response.price,
        deliveryTime: response.deliveryTime,
        notes: response.notes,
        createdAt: response.createdAt instanceof Date ? response.createdAt.toISOString() : String(response.createdAt),
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating inquiry response:', error)
    return NextResponse.json(
      { error: 'Failed to create inquiry response' },
      { status: 500 }
    )
  }
}






