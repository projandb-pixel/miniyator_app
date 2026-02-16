import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت آمار کلی کاربر
export async function GET(request: NextRequest) {
  try {
    // دریافت userId از cookie
    const userId = request.cookies.get('userId')?.value
    
    // اگر userId در cookie نبود، از query parameter بگیر (برای backward compatibility)
    const userIdFromQuery = new URL(request.url).searchParams.get('userId')
    const finalUserId = userId || userIdFromQuery
    
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'all'
    const inquiryTimeRange = searchParams.get('inquiryTimeRange') || 'all'
    const activityTimeRange = searchParams.get('activityTimeRange') || 'all'

    if (!finalUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // استفاده از finalUserId به جای userId
    const userIdToUse = finalUserId

    // تابع کمکی برای محاسبه تاریخ شروع
    const getStartDate = (range: string): Date | null => {
      const now = new Date()
      switch (range) {
        case 'week':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'month':
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        case 'quarter':
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        case 'all':
        default:
          return null
      }
    }

    const startDate = getStartDate(timeRange)
    const inquiryStartDate = getStartDate(inquiryTimeRange)
    const activityStartDate = getStartDate(activityTimeRange)

    // دریافت companyId از userId
    const user = await prisma.users.findUnique({
      where: { id: userIdToUse },
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
      likedTendersCount,
      allLikesForDebug,
    ] = await Promise.all([
      // تعداد مناقصه‌های ذخیره شده
      prisma.saves.count({
        where: { 
          userId: userIdToUse,
          ...(startDate && { createdAt: { gte: startDate } })
        },
      }),
      // تعداد مناقصه‌های لایک شده
      prisma.likes.count({
        where: { 
          userId: userIdToUse,
          ...(startDate && { createdAt: { gte: startDate } })
        },
      }),
      // بررسی همه لایک‌ها (بدون فیلتر تاریخ) برای دیباگ
      prisma.likes.findMany({
        where: { userId: userIdToUse },
        select: { id: true, tenderId: true, createdAt: true },
        take: 5, // فقط 5 تا برای دیباگ
      }),
    ])

    // محاسبه مناقصه‌های دیده شده (از TenderViews)
    const tenderViews = await prisma.tenderViews.findMany({
      where: { 
        userId: userIdToUse, 
        userRole: 'contractor',
        ...(startDate && { viewedAt: { gte: startDate } })
      },
      select: { tenderId: true },
    })
    const uniqueTenderIds = new Set(tenderViews.map(v => v.tenderId))
    const tendersViewed = uniqueTenderIds.size

    // محاسبه مناقصه‌های بررسی شده (مشاهده جزئیات - مناقصه‌هایی که کامنت یا لایک یا ذخیره شده‌اند)
    const viewedTenderIds = new Set<string>()
    
    const [likes, saves, comments] = await Promise.all([
      prisma.likes.findMany({
        where: { 
          userId: userIdToUse,
          ...(startDate && { createdAt: { gte: startDate } })
        },
        select: { tenderId: true },
      }),
      prisma.saves.findMany({
        where: { 
          userId: userIdToUse,
          ...(startDate && { createdAt: { gte: startDate } })
        },
        select: { tenderId: true },
      }),
      prisma.comments.findMany({
        where: { 
          userId: userIdToUse,
          ...(startDate && { createdAt: { gte: startDate } })
        },
        select: { tenderId: true },
      }),
    ])

    likes.forEach(l => viewedTenderIds.add(l.tenderId))
    saves.forEach(s => viewedTenderIds.add(s.tenderId))
    comments.forEach(c => viewedTenderIds.add(c.tenderId))

    const tendersReviewed = viewedTenderIds.size

    // لاگ برای دیباگ
    console.log('Tenders Stats Debug:', {
      userId: userIdToUse,
      userIdFromCookie: userId,
      userIdFromQuery: userIdFromQuery,
      timeRange,
      startDate: startDate?.toISOString(),
      savedTendersCount,
      likedTendersCount,
      tendersViewed,
      tendersReviewed,
      likesCount: likes.length,
      savesCount: saves.length,
      commentsCount: comments.length,
      tenderViewsCount: tenderViews.length,
      allLikesForDebug: allLikesForDebug.map(l => ({
        id: l.id,
        tenderId: l.tenderId,
        createdAt: l.createdAt.toISOString()
      }))
    })

    // محاسبه آمار استعلام‌ها با فیلتر بازه زمانی جداگانه
    const inquiryDateFilter = inquiryStartDate ? { createdAt: { gte: inquiryStartDate } } : {}

    // برگزار شده: تمام استعلام‌های ایجاد شده
    const inquiriesCreated = await prisma.priceInquiries.count({
      where: { 
        contractorId: companyId,
        ...inquiryDateFilter
      },
    })

    // در مرحله بررسی: استعلام‌هایی که حداقل یک پاسخ دارند اما هنوز کامل نشده‌اند
    const inquiriesInReview = await prisma.priceInquiries.count({
      where: { 
        contractorId: companyId,
        PriceInquiryResponses: {
          some: {}
        },
        status: { not: 'completed' },
        ...inquiryDateFilter
      },
    })

    // خاتمه یافته: استعلام‌هایی که status آنها completed است
    const inquiriesCompleted = await prisma.priceInquiries.count({
      where: { 
        contractorId: companyId, 
        status: 'completed',
        ...inquiryDateFilter
      },
    })

    // همکاری موفق: استعلام‌های completed که حداقل یک پاسخ موفق داشته‌اند
    const successfulInquiries = await prisma.priceInquiries.findMany({
      where: {
        contractorId: companyId,
        status: 'completed',
        PriceInquiryResponses: {
          some: {}
        },
        ...inquiryDateFilter
      },
      include: {
        PriceInquiryResponses: true
      }
    })
    const inquiriesSuccessful = successfulInquiries.length

    // محاسبه میزان فعالیت در وین گرام (لایک، کامنت، پست، استوری)
    const activityDateFilter = activityStartDate ? { createdAt: { gte: activityStartDate } } : {}
    
    // محاسبه فعالیت‌های کاربر در وین گرام:
    // 1. لایک‌های کاربر روی همه پست‌ها
    // 2. کامنت‌های کاربر روی همه پست‌ها
    // 3. پست‌های ایجاد شده توسط شرکت
    // 4. استوری‌های ایجاد شده توسط شرکت
    
    let winGramActivity = 0
    try {
      const [userPostLikes, userPostComments, companyPosts, companyStories] = await Promise.all([
        // لایک‌های کاربر روی همه پست‌ها
        prisma.postLikes.count({
          where: {
            userId: userIdToUse,
            ...activityDateFilter
          }
        }),
        // کامنت‌های کاربر روی همه پست‌ها
        prisma.postComments.count({
          where: {
            userId: userIdToUse,
            ...activityDateFilter
          }
        }),
        // پست‌های ایجاد شده توسط شرکت
        prisma.posts.count({
          where: {
            companyId: companyId,
            ...activityDateFilter
          }
        }),
        // استوری‌های ایجاد شده توسط شرکت
        prisma.stories.count({
          where: {
            companyId: companyId,
            ...activityDateFilter
          }
        })
      ])
      
      winGramActivity = userPostLikes + userPostComments + companyPosts + companyStories
      
      // لاگ برای دیباگ
      console.log('WinGram Activity Debug:', {
        userId: userIdToUse,
        companyId,
        activityStartDate: activityStartDate?.toISOString(),
        activityTimeRange,
        userPostLikes,
        userPostComments,
        companyPosts,
        companyStories,
        total: winGramActivity
      })
    } catch (activityError) {
      console.error('Error calculating winGram activity:', activityError)
      winGramActivity = 0
    }

    // محاسبه درصد رضایت تأمین‌کنندگان (از Reviews)
    const reviews = await prisma.reviews.findMany({
      where: {
        companyId: companyId
      },
      select: {
        rating: true
      }
    })
    
    const supplierSatisfaction = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length / 5) * 100)
      : 0

    // محاسبه تعداد بازدید از پروفایل (مجموع بازدیدهای پست‌ها و استوری‌ها)
    const [companyPostsForViews, companyStoriesForViews] = await Promise.all([
      prisma.posts.findMany({
        where: { companyId: companyId },
        select: { id: true }
      }),
      prisma.stories.findMany({
        where: { companyId: companyId },
        select: { id: true }
      })
    ])
    const companyPostIdsForViews = companyPostsForViews.map(p => p.id)
    const companyStoryIdsForViews = companyStoriesForViews.map(s => s.id)
    
    const [postViewsCount, storyViewsCount] = await Promise.all([
      companyPostIdsForViews.length > 0 ? prisma.postViews.count({
        where: {
          postId: { in: companyPostIdsForViews }
        }
      }) : 0,
      companyStoryIdsForViews.length > 0 ? prisma.storyViews.count({
        where: {
          storyId: { in: companyStoryIdsForViews }
        }
      }) : 0
    ])
    
    const profileViews = postViewsCount + storyViewsCount

    return NextResponse.json({
      tendersViewed,
      tendersLiked: likedTendersCount,
      tendersReviewed,
      tendersSaved: savedTendersCount,
      inquiriesCreated,
      inquiriesInReview,
      inquiriesCompleted,
      inquiriesSuccessful,
      supplierSatisfaction,
      profileViews,
      winGramActivity,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

