import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - ذخیره کردن مناقصه
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

    // بررسی اینکه آیا قبلاً ذخیره شده
    const existingSave = await prisma.saves.findUnique({
      where: {
        userId_tenderId: {
          userId,
          tenderId: id,
        },
      },
    })

    if (existingSave) {
      // حذف ذخیره
      await prisma.saves.delete({
        where: {
          userId_tenderId: {
            userId,
            tenderId: id,
          },
        },
      })
      return NextResponse.json({ saved: false })
    } else {
      // اضافه کردن ذخیره
      await prisma.saves.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          tenderId: id,
        },
      })
      return NextResponse.json({ saved: true })
    }
  } catch (error) {
    console.error('Error toggling save:', error)
    return NextResponse.json(
      { error: 'Failed to toggle save' },
      { status: 500 }
    )
  }
}

