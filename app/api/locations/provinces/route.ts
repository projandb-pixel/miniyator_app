import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت لیست استان‌ها
export async function GET() {
  try {
    const provinces = await prisma.provinces.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    console.log('Provinces found:', provinces.length)
    return NextResponse.json({ provinces })
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provinces', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

