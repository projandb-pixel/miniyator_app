import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { base64ToBuffer, bufferToBase64 } from '@/lib/file-utils'

// POST - افزودن محصول جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyId, name, category, brand, price, priceRange, description, specifications, unit, image } = body

    if (!companyId || !name || !category) {
      return NextResponse.json(
        { error: 'شناسه شرکت، نام و دسته‌بندی محصول الزامی هستند' },
        { status: 400 }
      )
    }

    const product = await prisma.products.create({
      data: {
        id: crypto.randomUUID(),
        companyId,
        name,
        category,
        brand: brand || null,
        price: price || null,
        priceRange: priceRange || null,
        description: description || null,
        specifications: specifications || null,
        unit: unit || null,
        image: image ? new Uint8Array(base64ToBuffer(image)) : null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}






