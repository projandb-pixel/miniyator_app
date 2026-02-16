import { prisma } from '../lib/prisma'

async function testPriceInquiry() {
  try {
    console.log('Connecting to database...')
    
    // دریافت یک contractor و supplier برای تست
    const contractor = await prisma.companies.findFirst({
      where: {
        Users: {
          role: 'contractor',
        },
      },
      include: {
        Users: true,
      },
    })
    
    const supplier = await prisma.companies.findFirst({
      where: {
        Users: {
          role: 'supplier',
        },
      },
      include: {
        Users: true,
      },
    })
    
    if (!contractor) {
      console.error('No contractor found in database')
      process.exit(1)
    }
    
    if (!supplier) {
      console.error('No supplier found in database')
      process.exit(1)
    }
    
    console.log('Contractor:', contractor.name)
    console.log('Supplier:', supplier.name)
    
    // بررسی ساختار جدول PriceInquiries
    console.log('\nChecking PriceInquiries table structure...')
    try {
      const columns = await prisma.$queryRaw<Array<{COLUMN_NAME: string, DATA_TYPE: string}>>`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'PriceInquiries'
        ORDER BY ORDINAL_POSITION
      `
      console.log('PriceInquiries columns:')
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`)
      })
    } catch (error) {
      console.error('Error checking table structure:', error)
    }
    
    // تلاش برای ایجاد استعلام با Prisma Client
    console.log('\nAttempting to create inquiry with Prisma Client...')
    const inquiryId = crypto.randomUUID()
    const now = new Date()
    
    try {
      const inquiry = await prisma.priceInquiries.create({
        data: {
          id: inquiryId,
          contractorId: contractor.id,
          category: 'مکانیک (استاتیک)',
          product: 'تست محصول',
          quantity: '10 عدد',
          deliveryTime: '1week',
          description: 'این یک استعلام تستی است',
          status: 'pending',
          updatedAt: now,
        },
      })
      console.log('✅ Inquiry created successfully with Prisma Client:', inquiry.id)
      return inquiry
    } catch (prismaError: any) {
      console.error('❌ Error with Prisma Client:', prismaError.message)
      
      // اگر خطا مربوط به tenderId است، از raw query استفاده می‌کنیم
      if (prismaError.message?.includes('tenderId') || prismaError.message?.includes('column')) {
        console.log('\nAttempting to create inquiry with raw SQL query...')
        
        try {
          await prisma.$executeRaw`
            INSERT INTO PriceInquiries (id, contractorId, category, product, quantity, deliveryTime, description, status, createdAt, updatedAt)
            VALUES (${inquiryId}, ${contractor.id}, ${'مکانیک (استاتیک)'}, ${'تست محصول'}, ${'10 عدد'}, ${'1week'}, ${'این یک استعلام تستی است'}, 'pending', ${now}, ${now})
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
          
          if (inquiryResult && inquiryResult.length > 0) {
            const inquiry = inquiryResult[0]
            console.log('✅ Inquiry created successfully with raw SQL:', inquiry.id)
            return inquiry
          } else {
            console.error('❌ Inquiry was created but could not be retrieved')
          }
        } catch (rawError: any) {
          console.error('❌ Error with raw SQL:', rawError.message)
          throw rawError
        }
      } else {
        throw prismaError
      }
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testPriceInquiry()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })

