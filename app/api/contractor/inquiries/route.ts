import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت استعلام‌های قیمت
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractorId')

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      )
    }

    // استفاده از raw query برای دریافت استعلام‌ها (چون tenderId در دیتابیس وجود ندارد)
    const inquiries = await prisma.$queryRaw<Array<{
      id: string
      contractorId: string
      category: string
      product: string
      quantity: string
      deliveryTime: string
      description: string | null
      status: string
      createdAt: Date
      updatedAt: Date
    }>>`
      SELECT id, contractorId, category, product, quantity, deliveryTime, description, status, createdAt, updatedAt
      FROM PriceInquiries
      WHERE contractorId = ${contractorId}
      ORDER BY createdAt DESC
    `

    // دریافت responses برای هر inquiry
    const inquiriesWithResponses = await Promise.all(
      inquiries.map(async (inquiry) => {
        // دریافت responses با raw query
        const responses = await prisma.$queryRaw<Array<{
          id: string
          inquiryId: string
          supplierId: string
          price: string
          deliveryTime: string | null
          notes: string | null
          createdAt: Date
        }>>`
          SELECT id, inquiryId, supplierId, price, deliveryTime, notes, createdAt
          FROM PriceInquiryResponses
          WHERE inquiryId = ${inquiry.id}
        `

        // افزودن اطلاعات supplier به هر response
        const responsesWithSupplier = await Promise.all(
          responses.map(async (response) => {
            const supplier = await prisma.companies.findUnique({
              where: { id: response.supplierId },
              select: { id: true, name: true, logo: true },
            })
            
            // تبدیل logo به base64 string اگر Buffer است
            let logoString: string | null = null
            if (supplier?.logo) {
              try {
                if (Buffer.isBuffer(supplier.logo)) {
                  const { bufferToBase64 } = await import('@/lib/file-utils')
                  logoString = bufferToBase64(supplier.logo)
                } else if (typeof supplier.logo === 'string') {
                  logoString = supplier.logo
                }
              } catch (logoError) {
                console.error('Error converting logo to base64:', logoError)
                logoString = null
              }
            }
            
            return {
              id: String(response.id),
              inquiryId: String(response.inquiryId),
              supplierId: String(response.supplierId),
              price: String(response.price),
              deliveryTime: response.deliveryTime ? String(response.deliveryTime) : null,
              notes: response.notes ? String(response.notes) : null,
              createdAt: response.createdAt instanceof Date ? response.createdAt.toISOString() : String(response.createdAt),
              supplier: supplier ? {
                id: String(supplier.id),
                name: String(supplier.name),
                logo: logoString,
              } : null,
            }
          })
        )

        return {
          id: String(inquiry.id),
          contractorId: String(inquiry.contractorId),
          category: String(inquiry.category),
          product: String(inquiry.product),
          quantity: String(inquiry.quantity),
          deliveryTime: String(inquiry.deliveryTime),
          description: inquiry.description ? String(inquiry.description) : null,
          status: String(inquiry.status),
          createdAt: inquiry.createdAt instanceof Date ? inquiry.createdAt.toISOString() : String(inquiry.createdAt),
          updatedAt: inquiry.updatedAt instanceof Date ? inquiry.updatedAt.toISOString() : String(inquiry.updatedAt),
          responses: responsesWithSupplier,
        }
      })
    )

    return NextResponse.json({ inquiries: inquiriesWithResponses })
  } catch (error) {
    console.error('Error fetching price inquiries:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { 
        error: 'Failed to fetch price inquiries',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد استعلام قیمت جدید
export async function POST(request: Request) {
  let body: any = null
  try {
    body = await request.json()
    console.log('Received request body:', body)
    const { contractorId, tenderId, category, product, quantity, deliveryTime, description, supplierIds } = body
    console.log('Parsed fields:', { contractorId, tenderId, category, product, quantity, deliveryTime, description, supplierIds })

    if (!contractorId || !category || !product || !quantity || !deliveryTime) {
      return NextResponse.json(
        { error: 'تمام فیلدهای الزامی را پر کنید' },
        { status: 400 }
      )
    }

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json(
        { error: 'حداقل یک تأمین‌کننده انتخاب کنید' },
        { status: 400 }
      )
    }

    // بررسی وجود contractorId در دیتابیس
    const contractorExists = await prisma.companies.findUnique({
      where: { id: contractorId },
      select: { id: true },
    })
    if (!contractorExists) {
      return NextResponse.json(
        { error: 'پیمانکار یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی و تبدیل tenderId به null اگر خالی است یا در دیتابیس وجود ندارد
    let finalTenderId: string | null = null
    console.log('Checking tenderId:', { tenderId, type: typeof tenderId })
    if (tenderId && typeof tenderId === 'string' && tenderId.trim() !== '') {
      try {
        // بررسی وجود tender در دیتابیس
        const tender = await prisma.tenders.findUnique({
          where: { id: tenderId },
          select: { id: true },
        })
        console.log('Tender lookup result:', tender ? 'found' : 'not found')
        if (tender) {
          finalTenderId = tenderId
        } else {
          console.warn(`Tender with id ${tenderId} not found, setting to null`)
          finalTenderId = null
        }
      } catch (tenderError) {
        console.warn(`Error checking tender ${tenderId}:`, tenderError)
        // در صورت خطا، tenderId را null می‌کنیم
        finalTenderId = null
      }
    } else {
      console.log('TenderId is empty or invalid, setting to null')
    }
    console.log('Final tenderId:', finalTenderId)

    // ایجاد استعلام
    // استفاده از raw query برای جلوگیری از مشکل با tenderId که در دیتابیس وجود ندارد
    console.log('Creating inquiry with data:', {
      contractorId,
      tenderId: finalTenderId,
      category,
      product,
      quantity,
      deliveryTime,
      description: description || null,
    })
    
    let inquiry
    try {
      // استفاده از Prisma create با حذف tenderId اگر null است
      const createData: any = {
        id: crypto.randomUUID(),
        contractorId,
        category,
        product,
        quantity,
        deliveryTime,
        status: 'pending',
        updatedAt: new Date(),
      }
      
      // فقط اگر description وجود دارد، آن را اضافه می‌کنیم
      if (description && description.trim() !== '') {
        createData.description = description
      }
      
      // تلاش برای ایجاد با tenderId
      if (finalTenderId) {
        createData.tenderId = finalTenderId
      }
      
      inquiry = await prisma.priceInquiries.create({
        data: createData,
      })
    } catch (createError: any) {
      // اگر خطا مربوط به tenderId است، از raw query استفاده می‌کنیم
      if (createError?.message?.includes('tenderId') || createError?.message?.includes('tender') || createError?.message?.includes('column')) {
        console.warn('tenderId column does not exist in database, using raw query')
        
        // استفاده از raw query برای ایجاد استعلام بدون tenderId
        const inquiryId = crypto.randomUUID()
        const now = new Date()
        const descriptionValue = description && description.trim() !== '' ? description : null
        
        // استفاده از Prisma.$executeRaw با template literal برای SQL Server
        await prisma.$executeRaw`
          INSERT INTO PriceInquiries (id, contractorId, category, product, quantity, deliveryTime, description, status, createdAt, updatedAt)
          VALUES (${inquiryId}, ${contractorId}, ${category}, ${product}, ${quantity}, ${deliveryTime}, ${descriptionValue}, 'pending', ${now}, ${now})
        `
        
        // استفاده از raw query برای دریافت inquiry (چون findUnique هم خطا می‌دهد)
        const inquiryResult = await prisma.$queryRaw<Array<{
          id: string
          contractorId: string
          category: string
          product: string
          quantity: string
          deliveryTime: string
          description: string | null
          status: string
          createdAt: Date
          updatedAt: Date
        }>>`
          SELECT id, contractorId, category, product, quantity, deliveryTime, description, status, createdAt, updatedAt
          FROM PriceInquiries
          WHERE id = ${inquiryId}
        `
        
        if (!inquiryResult || inquiryResult.length === 0) {
          throw new Error('Failed to create inquiry using raw query')
        }
        
        // تبدیل به فرمت مورد انتظار
        inquiry = {
          id: inquiryResult[0].id,
          contractorId: inquiryResult[0].contractorId,
          category: inquiryResult[0].category,
          product: inquiryResult[0].product,
          quantity: inquiryResult[0].quantity,
          deliveryTime: inquiryResult[0].deliveryTime,
          description: inquiryResult[0].description,
          status: inquiryResult[0].status,
          createdAt: inquiryResult[0].createdAt,
          updatedAt: inquiryResult[0].updatedAt,
        } as any
        console.log('Inquiry created with raw query, id:', inquiry.id)
      } else {
        throw createError
      }
    }
    console.log('Inquiry created successfully:', inquiry.id)
    console.log('Inquiry object keys:', Object.keys(inquiry))
    console.log('Inquiry object:', JSON.stringify(inquiry, null, 2))
    console.log('Inquiry object:', JSON.stringify(inquiry, null, 2))

    // دریافت اطلاعات پیمانکار برای notification
    const contractor = await prisma.companies.findUnique({
      where: { id: contractorId },
      select: { name: true, userId: true },
    })

    console.log('Contractor info:', contractor?.name, 'userId:', contractor?.userId)
    console.log('Supplier IDs to notify:', supplierIds)

    // ایجاد notification برای هر تأمین‌کننده
    const notifications = []
    try {
      for (const supplierId of supplierIds) {
        try {
          // دریافت userId از companyId
          const supplier = await prisma.companies.findUnique({
            where: { id: supplierId },
            select: { userId: true, name: true },
          })

          console.log(`Supplier ${supplierId}:`, supplier ? `userId: ${supplier.userId}, name: ${supplier.name}` : 'not found')

          if (supplier && supplier.userId) {
            const notificationUrl = `/price-inquiries/${inquiry.id}`
            console.log(`Creating notification for supplier ${supplierId} (userId: ${supplier.userId}) with URL: ${notificationUrl}`)
            
            const notification = await prisma.notifications.create({
              data: {
                id: crypto.randomUUID(),
                userId: supplier.userId,
                type: 'price_inquiry',
                title: 'استعلام قیمت جدید',
                message: `${contractor?.name || 'یک پیمانکار'} برای ${product} استعلام قیمت ارسال کرده است`,
                url: notificationUrl,
              },
            })
            console.log(`Notification created successfully: ${notification.id} for userId: ${supplier.userId}`)
            notifications.push(notification)
          } else {
            console.warn(`Supplier ${supplierId} not found or has no userId`)
          }
        } catch (supplierError) {
          console.error(`Error creating notification for supplier ${supplierId}:`, supplierError)
          // ادامه می‌دهیم حتی اگر notification ایجاد نشود
        }
      }

      // ایجاد notification برای پیمانکار
      if (contractor && contractor.userId) {
        try {
          await prisma.notifications.create({
            data: {
              id: crypto.randomUUID(),
              userId: contractor.userId,
              type: 'price_inquiry_sent',
              title: 'استعلام ارسال شد',
              message: `استعلام شما برای ${product} به ${supplierIds.length} تأمین‌کننده ارسال شد`,
              url: `/contractor/inquiries`,
            },
          })
        } catch (contractorNotificationError) {
          console.error('Error creating notification for contractor:', contractorNotificationError)
          // ادامه می‌دهیم حتی اگر notification ایجاد نشود
        }
      }
    } catch (notificationError) {
      console.error('Error in notification creation:', notificationError)
      // ادامه می‌دهیم حتی اگر notification ایجاد نشود
    }

    return NextResponse.json({ 
      inquiry,
      notificationsCount: notifications.length 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating price inquiry:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : String(error)
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      body: body
    })
    return NextResponse.json(
      { 
        error: 'Failed to create price inquiry',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}






