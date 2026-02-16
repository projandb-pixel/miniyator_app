import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// بررسی وضعیت تکمیل پروفایل
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId الزامی است" },
        { status: 400 }
      );
    }

    // پیدا کردن کاربر
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Companies: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وضعیت پروفایل
    const hasCompany = !!user.Companies;
    const profileCompleted = user.profileCompleted && hasCompany;

    return NextResponse.json({
      success: true,
      profileCompleted,
      hasCompany,
      role: user.role,
    });
  } catch (error) {
    console.error("Error in profile status:", error);
    return NextResponse.json(
      { error: "خطا در بررسی وضعیت پروفایل" },
      { status: 500 }
    );
  }
}



