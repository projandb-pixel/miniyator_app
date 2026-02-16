import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت فعالیت‌های اخیر کاربر
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = Number.parseInt(searchParams.get('limit') || '5', 10)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // دریافت companyId از userId
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { Companies: true },
    })

    if (!user || !user.Companies) {
      return NextResponse.json({ activities: [] })
    }

    const companyId = user.Companies.id

    // دریافت مناقصه‌های ذخیره شده اخیر
    const recentSaves = await prisma.saves.findMany({
      where: { userId },
      include: {
        Tenders: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // دریافت استعلام‌های ارسال شده اخیر
    const recentInquiries = await prisma.priceInquiries.findMany({
      where: { contractorId: companyId },
      select: {
        id: true,
        product: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // ترکیب و مرتب‌سازی بر اساس تاریخ
    const activities = [
      ...recentSaves.map(save => ({
        id: save.Tenders.id,
        type: 'saved',
        title: save.Tenders.title,
        company: save.Tenders.company,
        date: save.createdAt,
      })),
      ...recentInquiries.map(inquiry => ({
        id: inquiry.id,
        type: 'inquiry',
        title: inquiry.product,
        company: 'استعلام قیمت',
        date: inquiry.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}






