import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { base64ToBuffer, bufferToBase64 } from '@/lib/file-utils'

// GET - دریافت لیست فریلنسرها
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10)
    const skill = searchParams.get('skill')
    const location = searchParams.get('location')
    const available = searchParams.get('available')

    const where: any = {}

    if (skill) {
      where.skill = {
        contains: skill,
      }
    }

    if (location) {
      where.location = location
    }

    if (available === 'true') {
      where.available = true
    }

    const freelancers = await prisma.freelancers.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        rating: 'desc',
      },
    })

    // Convert avatar blob to base64
    const freelancersWithAvatars = freelancers.map((freelancer) => ({
      ...freelancer,
      avatar: freelancer.avatar ? bufferToBase64(freelancer.avatar as Buffer) : null,
    }));

    return NextResponse.json({ freelancers: freelancersWithAvatars })
  } catch (error) {
    console.error('Error fetching freelancers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch freelancers' },
      { status: 500 }
    )
  }
}

// POST - ایجاد فریلنسر جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, skill, experience, dailyRate, location, available, rating, avatar } = body

    const freelancer = await prisma.freelancers.create({
      data: {
        id: crypto.randomUUID(),
        name,
        phone,
        skill,
        experience,
        dailyRate,
        location,
        available: available ?? true,
        rating: rating ?? 0,
        avatar: avatar ? new Uint8Array(base64ToBuffer(avatar)) : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ freelancer }, { status: 201 })
  } catch (error) {
    console.error('Error creating freelancer:', error)
    return NextResponse.json(
      { error: 'Failed to create freelancer' },
      { status: 500 }
    )
  }
}






