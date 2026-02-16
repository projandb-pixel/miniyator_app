import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { base64ToBuffer, bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت استوری‌های فعال
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const all = searchParams.get("all") === "true";

    // بررسی وجود model Stories در Prisma Client
    if (!prisma.stories) {
      console.error(
        "Prisma Stories model not found. Please run: npx prisma generate"
      );
      return NextResponse.json(
        { stories: [], error: "مدل Stories در Prisma Client یافت نشد" },
        { status: 200 }
      );
    }

    // ساخت شرط where
    const where: any = {};
    if (!all) {
      // فقط استوری‌های فعال (که منقضی نشده‌اند)
      const now = new Date();
      where.expiresAt = {
        gt: now,
      };
    }

    // دریافت استوری‌ها
    const stories = await prisma.stories.findMany({
      where,
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
        StoryViews: userId
          ? {
              where: {
                userId: userId,
              },
            }
          : false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // محدود کردن به 50 استوری اخیر
    });

    // بررسی اینکه آیا کاربر استوری را دیده است
    const storiesWithViewStatus = stories.map((story) => {
      const hasViewed = userId
        ? story.StoryViews && story.StoryViews.length > 0
        : false;
      
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
      
      return {
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
        hasNew: !hasViewed,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      };
    });

    return NextResponse.json({ stories: storiesWithViewStatus });
  } catch (error) {
    console.error("Error fetching stories:", error);
    const errorMessage =
      error instanceof Error ? error.message : "خطا در دریافت استوری‌ها";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - ایجاد استوری جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, content, imageUrl, videoUrl } = body;

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: "فیلدهای الزامی را پر کنید" },
        { status: 400 }
      );
    }

    // بررسی وجود company
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { Companies: true },
    });

    if (!user || !user.Companies) {
      return NextResponse.json({ error: "شرکت یافت نشد" }, { status: 404 });
    }

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

    // استوری بعد از 24 ساعت منقضی می‌شود
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // تبدیل imageUrl و videoUrl به Buffer برای Prisma
    // base64ToBuffer خودش prefix data:image/... را حذف می‌کند
    let imageData: Buffer | null = null;
    let videoData: Buffer | null = null;

    if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
      try {
        imageData = base64ToBuffer(imageUrl.trim());
        console.log("Image data processed:", {
          isBuffer: imageData instanceof Buffer,
          length: imageData.length,
          type: typeof imageData,
        });
      } catch (error) {
        console.error("Error processing image:", error);
      }
    }

    if (videoUrl && typeof videoUrl === "string" && videoUrl.trim()) {
      try {
        videoData = base64ToBuffer(videoUrl.trim());
        console.log("Video data processed:", {
          isBuffer: videoData instanceof Buffer,
          length: videoData.length,
          type: typeof videoData,
        });
      } catch (error) {
        console.error("Error processing video:", error);
      }
    }

    console.log("Creating story with data:", {
      hasImageData: !!imageData,
      hasVideoData: !!videoData,
      imageDataType: imageData ? typeof imageData : 'null',
      videoDataType: videoData ? typeof videoData : 'null',
    });

    const storyId = crypto.randomUUID();
    const now = new Date();

    // استفاده از raw query برای تبدیل صحیح Buffer به varbinary
    // Prisma برای SQL Server نمی‌تواند Buffer را به درستی تبدیل کند
    // باید از hex string با CONVERT استفاده کنیم
    if (imageData || videoData) {
      // تبدیل Buffer به hex string با prefix 0x
      const imageDataHex = imageData ? '0x' + imageData.toString('hex').toUpperCase() : null;
      const videoDataHex = videoData ? '0x' + videoData.toString('hex').toUpperCase() : null;

      // Escape کردن single quotes در title و content
      const escapedTitle = title.replaceAll("'", "''");
      const escapedContent = content ? content.replaceAll("'", "''") : null;
      const escapedType = type.replaceAll("'", "''");

      // استفاده از Prisma.$executeRawUnsafe با CONVERT برای تبدیل hex string به varbinary
      // SQL Server نیاز به CONVERT دارد برای تبدیل hex string به varbinary
      // برای NULL values باید از CAST استفاده کنیم تا SQL Server نوع داده را درست تشخیص دهد
      const imageDataSql = imageDataHex ? `CONVERT(varbinary(max), ${imageDataHex})` : 'CAST(NULL AS varbinary(max))';
      const videoDataSql = videoDataHex ? `CONVERT(varbinary(max), ${videoDataHex})` : 'CAST(NULL AS varbinary(max))';
      const contentSql = escapedContent ? `N'${escapedContent}'` : 'NULL';

      // اطمینان از اینکه همه فیلدهای string به درستی escape شده‌اند
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO Stories (id, companyId, type, title, content, imageData, videoData, expiresAt, views, createdAt, updatedAt)
         VALUES (N'${storyId}', N'${user.Companies.id}', N'${escapedType}', N'${escapedTitle}', ${contentSql}, ${imageDataSql}, ${videoDataSql}, '${expiresAt.toISOString()}', 0, '${now.toISOString()}', '${now.toISOString()}')`
      );
    } else {
      // اگر imageData و videoData نداریم، از create عادی استفاده می‌کنیم
      await prisma.stories.create({
        data: {
          id: storyId,
          companyId: user.Companies.id,
          type,
          title,
          content: content || null,
          imageData: null,
          videoData: null,
          expiresAt,
          views: 0,
          updatedAt: now,
        },
      });
    }

    // دریافت استوری ایجاد شده با relations
    const story = await prisma.stories.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        companyId: true,
        type: true,
        title: true,
        content: true,
        imageData: true,
        videoData: true,
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
      return NextResponse.json(
        { error: "Failed to create story" },
        { status: 500 }
      );
    }

    // تبدیل imageData و videoData به base64
    let storyImageUrl: string | null = null;
    let storyVideoUrl: string | null = null;
    
    if (story.imageData) {
      try {
        // اطمینان از اینکه imageData یک Buffer است
        const imageBuffer = story.imageData instanceof Buffer 
          ? story.imageData 
          : Buffer.from(story.imageData as any);
        storyImageUrl = bufferToBase64(imageBuffer);
        console.log(`Story ${story.id}: Image converted, length: ${storyImageUrl?.length || 0}`);
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
        storyVideoUrl = bufferToBase64(videoBuffer);
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
        imageUrl: storyImageUrl,
        videoUrl: storyVideoUrl,
        views: story.views,
        hasNew: true,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating story:", error);
    const errorMessage =
      error instanceof Error ? error.message : "خطا در ایجاد استوری";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
