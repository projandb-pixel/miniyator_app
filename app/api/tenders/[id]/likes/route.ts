import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - لایک کردن مناقصه
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // بررسی اینکه آیا قبلاً لایک شده
    const existingLike = await prisma.likes.findUnique({
      where: {
        userId_tenderId: {
          userId,
          tenderId: id,
        },
      },
    })

    if (existingLike) {
      // حذف لایک
      await prisma.likes.delete({
        where: {
          userId_tenderId: {
            userId,
            tenderId: id,
          },
        },
      })
      
      // دریافت تعداد لایک‌های به‌روز
      const likesCount = await prisma.likes.count({
        where: { tenderId: id },
      })
      
      return NextResponse.json({ liked: false, likes: likesCount })
    } else {
      // اضافه کردن لایک
      await prisma.likes.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          tenderId: id,
        },
      })
      
      // دریافت تعداد لایک‌های به‌روز
      const likesCount = await prisma.likes.count({
        where: { tenderId: id },
      })
      
      return NextResponse.json({ liked: true, likes: likesCount })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

