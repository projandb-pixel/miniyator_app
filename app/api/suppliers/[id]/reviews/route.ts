import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// بررسی اینکه prisma در دسترس است
if (!prisma) {
  console.error('Prisma Client is not initialized!')
}

// GET - دریافت نظرات یک تأمین‌کننده
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reviews = await prisma.reviews.findMany({
      where: { companyId: id },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // دریافت اطلاعات contractor برای هر review
    const formattedReviews = await Promise.all(
      reviews.map(async (r: any) => {
        let contractor = null
        try {
          const contractorData = await prisma.companies.findUnique({
            where: { id: r.contractorId },
            select: {
              id: true,
              name: true,
              logo: true,
            },
          })
          contractor = contractorData
        } catch (error) {
          console.error(`Error fetching contractor ${r.contractorId}:`, error)
        }
        
        return {
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          contractorId: r.contractorId,
          contractor: contractor,
        }
      })
    )

    return NextResponse.json({ reviews: formattedReviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST - ایجاد نظر جدید
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params
    console.log('Received supplierId:', supplierId)
    
    const body = await request.json()
    console.log('Request body:', body)
    
    const { contractorId, rating, comment } = body
    console.log('Extracted data:', { contractorId, rating, comment })

    if (!contractorId || !rating) {
      console.log('Validation failed: missing contractorId or rating')
      return NextResponse.json(
        { error: 'Contractor ID and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      console.log('Validation failed: rating out of range')
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // بررسی اینکه prisma.companies وجود دارد
    if (!prisma.companies) {
      console.error('prisma.companies is undefined!')
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    // بررسی اینکه آیا supplierId و contractorId معتبر هستند
    console.log('Checking supplier:', supplierId)
    const supplier = await prisma.companies.findUnique({
      where: { id: supplierId },
      select: { id: true },
    })

    if (!supplier) {
      console.log('Supplier not found:', supplierId)
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    console.log('Checking contractor:', contractorId)
    const contractor = await prisma.companies.findUnique({
      where: { id: contractorId },
      include: {
        Users: {
          select: {
            role: true,
          },
        },
      },
    })

    if (!contractor) {
      console.log('Contractor not found:', contractorId)
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      )
    }

    console.log('Contractor role:', contractor.Users?.role)
    // بررسی اینکه آیا این company واقعاً یک contractor است
    if (contractor.Users?.role !== 'contractor') {
      return NextResponse.json(
        { error: 'This company is not a contractor' },
        { status: 400 }
      )
    }

    // بررسی اینکه آیا این پیمانکار قبلاً نظر داده است
    let existingReview = null
    try {
      existingReview = await prisma.reviews.findFirst({
        where: {
          companyId: supplierId,
          contractorId: contractorId,
        },
      })
      console.log('Existing review check:', existingReview ? `Found: ${existingReview.id}` : 'None found')
    } catch (findError: any) {
      console.error('Error finding existing review:', findError)
      console.error('Find error details:', {
        message: findError?.message,
        code: findError?.code,
      })
      existingReview = null
    }

    let review
    if (existingReview) {
      // به‌روزرسانی نظر موجود
      try {
        review = await prisma.reviews.update({
          where: { id: existingReview.id },
          data: {
            rating: Number(rating),
            comment: comment ? String(comment).trim() : null,
          },
        })
        console.log('Review updated successfully:', review.id)
      } catch (updateError: any) {
        console.error('Error updating review:', updateError)
        console.error('Update error details:', {
          message: updateError?.message,
          code: updateError?.code,
          meta: updateError?.meta,
        })
        throw updateError
      }
    } else {
      // ایجاد نظر جدید
      try {
        review = await prisma.reviews.create({
          data: {
            id: crypto.randomUUID(),
            companyId: String(supplierId),
            contractorId: String(contractorId),
            rating: Number(rating),
            comment: comment ? String(comment).trim() : null,
          },
        })
        console.log('Review created successfully:', review.id)
      } catch (createError: any) {
        console.error('Error creating review:', createError)
        console.error('Create error details:', {
          message: createError?.message,
          code: createError?.code,
          meta: createError?.meta,
          data: {
            supplierId,
            contractorId,
            rating,
            comment,
          },
        })
        throw createError
      }
    }

    // دریافت اطلاعات contractor به صورت جداگانه
    try {
      const contractorInfo = await prisma.companies.findUnique({
        where: { id: contractorId },
        select: {
          id: true,
          name: true,
          logo: true,
        },
      })
      
      review = {
        ...review,
        contractor: contractorInfo || null,
      }
    } catch (contractorError) {
      console.error('Error fetching contractor info:', contractorError)
      review = {
        ...review,
        contractor: null,
      }
    }

    // تبدیل ساختار برای سازگاری با frontend
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      contractorId: review.contractorId,
      contractor: review.contractor,
    }
    
    console.log('Returning review:', formattedReview)
    return NextResponse.json({ review: formattedReview }, { status: existingReview ? 200 : 201 })
  } catch (error: any) {
    console.error('Error creating/updating review:', error)
    // نمایش جزئیات خطا برای دیباگ
    console.error('Error type:', typeof error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Error meta:', error?.meta)
    console.error('Error stack:', error?.stack)
    
    return NextResponse.json(
      { 
        error: 'Failed to create/update review',
        details: error?.message || 'Unknown error',
        code: error?.code,
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف نظر
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params
    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    const contractorId = searchParams.get('contractorId')

    if (!reviewId || !contractorId) {
      return NextResponse.json(
        { error: 'Review ID and Contractor ID are required' },
        { status: 400 }
      )
    }

    // بررسی اینکه نظر متعلق به این پیمانکار است
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.contractorId !== contractorId) {
      return NextResponse.json(
        { error: 'You can only delete your own review' },
        { status: 403 }
      )
    }

    await prisma.reviews.delete({
      where: { id: reviewId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}

