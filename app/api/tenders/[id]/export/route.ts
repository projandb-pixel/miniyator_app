import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force node runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - دریافت فایل Excel اطلاعات مناقصه
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenderId } = await params
    
    // دریافت اطلاعات مناقصه
    const tender = await prisma.tenders.findUnique({
      where: { id: tenderId },
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

    // آماده‌سازی داده‌ها برای Excel
    const data = [
      ['اطلاعات مناقصه', ''],
      ['عنوان', tender.title],
      ['شرکت کارفرما', tender.company],
      ['شماره مناقصه', tender.tenderNumber || 'نامشخص'],
      ['نوع مناقصه', tender.tenderType || 'نامشخص'],
      ['تاریخ انتشار', new Date(tender.publishDate).toLocaleDateString('fa-IR')],
      ['مهلت ارسال', tender.deadline ? new Date(tender.deadline).toLocaleDateString('fa-IR') : 'نامشخص'],
      ['مهلت تحویل اسناد', tender.documentDeliveryDeadline ? new Date(tender.documentDeliveryDeadline).toLocaleDateString('fa-IR') : 'نامشخص'],
      ['محل تحویل', tender.deliveryLocation || 'نامشخص'],
      ['وضعیت', tender.status],
      ['فاز', tender.phase || 'نامشخص'],
      ['حداقل قیمت برآورد', tender.estimatedMin ? `${(tender.estimatedMin / 1000000000).toFixed(2)} میلیارد تومان` : 'نامشخص'],
      ['حداکثر قیمت برآورد', tender.estimatedMax ? `${(tender.estimatedMax / 1000000000).toFixed(2)} میلیارد تومان` : 'نامشخص'],
      ['توضیحات', tender.description || 'ندارد'],
      ['', ''],
      ['آمار', ''],
      ['تعداد لایک‌ها', tender._count.Likes],
      ['تعداد ذخیره‌ها', tender._count.Saves],
      ['تعداد کامنت‌ها', tender._count.Comments],
      ['تعداد شرکت‌های ثبت‌نام شده', tender.TenderParticipations.length],
      ['', ''],
    ]

    // اضافه کردن دسته‌بندی‌ها
    if (tender.TenderCategories.length > 0) {
      data.push(['دسته‌بندی‌های مناقصه', ''])
      tender.TenderCategories.forEach((cat, idx) => {
        data.push([`دسته‌بندی ${idx + 1}`, cat.category])
      })
      data.push(['', ''])
    }

    // اضافه کردن نیازمندی‌ها
    if (tender.TenderRequirements.length > 0) {
      data.push(['نیازمندی‌های پروژه', ''])
      data.push(['دسته‌بندی', 'آیتم', 'مقدار', 'توضیحات'])
      tender.TenderRequirements.forEach((req) => {
        data.push([
          req.category || 'عمومی',
          req.item || 'نامشخص',
          req.quantity || 'نامشخص',
          req.description || 'ندارد',
        ])
      })
      data.push(['', ''])
    }

    // اضافه کردن شرکت‌های ثبت‌نام شده
    if (tender.TenderParticipations.length > 0) {
      data.push(['شرکت‌های ثبت‌نام شده', ''])
      data.push(['نام شرکت', 'وضعیت', 'تاریخ ثبت'])
      tender.TenderParticipations.forEach((participation) => {
        data.push([
          participation.Companies.name,
          participation.status,
          new Date(participation.createdAt).toLocaleDateString('fa-IR'),
        ])
      })
    }

    // Dynamic import برای xlsx
    const XLSX = await import('xlsx')

    // ایجاد workbook و worksheet
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'اطلاعات مناقصه')

    // تنظیم عرض ستون‌ها
    ws['!cols'] = [
      { wch: 30 }, // ستون اول
      { wch: 50 }, // ستون دوم
    ]

    // تولید فایل Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // آماده‌سازی نام فایل
    const fileName = `مناقصه_${tender.tenderNumber || tender.id}.xlsx`
    const encodedFileName = encodeURIComponent(fileName)

    // برگرداندن فایل
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
      },
    })
  } catch (error) {
    console.error('Error exporting tender to Excel:', error)
    return NextResponse.json(
      { error: 'Failed to export tender' },
      { status: 500 }
    )
  }
}

