import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت کاربر
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { phone },
      include: {
        Companies: {
          include: {
            CompanyCategories: true,
            Products: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// POST - ایجاد یا به‌روزرسانی کاربر
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, role, otpCode, otpExpiresAt } = body

    const user = await prisma.users.upsert({
      where: { phone },
      update: {
        otpCode,
        otpExpiresAt: otpExpiresAt ? new Date(otpExpiresAt) : null,
      },
      create: {
        id: crypto.randomUUID(),
        phone,
        role,
        otpCode,
        otpExpiresAt: otpExpiresAt ? new Date(otpExpiresAt) : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}






