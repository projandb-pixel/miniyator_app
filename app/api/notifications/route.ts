import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت اعلان‌های کاربر
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

    const notifications = await prisma.notifications.findMany({
      where: {
        userId,
      },
      include: {
        Tenders: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // فرمت کردن زمان
    const formattedNotifications = notifications.map((notif) => {
      const now = new Date()
      const created = new Date(notif.createdAt)
      const diffMs = now.getTime() - created.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      let timeAgo = ''
      if (diffHours < 1) {
        timeAgo = 'چند دقیقه پیش'
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ساعت پیش`
      } else if (diffDays === 1) {
        timeAgo = 'دیروز'
      } else {
        timeAgo = `${diffDays} روز پیش`
      }

      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        time: timeAgo,
        read: notif.read,
        actionUrl: notif.url || (notif.tenderId ? `/tender-details?id=${notif.tenderId}` : undefined),
      }
    })

    return NextResponse.json({ notifications: formattedNotifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - ایجاد اعلان جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, type, title, message, url, tenderId } = body

    const notification = await prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type,
        title,
        message,
        url,
        tenderId,
        read: false,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PATCH - به‌روزرسانی وضعیت خوانده شدن
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, read } = body

    const notification = await prisma.notifications.update({
      where: { id },
      data: { read },
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}






