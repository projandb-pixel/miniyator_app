import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت کامنت‌های یک پست
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await prisma.postComments.findMany({
      where: { postId },
      include: {
        Users: {
          include: {
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
        createdAt: "asc",
      },
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.Users.id,
        phone: comment.Users.phone,
        role: comment.Users.role,
        company: comment.Users.Companies
          ? {
              id: comment.Users.Companies.id,
              name: comment.Users.Companies.name,
              logo: comment.Users.Companies.logo
                ? bufferToBase64(comment.Users.Companies.logo instanceof Buffer ? comment.Users.Companies.logo : Buffer.from(comment.Users.Companies.logo as any))
                : null,
            }
          : null,
      },
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - افزودن کامنت جدید
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: "User ID and content are required" },
        { status: 400 }
      );
    }

    const comment = await prisma.postComments.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        postId,
        content,
        updatedAt: new Date(),
      },
      include: {
        Users: {
          include: {
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
    });

    // افزایش تعداد کامنت‌ها
    await prisma.posts.update({
      where: { id: postId },
      data: {
        comments: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        userId: comment.userId,
        postId: comment.postId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          id: comment.Users.id,
          phone: comment.Users.phone,
          role: comment.Users.role,
          company: comment.Users.Companies
            ? {
                id: comment.Users.Companies.id,
                name: comment.Users.Companies.name,
                logo: comment.Users.Companies.logo
                  ? bufferToBase64(comment.Users.Companies.logo as Buffer)
                  : null,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create comment";
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

