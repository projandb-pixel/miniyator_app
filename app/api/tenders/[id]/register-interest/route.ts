import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - ثبت اعلام آمادگی برای مناقصه
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenderId } = await params
    const body = await request.json()
    const { userId } = body

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

    // بررسی وجود مناقصه
    const tender = await prisma.tenders.findUnique({
      where: { id: tenderId },
    })

    if (!tender) {
      return NextResponse.json(
        { error: 'Tender not found' },
        { status: 404 }
      )
    }

    // ثبت یا به‌روزرسانی اعلام آمادگی
    const participation = await prisma.tenderParticipations.upsert({
      where: {
        tenderId_companyId: {
          tenderId,
          companyId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        tenderId,
        companyId,
        status: 'registered',
        updatedAt: new Date(),
      },
      update: {
        status: 'registered',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      participation,
    })
  } catch (error) {
    console.error('Error registering interest:', error)
    return NextResponse.json(
      { error: 'Failed to register interest' },
      { status: 500 }
    )
  }
}









