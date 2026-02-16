import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - ثبت بازدید پست
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

    // بررسی وجود بازدید قبلی
    const existingView = await (prisma as any).postViews.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingView) {
      // ثبت بازدید جدید
      await (prisma as any).postViews.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          postId,
        },
      });

      // افزایش تعداد بازدیدها
      await prisma.posts.update({
        where: { id: postId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    // دریافت تعداد بازدیدهای به‌روز
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { views: true },
    });

    return NextResponse.json({ 
      viewed: true,
      views: post?.views || 0 
    });
  } catch (error) {
    console.error("Error recording view:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to record view";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

