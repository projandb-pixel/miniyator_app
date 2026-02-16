import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - لایک/آنلایک پست
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // بررسی وجود لایک
    const existingLike = await prisma.postLikes.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    let liked = false;
    if (existingLike) {
      // حذف لایک
      await prisma.postLikes.delete({
        where: {
          id: existingLike.id,
        },
      });

      // کاهش تعداد لایک‌ها
      await prisma.posts.update({
        where: { id: postId },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });

      liked = false;
    } else {
      // افزودن لایک
      await prisma.postLikes.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          postId,
        },
      });

      // افزایش تعداد لایک‌ها
      await prisma.posts.update({
        where: { id: postId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      liked = true;
    }

    // دریافت تعداد لایک‌های به‌روز
    const updatedPost = await prisma.posts.findUnique({
      where: { id: postId },
      select: { likes: true },
    });

    return NextResponse.json({ 
      liked,
      likes: updatedPost?.likes || 0
    });
  } catch (error: any) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to toggle like" },
      { status: 500 }
    );
  }
}

