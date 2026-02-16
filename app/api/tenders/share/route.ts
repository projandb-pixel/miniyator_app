import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { base64ToBuffer, bufferToBase64 } from "@/lib/file-utils";

// POST - اشتراک‌گذاری مناقصه به عنوان استوری/پست
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      tenderId,
      customTitle,
      customContent,
      customImageUrl,
      expiresAt,
    } = body;

    if (!userId || !tenderId) {
      return NextResponse.json(
        { error: "User ID and Tender ID are required" },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر و شرکت
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

    // بررسی وجود مناقصه
    const tender = await prisma.tenders.findUnique({
      where: { id: tenderId },
      include: {
        TenderCategories: true,
        TenderRequirements: true,
      },
    });

    if (!tender) {
      return NextResponse.json({ error: "Tender not found" }, { status: 404 });
    }

    // ایجاد استوری از مناقصه
    // اگر محتوای سفارشی ارائه شده، از آن استفاده کن، در غیر این صورت خودکار بساز
    let storyTitle: string;
    let storyContent: string;
    let storyImageUrl: string | null;
    let storyExpiresAt: Date;

    if (customTitle && customContent) {
      // استفاده از محتوای سفارشی
      storyTitle = customTitle;
      storyContent = customContent;
      // Convert tender images blob to string array
      let tenderImages: string[] = [];
      if (tender.images) {
        try {
          const imagesJson = JSON.parse(Buffer.from(tender.images).toString('utf-8'));
          tenderImages = Array.isArray(imagesJson) ? imagesJson : [];
        } catch {
          // If parsing fails, try to convert blob to base64
          tenderImages = [bufferToBase64(Buffer.from(tender.images)) || ''].filter(Boolean);
        }
      }
      storyImageUrl = customImageUrl || (tenderImages.length > 0 ? tenderImages[0] : null);
      storyExpiresAt = expiresAt
        ? new Date(expiresAt)
        : (() => {
            const date = new Date();
            date.setHours(date.getHours() + 24);
            return date;
          })();
    } else {
      // ساخت خودکار محتوای استوری از اطلاعات مناقصه
      storyTitle = `مناقصه: ${tender.title}`;
      storyContent =
        `شرکت ${tender.company} درخواست ${tender.title} دارد.\n\n` +
        (tender.TenderCategories.length > 0
          ? `دسته‌بندی‌ها: ${tender.TenderCategories.map(
              (c) => c.category
            ).join(", ")}\n\n`
          : "") +
        (tender.description ? `توضیحات: ${tender.description}` : "");
      // Convert tender images blob to string array
      let tenderImages: string[] = [];
      if (tender.images) {
        try {
          const imagesJson = JSON.parse(Buffer.from(tender.images).toString('utf-8'));
          tenderImages = Array.isArray(imagesJson) ? imagesJson : [];
        } catch {
          // If parsing fails, try to convert blob to base64
          tenderImages = [bufferToBase64(Buffer.from(tender.images)) || ''].filter(Boolean);
        }
      }
      storyImageUrl = tenderImages.length > 0 ? tenderImages[0] : null;
      storyExpiresAt = new Date();
      storyExpiresAt.setHours(storyExpiresAt.getHours() + 24);
    }

    // تبدیل storyImageUrl به Buffer برای Prisma
    // base64ToBuffer خودش prefix data:image/... را حذف می‌کند
    let imageData: Buffer | null = null;
    if (storyImageUrl && typeof storyImageUrl === "string" && storyImageUrl.trim()) {
      try {
        imageData = base64ToBuffer(storyImageUrl.trim());
      } catch (error) {
        console.error("Error processing story image:", error);
      }
    }

    const story = await prisma.stories.create({
      data: {
        id: crypto.randomUUID(),
        companyId: user.Companies.id,
        type: "tender_share",
        views: 0,
        title: storyTitle,
        content: storyContent,
        imageData: imageData as any,
        expiresAt: storyExpiresAt,
        updatedAt: new Date(),
      },
      include: {
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

    return NextResponse.json(
      {
        story: {
          id: story.id,
          companyId: story.companyId,
          company: {
            ...story.Companies,
            logo: story.Companies.logo 
              ? bufferToBase64(story.Companies.logo instanceof Buffer ? story.Companies.logo : Buffer.from(story.Companies.logo as any))
              : null,
            role: story.Companies.Users?.role,
          },
          type: story.type,
          title: story.title,
          content: story.content,
          imageUrl: story.imageData ? bufferToBase64(story.imageData as Buffer) : null,
          videoUrl: story.videoData ? bufferToBase64(story.videoData as Buffer) : null,
          views: story.views,
          hasNew: true,
          createdAt: story.createdAt,
          expiresAt: story.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sharing tender:", error);
    return NextResponse.json(
      { error: "Failed to share tender" },
      { status: 500 }
    );
  }
}
