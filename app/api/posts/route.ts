import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64, base64ToBuffer } from "@/lib/file-utils";

// GET - دریافت لیست پست‌ها
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const posts = (await prisma.posts.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        companyId: true,
        content: true,
        imageData: true, // اضافه کردن imageData به select
        tenderId: true,
        likes: true,
        comments: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            PostLikes: true,
            PostComments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as any[];

    // لاگ برای بررسی imageData
    console.log(`Total posts fetched: ${posts.length}`);
    posts.forEach((post: any) => {
      console.log(`Post ${post.id}:`, {
        hasImageData: !!post.imageData,
        imageDataType: post.imageData ? typeof post.imageData : "null",
        isBuffer: post.imageData instanceof Buffer,
        imageDataLength: post.imageData ? (post.imageData as Buffer).length : 0,
      });
    });

    // بررسی لایک و کامنت کاربر
    let postsWithUserData = posts;
    if (userId) {
      postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          const userLike = await prisma.postLikes.findUnique({
            where: {
              userId_postId: {
                userId,
                postId: post.id,
              },
            },
          });

          // دریافت تعداد views
          const viewsCount = await (prisma as any).postViews.count({
            where: { postId: post.id },
          });

          return {
            ...post,
            imageData: post.imageData, // حفظ imageData
            userLiked: !!userLike,
            likesCount: post._count.PostLikes,
            commentsCount: post._count.PostComments,
            viewsCount: viewsCount || post.views || 0,
          };
        })
      );
    } else {
      // دریافت views برای همه پست‌ها
      postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          const viewsCount = await (prisma as any).postViews.count({
            where: { postId: post.id },
          });
          return {
            ...post,
            imageData: post.imageData, // حفظ imageData
            userLiked: false,
            likesCount: post._count.PostLikes,
            commentsCount: post._count.PostComments,
            viewsCount: viewsCount || post.views || 0,
          };
        })
      );
    }

    // تبدیل imageData به base64
    const postsWithImages = postsWithUserData.map((post: any) => {
      let imageUrl: string | null = null;
      console.log(`Post ${post.id}: Checking imageData...`, {
        hasImageData: !!post.imageData,
        imageDataType: post.imageData ? typeof post.imageData : "null",
        isBuffer: post.imageData instanceof Buffer,
        imageDataLength: post.imageData ? (post.imageData as Buffer).length : 0,
      });

      if (post.imageData) {
        try {
          // اطمینان از اینکه imageData یک Buffer است
          const imageBuffer =
            post.imageData instanceof Buffer
              ? post.imageData
              : Buffer.from(post.imageData);

          imageUrl = bufferToBase64(imageBuffer);
          console.log(
            `Post ${post.id}: Image converted successfully, length: ${
              imageUrl?.length || 0
            }, preview: ${imageUrl?.substring(0, 50)}...`
          );
        } catch (error) {
          console.error(`Error converting image for post ${post.id}:`, error);
          console.error(`ImageData type:`, typeof post.imageData);
          console.error(
            `ImageData is Buffer:`,
            post.imageData instanceof Buffer
          );
        }
      } else {
        console.log(`Post ${post.id}: No imageData found`);
      }

      const likesCount =
        "likesCount" in post ? post.likesCount : post._count?.PostLikes || 0;
      const commentsCount =
        "commentsCount" in post
          ? post.commentsCount
          : post._count?.PostComments || 0;
      const viewsCount =
        "viewsCount" in post ? post.viewsCount : post.views || 0;
      const userLiked = "userLiked" in post ? post.userLiked : false;

      return {
        id: post.id,
        companyId: post.companyId,
        company: {
          id: post.Companies.id,
          name: post.Companies.name,
          logo: post.Companies.logo
            ? bufferToBase64(
                post.Companies.logo instanceof Buffer
                  ? post.Companies.logo
                  : Buffer.from(post.Companies.logo as any)
              )
            : null,
          isVerified: post.Companies.isVerified,
        },
        content: post.content,
        imageUrl,
        tenderId: (post as any).tenderId || null,
        likes: likesCount || 0,
        comments: commentsCount || 0,
        views: viewsCount || 0,
        userLiked,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ posts: postsWithImages });
  } catch (error) {
    console.error("Error fetching posts:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch posts";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - ایجاد پست جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content, image, tenderId } = body;

    console.log("Received POST request to /api/posts:", {
      userId,
      content: content ? content.substring(0, 100) + "..." : null,
      hasImage: !!image,
      imageType: typeof image,
      imageIsString: typeof image === "string",
      imageIsNull: image === null,
      imageIsUndefined: image === undefined,
      imageLength: image && typeof image === "string" ? image.length : 0,
      imagePreview:
        image && typeof image === "string" ? image.substring(0, 100) : null,
      tenderId,
    });

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // دریافت companyId از userId
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.Companies) {
      return NextResponse.json(
        { error: "Company not found for this user" },
        { status: 404 }
      );
    }

    const companyId = user.Companies.id;

    // تبدیل تصویر به Buffer
    let imageData: Buffer | null = null;

    // بررسی اینکه image یک string معتبر است
    // بررسی دقیق‌تر: اگر image null یا undefined است، skip کنیم
    if (image !== null && image !== undefined) {
      // بررسی اینکه آیا image یک object خالی است یا نه
      if (typeof image === "object" && Object.keys(image).length === 0) {
        console.log("Image is an empty object, skipping");
      } else {
        console.log(
          "Image received, type:",
          typeof image,
          "value type:",
          image?.constructor?.name
        );

        // اگر image یک string است، مستقیماً استفاده می‌کنیم
        let imageString: string | null = null;
        if (typeof image === "string") {
          imageString = image;
        } else if (typeof image === "object" && image !== null) {
          // اگر image یک object است، سعی می‌کنیم آن را به string تبدیل کنیم
          console.warn("Image is an object, trying to extract string value");
          // بررسی اینکه آیا object دارای property خاصی است
          if ("data" in image && typeof image.data === "string") {
            imageString = image.data;
          } else if ("value" in image && typeof image.value === "string") {
            imageString = image.value;
          } else {
            // سعی می‌کنیم از JSON.stringify استفاده کنیم
            try {
              const stringified = JSON.stringify(image);
              // اگر stringified یک string quoted است، parse می‌کنیم
              if (stringified.startsWith('"') && stringified.endsWith('"')) {
                imageString = JSON.parse(stringified);
              } else if (stringified === "null" || stringified === "{}") {
                // اگر null یا empty object است، skip کنیم
                imageString = null;
              } else {
                imageString = stringified;
              }
            } catch (e) {
              console.error("Error stringifying image object:", e);
              imageString = null;
            }
          }
        }

        if (
          imageString &&
          typeof imageString === "string" &&
          imageString.trim()
        ) {
          try {
            let base64String = imageString.trim();
            console.log("Processing image:", {
              hasImage: true,
              imageLength: base64String.length,
              startsWithDataImage: base64String.startsWith("data:image"),
              mimeType: base64String.startsWith("data:image")
                ? base64String.substring(5, base64String.indexOf(";"))
                : "unknown",
              preview: base64String.substring(0, 100),
            });

            // اگر base64 است، تبدیل به Buffer
            if (base64String.startsWith("data:image")) {
              // حذف prefix data:image/...;base64,
              // ممکن است data:image/jpeg;base64, یا data:image/png;base64, باشد
              const commaIndex = base64String.indexOf(",");
              if (commaIndex === -1) {
                console.error("No comma found in data URL");
              } else {
                const base64Data = base64String.substring(commaIndex + 1);
                console.log("Extracted base64 data:", {
                  hasBase64Data: !!base64Data,
                  base64DataLength: base64Data ? base64Data.length : 0,
                  base64DataPreview: base64Data
                    ? base64Data.substring(0, 50)
                    : null,
                  firstChars: base64Data ? base64Data.substring(0, 20) : null,
                });

                if (base64Data && base64Data.length > 0) {
                  try {
                    // حذف whitespace و newlines که ممکن است در base64 string وجود داشته باشد
                    const cleanedBase64 = base64Data.replace(/\s/g, "");

                    if (cleanedBase64.length === 0) {
                      console.error("Base64 data is empty after cleaning");
                    } else {
                      // استفاده مستقیم از Buffer.from برای تبدیل base64 به Buffer
                      imageData = Buffer.from(cleanedBase64, "base64");

                      // بررسی صحت تبدیل با بررسی magic bytes
                      if (imageData.length > 0) {
                        const firstByte = imageData[0];
                        const secondByte = imageData[1];
                        const thirdByte = imageData[2];

                        // JPEG magic bytes: FF D8 FF
                        const isJPEG =
                          firstByte === 0xff &&
                          secondByte === 0xd8 &&
                          thirdByte === 0xff;
                        // PNG magic bytes: 89 50 4E 47
                        const isPNG =
                          firstByte === 0x89 &&
                          secondByte === 0x50 &&
                          thirdByte === 0x4e &&
                          imageData[3] === 0x47;

                        console.log("Converted to buffer:", {
                          isBuffer: imageData instanceof Buffer,
                          bufferLength: imageData.length,
                          isValidJPEG: isJPEG,
                          isValidPNG: isPNG,
                          firstBytes: Array.from(imageData.slice(0, 4))
                            .map((b) => "0x" + b.toString(16).toUpperCase())
                            .join(" "),
                        });

                        if (!isJPEG && !isPNG) {
                          console.warn(
                            "Warning: Image may not be valid JPEG or PNG. Magic bytes:",
                            Array.from(imageData.slice(0, 4))
                              .map((b) => "0x" + b.toString(16).toUpperCase())
                              .join(" ")
                          );
                        }
                      } else {
                        console.error("Buffer is empty after conversion");
                        imageData = null;
                      }
                    }
                  } catch (error) {
                    console.error("Error converting base64 to buffer:", error);
                    console.error("Error details:", {
                      message:
                        error instanceof Error ? error.message : String(error),
                      base64Length: base64Data.length,
                      base64Preview: base64Data.substring(0, 100),
                    });
                    imageData = null;
                  }
                } else {
                  console.error("No base64 data found after splitting");
                }
              }
            } else {
              // تصویر base64 خالص است (بدون prefix)
              // حذف whitespace و کاراکترهای اضافی
              base64String = base64String.replace(/\s/g, "");
              console.log("Processing base64 without prefix:", {
                cleanedLength: base64String.length,
                preview: base64String.substring(0, 50),
              });
              if (base64String.length > 0) {
                try {
                  // استفاده مستقیم از Buffer.from برای base64 خالص
                  imageData = Buffer.from(base64String, "base64");
                  console.log("Converted to buffer:", {
                    isBuffer: imageData instanceof Buffer,
                    bufferLength: imageData ? imageData.length : 0,
                  });
                } catch (error) {
                  console.error("Error converting base64 to buffer:", error);
                  // Fallback: استفاده از base64ToBuffer
                  imageData = base64ToBuffer(base64String);
                }
              } else {
                console.error("Base64 string is empty after cleaning");
              }
            }

            console.log(
              "Image processed:",
              imageData
                ? `Buffer size: ${imageData.length} bytes`
                : "Failed to process"
            );
          } catch (error) {
            console.error("Error processing image:", error);
            console.error("Error details:", {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
            console.error("Image string length:", imageString?.length);
            console.error("Image preview:", imageString?.substring(0, 100));
            // در صورت خطا، imageData را null می‌گذاریم
            imageData = null;
          }
        } else {
          console.log("Image string is empty or invalid after processing:", {
            imageString,
            imageStringType: typeof imageString,
            imageStringLength: imageString ? imageString.length : 0,
          });
        }
      }
    } else {
      console.log("No image provided or invalid format:", {
        hasImage: !!image,
        imageType: typeof image,
        imageIsNull: image === null,
        imageIsUndefined: image === undefined,
        imageLength: image
          ? typeof image === "string"
            ? image.length
            : "not string"
          : 0,
      });
    }

    const postId = crypto.randomUUID();
    const now = new Date();

    // استفاده از raw query برای تبدیل صحیح Buffer به varbinary
    // Prisma برای SQL Server نمی‌تواند Buffer را به درستی تبدیل کند
    // باید از hex string با CONVERT استفاده کنیم
    if (imageData) {
      // تبدیل Buffer به hex string با prefix 0x
      const imageDataHex = "0x" + imageData.toString("hex").toUpperCase();

      // Escape کردن single quotes در content
      const escapedContent = content ? content.replaceAll("'", "''") : null;
      const contentSql = escapedContent ? `N'${escapedContent}'` : "NULL";
      const imageDataSql = `CONVERT(varbinary(max), ${imageDataHex})`;
      const tenderIdSql = tenderId ? `N'${tenderId}'` : "NULL";

      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO Posts (id, companyId, content, imageData, tenderId, likes, comments, views, createdAt, updatedAt)
         VALUES (N'${postId}', N'${companyId}', ${contentSql}, ${imageDataSql}, ${tenderIdSql}, 0, 0, 0, '${now.toISOString()}', '${now.toISOString()}')`
      );
    } else {
      // اگر imageData نداریم، از create عادی استفاده می‌کنیم
      const escapedContent = content ? content.replaceAll("'", "''") : null;
      const contentSql = escapedContent ? `N'${escapedContent}'` : "NULL";
      const tenderIdSql = tenderId ? `N'${tenderId}'` : "NULL";

      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO Posts (id, companyId, content, tenderId, likes, comments, views, createdAt, updatedAt)
         VALUES (N'${postId}', N'${companyId}', ${contentSql}, ${tenderIdSql}, 0, 0, 0, '${now.toISOString()}', '${now.toISOString()}')`
      );
    }

    // دریافت پست ایجاد شده با relations
    const post = await prisma.posts.findUnique({
      where: { id: postId },
      include: {
        Companies: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    // تبدیل imageData به base64
    const postResult: any = post;
    let imageUrl: string | null = null;
    if (postResult.imageData) {
      try {
        const imageBuffer =
          postResult.imageData instanceof Buffer
            ? postResult.imageData
            : Buffer.from(postResult.imageData as any);
        imageUrl = bufferToBase64(imageBuffer);
      } catch (error) {
        console.error("Error converting image to base64:", error);
      }
    }

    return NextResponse.json({
      post: {
        id: postResult.id,
        companyId: postResult.companyId,
        company: {
          id: postResult.Companies?.id || postResult.companyId,
          name: postResult.Companies?.name || "",
          logo: postResult.Companies?.logo
            ? bufferToBase64(
                postResult.Companies.logo instanceof Buffer
                  ? postResult.Companies.logo
                  : Buffer.from(postResult.Companies.logo as any)
              )
            : null,
          isVerified: postResult.Companies?.isVerified || false,
        },
        content: postResult.content,
        imageUrl,
        tenderId: postResult.tenderId || null,
        likes: 0,
        comments: 0,
        views: 0,
        userLiked: false,
        createdAt: postResult.createdAt.toISOString(),
        updatedAt: postResult.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create post";
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
