import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - افزودن پروژه جدید
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyId, title, description, client, value, year } = body

    if (!companyId || !title) {
      return NextResponse.json(
        { error: 'شناسه شرکت و عنوان پروژه الزامی هستند' },
        { status: 400 }
      )
    }

    const project = await prisma.projects.create({
      data: {
        id: crypto.randomUUID(),
        companyId,
        title,
        description: description || null,
        client: client || null,
        value: value || null,
        year: year || null,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

