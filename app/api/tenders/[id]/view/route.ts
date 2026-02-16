import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - ثبت view برای یک مناقصه
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenderId } = await params;
    const body = await request.json();
    const { userId, userRole } = body;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // بررسی وجود مناقصه
    const tender = await prisma.tenders.findUnique({
      where: { id: tenderId },
    });

    if (!tender) {
      return NextResponse.json(
        { error: "Tender not found" },
        { status: 404 }
      );
    }

    // ثبت view با upsert برای جلوگیری از duplicate
    await prisma.tenderViews.upsert({
      where: {
        tenderId_userId: {
          tenderId,
          userId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        tenderId,
        userId,
        userRole,
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording tender view:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}




