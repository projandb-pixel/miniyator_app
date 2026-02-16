import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - دریافت لیست شهرهای یک استان
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provinceId = searchParams.get('provinceId')
    const provinceName = searchParams.get('provinceName')

    if (!provinceId && !provinceName) {
      return NextResponse.json(
        { error: 'Province ID or name is required' },
        { status: 400 }
      )
    }

    let where: any = {}
    if (provinceId) {
      where.provinceId = provinceId
    } else if (provinceName) {
      where.Provinces = {
        name: provinceName,
      }
    }

    const cities = await prisma.cities.findMany({
      where,
      include: {
        Provinces: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    console.log(`Cities found for ${provinceName}:`, cities.length)
    return NextResponse.json({ cities })
  } catch (error) {
    console.error('Error fetching cities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cities', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

