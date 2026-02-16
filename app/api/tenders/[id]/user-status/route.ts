import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت وضعیت کاربر برای یک مناقصه (لایک شده، ذخیره شده)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const [liked, saved] = await Promise.all([
      prisma.likes.findUnique({
        where: {
          userId_tenderId: {
            userId,
            tenderId: id,
          },
        },
      }),
      prisma.saves.findUnique({
        where: {
          userId_tenderId: {
            userId,
            tenderId: id,
          },
        },
      }),
    ])

    return NextResponse.json({
      liked: !!liked,
      saved: !!saved,
    })
  } catch (error) {
    console.error('Error fetching user status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    )
  }
}

