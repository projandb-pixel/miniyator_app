import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت یک استوری خاص
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // بررسی وجود model Stories در Prisma Client
    if (!prisma.stories) {
      console.error(
        "Prisma Stories model not found. Please run: npx prisma generate"
      );
      return NextResponse.json(
        {
          error:
            "مدل Stories در Prisma Client یافت نشد. لطفاً Prisma Client را دوباره generate کنید.",
        },
        { status: 500 }
      );
    }

    const story = await prisma.stories.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        companyId: true,
        type: true,
        title: true,
        content: true,
        imageData: true, // اضافه کردن imageData به select
        videoData: true, // اضافه کردن videoData به select
        expiresAt: true,
        views: true,
        createdAt: true,
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            Users: {
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "استوری یافت نشد" }, { status: 404 });
    }

    // بررسی انقضا (فقط برای استوری‌های غیر مناقصه)
    if (story.type !== "tender_share") {
      const now = new Date();
      if (story.expiresAt < now) {
        return NextResponse.json(
          { error: "این استوری منقضی شده است" },
          { status: 410 }
        );
      }
    }

    // اگر کاربر لاگین کرده، view را ثبت کن
    if (userId) {
      try {
        await prisma.storyViews.upsert({
          where: {
            storyId_userId: {
              storyId: story.id,
              userId: userId,
            },
          },
          create: {
            id: crypto.randomUUID(),
            storyId: story.id,
            userId: userId,
          },
          update: {},
        });

        // افزایش تعداد views
        await prisma.stories.update({
          where: { id: story.id },
          data: { views: { increment: 1 } },
        });
      } catch (viewError) {
        // اگر خطا در ثبت view بود، ادامه بده
        console.error("Error recording view:", viewError);
      }
    }

    // تبدیل imageData و videoData به base64
    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    
    if (story.imageData) {
      try {
        // اطمینان از اینکه imageData یک Buffer است
        const imageBuffer = story.imageData instanceof Buffer 
          ? story.imageData 
          : Buffer.from(story.imageData as any);
        imageUrl = bufferToBase64(imageBuffer);
        console.log(`Story ${story.id}: Image converted, length: ${imageUrl?.length || 0}`);
      } catch (error) {
        console.error(`Error converting image for story ${story.id}:`, error);
      }
    }
    
    if (story.videoData) {
      try {
        // اطمینان از اینکه videoData یک Buffer است
        const videoBuffer = story.videoData instanceof Buffer 
          ? story.videoData 
          : Buffer.from(story.videoData as any);
        videoUrl = bufferToBase64(videoBuffer);
      } catch (error) {
        console.error(`Error converting video for story ${story.id}:`, error);
      }
    }

    return NextResponse.json({
      story: {
        id: story.id,
        companyId: story.companyId,
        company: {
          id: story.Companies.id,
          name: story.Companies.name,
          logo: story.Companies.logo
            ? bufferToBase64(story.Companies.logo instanceof Buffer ? story.Companies.logo : Buffer.from(story.Companies.logo as any))
            : null,
          role: story.Companies.Users.role,
        },
        type: story.type,
        title: story.title,
        content: story.content,
        imageUrl,
        videoUrl,
        views: story.views,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error fetching story:", error);
    const errorMessage =
      error instanceof Error ? error.message : "خطا در دریافت استوری";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
