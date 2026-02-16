import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { base64ToBuffer } from "@/lib/file-utils";

type ProductRequest = {
  companyId: string | number;
  name: string;
  category: string;
  brand?: string | number | null;
  price?: string | number | null;
  priceRange?: string | number | null;
  description?: string | null;
  specifications?: string | null;
  unit?: string | null;
  image?: string | null;
};

// Force node runtime to allow Buffer/prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - افزودن محصول جدید
export async function POST(request: Request) {
  try {
    // تلاش برای خواندن JSON ورودی
    let body: ProductRequest;
    try {
      const parsed = (await request.json()) as unknown;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid body");
      }
      body = parsed as ProductRequest;
    } catch {
      return NextResponse.json(
        { error: "ساختار ورودی نامعتبر است؛ بدنه باید JSON باشد" },
        { status: 400 }
      );
    }

    const {
      companyId,
      name,
      category,
      brand,
      price,
      priceRange,
      description,
      specifications,
      unit,
      image,
    } = body;

    // اطمینان از وجود مقادیر اصلی
    if (
      companyId === undefined ||
      companyId === null ||
      name === undefined ||
      name === null ||
      category === undefined ||
      category === null
    ) {
      return NextResponse.json(
        { error: "شناسه شرکت، نام و دسته‌بندی محصول الزامی هستند" },
        { status: 400 }
      );
    }

    const companyIdNorm = companyId.toString().trim();

    // اطمینان از وجود شرکت
    const companyExists = await prisma.companies.findUnique({
      where: { id: companyIdNorm },
      select: { id: true },
    });

    if (!companyExists) {
      return NextResponse.json(
        { error: "شرکت یافت نشد؛ لطفاً پروفایل را کامل کنید" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده و تبدیل ایمن تصویر به Buffer (برای SQL Server VarBinary)
    let imageBuffer: Buffer | null = null;
    if (image !== undefined && image !== null) {
      if (typeof image !== "string") {
        return NextResponse.json(
          { error: "فرمت تصویر نامعتبر است؛ لطفاً دوباره آپلود کنید" },
          { status: 400 }
        );
      }

      const normalizedImage = image.trim();
      if (normalizedImage) {
        try {
          const decoded = base64ToBuffer(normalizedImage);
          if (!Buffer.isBuffer(decoded) || decoded.length === 0) {
            throw new Error("Invalid image buffer");
          }
          imageBuffer = decoded;
        } catch {
          return NextResponse.json(
            { error: "فرمت تصویر نامعتبر است؛ لطفاً دوباره آپلود کنید" },
            { status: 400 }
          );
        }
      }
    }

    // نرمال‌سازی/trim فیلدها
    const nameNorm = name.toString().trim();
    const categoryNorm = category.toString().trim();
    const brandNorm =
      brand !== undefined && brand !== null ? brand.toString().trim() : null;
    const priceNorm =
      price !== undefined && price !== null ? price.toString().trim() : null;
    const priceRangeNorm =
      priceRange !== undefined && priceRange !== null
        ? priceRange.toString().trim()
        : null;
    const unitNorm =
      unit !== undefined && unit !== null ? unit.toString().trim() : null;
    const descriptionNorm =
      description !== undefined && description !== null
        ? description.toString().trim()
        : null;
    const specificationsNorm =
      specifications !== undefined && specifications !== null
        ? specifications.toString().trim()
        : null;

    // اطمینان از خالی نبودن فیلدهای اصلی
    if (!companyIdNorm || !nameNorm || !categoryNorm) {
      return NextResponse.json(
        { error: "شناسه شرکت، نام و دسته‌بندی نمی‌توانند خالی باشند" },
        { status: 400 }
      );
    }

    // اعتبارسنجی طول فیلدها (حداکثر 255 کاراکتر برای متنی‌های کوتاه)
    const tooLong =
      nameNorm.length > 255 ||
      categoryNorm.length > 255 ||
      (brandNorm && brandNorm.length > 255) ||
      (priceNorm && priceNorm.length > 255) ||
      (priceRangeNorm && priceRangeNorm.length > 255) ||
      (unitNorm && unitNorm.length > 100);

    if (tooLong) {
      return NextResponse.json(
        { error: "طول فیلدهای متنی نباید بیش از حد مجاز باشد (۲۵۵ کاراکتر)" },
        { status: 400 }
      );
    }

    const productData: Prisma.ProductsUncheckedCreateInput = {
      id: crypto.randomUUID(),
      companyId: companyIdNorm,
      name: nameNorm,
      category: categoryNorm,
      brand: brandNorm,
      price: priceNorm,
      priceRange: priceRangeNorm,
      description: descriptionNorm,
      specifications: specificationsNorm,
      unit: unitNorm,
      updatedAt: new Date(),
    };

    if (imageBuffer && Buffer.isBuffer(imageBuffer)) {
      // Prisma + SQL Server expects a binary type (Buffer/Uint8Array) for Bytes fields
      // Using Uint8Array avoids the nvarchar → varbinary implicit conversion error
      productData.image = new Uint8Array(imageBuffer);
    }

    const product = await prisma.products.create({
      data: productData,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    // Prisma known errors → 400 instead of 500
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2000") {
        return NextResponse.json(
          {
            error: "طول یکی از فیلدها بیش از حد مجاز است",
            code: error.code,
            meta: error.meta,
          },
          { status: 400 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error: "شناسه شرکت نامعتبر است",
            code: error.code,
            meta: error.meta,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: "خطای داده‌ای در ثبت محصول",
          code: error.code,
          meta: error.meta,
        },
        { status: 400 }
      );
    }

    const errorObj = typeof error === "object" && error !== null ? error : null;
    const errorCode =
      errorObj && "code" in errorObj
        ? (errorObj as { code?: string | number }).code
        : undefined;
    const errorMeta =
      errorObj && "meta" in errorObj
        ? (errorObj as { meta?: unknown }).meta
        : undefined;
    const errorStack =
      errorObj && "stack" in errorObj
        ? (errorObj as { stack?: string }).stack
        : undefined;

    console.error("Error creating product:", {
      message: error instanceof Error ? error.message : error,
      code: errorCode,
      meta: errorMeta,
    });
    const message = error instanceof Error ? error.message : "Unknown error";
    // لاگ جزئیات بیشتری از خطا برای دیباگ
    try {
      console.error("Error stack:", errorStack);
    } catch {}
    return NextResponse.json(
      {
        error: "Failed to create product",
        details: message,
        code: errorCode,
        meta: errorMeta,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
