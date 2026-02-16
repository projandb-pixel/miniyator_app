import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE - حذف پست
export async function DELETE(
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

    // دریافت companyId از userId
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { Companies: true },
    });

    if (!user || !user.Companies) {
      return NextResponse.json(
        { error: "User or company not found" },
        { status: 404 }
      );
    }

    const userCompanyId = user.Companies.id;

    // بررسی اینکه پست متعلق به کاربر است
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { companyId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.companyId !== userCompanyId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this post" },
        { status: 403 }
      );
    }

    // حذف پست (cascade delete لایک‌ها، کامنت‌ها و بازدیدها را خودکار حذف می‌کند)
    await prisma.posts.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

