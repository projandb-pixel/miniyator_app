import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bufferToBase64 } from '@/lib/file-utils'

// GET - دریافت کامنت‌های یک مناقصه
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await prisma.comments.findMany({
      where: { tenderId: id },
      include: {
        Users: {
          select: {
            id: true,
            phone: true,
            role: true,
            Companies: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // نمایش همه نظرات (هم پیمانکاران و هم تامین‌کنندگان)
    // فیلتر کردن فقط پیمانکاران (contractor) - در صورت نیاز می‌توان این فیلتر را حذف کرد
    // const contractorComments = comments.filter(
    //   comment => comment.Users.role === 'contractor'
    // )

    // تبدیل logo از Buffer به base64
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      Users: {
        id: comment.Users.id,
        phone: comment.Users.phone,
        role: comment.Users.role,
        Companies: comment.Users.Companies ? {
          id: comment.Users.Companies.id,
          name: comment.Users.Companies.name,
          logo: comment.Users.Companies.logo 
            ? bufferToBase64(comment.Users.Companies.logo instanceof Buffer ? comment.Users.Companies.logo : Buffer.from(comment.Users.Companies.logo as any))
            : null,
        } : null,
      },
    }))

    return NextResponse.json({ 
      comments: formattedComments,
      total: formattedComments.length 
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - ایجاد کامنت جدید
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, content } = body

    console.log('POST /api/tenders/[id]/comments - Request:', { id, userId, content })

    if (!userId || !content) {
      console.error('Missing required fields:', { userId: !!userId, content: !!content })
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      )
    }

    const comment = await prisma.comments.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        tenderId: id,
        content,
        updatedAt: new Date(),
      },
      include: {
        Users: {
          select: {
            id: true,
            phone: true,
            role: true,
            Companies: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    })

    // تبدیل logo از Buffer به base64
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      Users: {
        id: comment.Users.id,
        phone: comment.Users.phone,
        role: comment.Users.role,
        Companies: comment.Users.Companies ? {
          id: comment.Users.Companies.id,
          name: comment.Users.Companies.name,
          logo: comment.Users.Companies.logo 
            ? bufferToBase64(comment.Users.Companies.logo instanceof Buffer ? comment.Users.Companies.logo : Buffer.from(comment.Users.Companies.logo as any))
            : null,
        } : null,
      },
    }

    console.log('Comment created successfully:', formattedComment.id)
    return NextResponse.json({ comment: formattedComment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
}

