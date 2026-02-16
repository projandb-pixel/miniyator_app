import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت آمار کلی کاربر
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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
      return NextResponse.json(
        { error: 'User or company not found' },
        { status: 404 }
      )
    }

    const companyId = user.Companies.id

    // محاسبه آمار
    const [
      savedTendersCount,
      inquiriesCount,
      likedTendersCount,
      commentedTendersCount,
      savedTenders,
    ] = await Promise.all([
      // تعداد مناقصه‌های ذخیره شده
      prisma.saves.count({
        where: { userId },
      }),
      // تعداد استعلام‌های ارسال شده
      prisma.priceInquiries.count({
        where: { contractorId: companyId },
      }),
      // تعداد مناقصه‌های لایک شده
      prisma.likes.count({
        where: { userId },
      }),
      // تعداد مناقصه‌های کامنت شده
      prisma.comments.count({
        where: { userId },
      }),
      // مناقصه‌های ذخیره شده برای محاسبه برآورد
      prisma.saves.findMany({
        where: { userId },
        include: {
          Tenders: {
            select: {
              estimatedMin: true,
              estimatedMax: true,
              createdAt: true,
            },
          },
        },
      }),
    ])

    // محاسبه مناقصه‌های دیده شده (لایک + ذخیره + کامنت)
    const viewedTenderIds = new Set<string>()
    
    const [likes, saves, comments] = await Promise.all([
      prisma.likes.findMany({
        where: { userId },
        select: { tenderId: true },
      }),
      prisma.saves.findMany({
        where: { userId },
        select: { tenderId: true },
      }),
      prisma.comments.findMany({
        where: { userId },
        select: { tenderId: true },
      }),
    ])

    likes.forEach(l => viewedTenderIds.add(l.tenderId))
    saves.forEach(s => viewedTenderIds.add(s.tenderId))
    comments.forEach(c => viewedTenderIds.add(c.tenderId))

    const tendersViewed = viewedTenderIds.size

    // محاسبه برآورد این هفته (مناقصه‌های ذخیره شده در 7 روز گذشته)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const recentSavedTenders = savedTenders.filter(
      save => new Date(save.Tenders.createdAt) >= oneWeekAgo
    )

    let estimatedValue = 0
    recentSavedTenders.forEach(save => {
      if (save.Tenders.estimatedMin && save.Tenders.estimatedMax) {
        estimatedValue += (save.Tenders.estimatedMin + save.Tenders.estimatedMax) / 2
      } else if (save.Tenders.estimatedMin) {
        estimatedValue += save.Tenders.estimatedMin
      } else if (save.Tenders.estimatedMax) {
        estimatedValue += save.Tenders.estimatedMax
      }
    })

    // تبدیل به میلیارد تومان
    const estimatedValueInBillions = estimatedValue / 1000000000

    return NextResponse.json({
      tendersViewed,
      tendersSaved: savedTendersCount,
      inquiriesSent: inquiriesCount,
      estimatedValue: estimatedValueInBillions > 0 
        ? `${Math.round(estimatedValueInBillions * 10) / 10} میلیارد`
        : '۰',
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}






