import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - دریافت تعداد کاربران بر اساس نقش
export async function GET(request: Request) {
  try {
    const [contractorCount, supplierCount] = await Promise.all([
      prisma.users.count({
        where: {
          role: "contractor",
          isVerified: true,
        },
      }),
      prisma.users.count({
        where: {
          role: "supplier",
          isVerified: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      contractors: contractorCount,
      suppliers: supplierCount,
    });
  } catch (error) {
    console.error("Error fetching user counts:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تعداد کاربران" },
      { status: 500 }
    );
  }
}




