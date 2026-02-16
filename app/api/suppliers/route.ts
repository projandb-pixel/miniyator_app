import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت لیست تأمین‌کنندگان
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);
    const category = searchParams.get("category");
    const verified = searchParams.get("verified");

    const where: any = {
      Users: {
        role: "supplier",
      },
    };

    // Debug: لاگ کردن query
    console.log(
      "Fetching suppliers with where:",
      JSON.stringify(where, null, 2)
    );

    if (category) {
      where.CompanyCategories = {
        some: {
          category: category,
        },
      };
    }

    if (verified === "true") {
      where.isVerified = true;
    }

    const suppliers = await prisma.companies.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        Users: {
          select: {
            role: true,
          },
        },
        CompanyCategories: true,
        Products: {
          select: {
            id: true,
          },
        },
        Reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            Products: true,
            Reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Debug: لاگ کردن تعداد تأمین‌کنندگان یافت شده
    console.log(`Found ${suppliers.length} suppliers`);

    // دریافت محصولات برای محاسبه priceLevel
    const suppliersWithProducts = await Promise.all(
      suppliers.map(async (supplier) => {
        const products = await prisma.products.findMany({
          where: { companyId: supplier.id },
          select: { price: true, priceRange: true },
        });

        return { ...supplier, products };
      })
    );

    // محاسبه امتیاز و تعداد محصولات
    const suppliersWithStats = suppliersWithProducts.map((supplier) => {
      const avgRating =
        supplier.Reviews.length > 0
          ? supplier.Reviews.reduce(
              (sum: number, r: { rating: number }) => sum + r.rating,
              0
            ) / supplier.Reviews.length
          : 0;

      // محاسبه priceLevel از محصولات
      let priceLevel: "low" | "medium" | "high" = "medium";
      if (supplier.products && supplier.products.length > 0) {
        const prices = supplier.products
          .map((p: { price: string | null; priceRange: string | null }) => {
            if (p.price) {
              const numPrice = Number.parseFloat(p.price.replace(/[^\d.]/g, ""));
              return isNaN(numPrice) ? null : numPrice;
            }
            return null;
          })
          .filter((p): p is number => p !== null);

        if (prices.length > 0) {
          const avgPrice =
            prices.reduce((sum: number, p: number) => sum + p, 0) /
            prices.length;
          // تقسیم‌بندی بر اساس میانگین قیمت (می‌تواند تنظیم شود)
          if (avgPrice < 1000000) priceLevel = "low";
          else if (avgPrice < 10000000) priceLevel = "medium";
          else priceLevel = "high";
        }
      }

      return {
        id: supplier.id,
        name: supplier.name,
        logo: supplier.logo 
          ? bufferToBase64(supplier.logo instanceof Buffer ? supplier.logo : Buffer.from(supplier.logo as any))
          : null,
        categories: supplier.CompanyCategories.map(
          (c: { category: string }) => c.category
        ),
        productCount: supplier._count.Products,
        verified: supplier.isVerified,
        rating: Math.round(avgRating * 10) / 10,
        priceLevel,
      };
    });

    // اگر هیچ تأمین‌کننده‌ای یافت نشد، یک پیام مفید برگردان
    if (suppliersWithStats.length === 0) {
      console.log(
        "No suppliers found in database. Consider running seed script."
      );
      return NextResponse.json({
        suppliers: [],
        message:
          "هیچ تأمین‌کننده‌ای در دیتابیس یافت نشد. لطفاً seed script را اجرا کنید.",
      });
    }

    return NextResponse.json({ suppliers: suppliersWithStats });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", errorMessage, errorStack);
    return NextResponse.json(
      {
        error: "Failed to fetch suppliers",
        details: errorMessage,
        suppliers: [],
      },
      { status: 500 }
    );
  }
}
