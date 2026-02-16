import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // دریافت اطلاعات مناقصه و دسته‌بندی‌هایش
    const tender = await prisma.tenders.findUnique({
      where: { id },
      include: {
        TenderCategories: true,
      },
    });

    if (!tender) {
      return NextResponse.json({ error: "Tender not found" }, { status: 404 });
    }

    // دریافت دسته‌بندی‌های مناقصه
    const tenderCategories = tender.TenderCategories.map((c) => c.category);

    if (tenderCategories.length === 0) {
      return NextResponse.json({
        categoryCount: 0,
        categories: [],
      });
    }

    // برای هر دسته‌بندی، تأمین‌کنندگان مرتبط را پیدا کن
    const categoryAnalysis = await Promise.all(
      tenderCategories.map(async (category) => {
        // پیدا کردن تأمین‌کنندگانی که این دسته‌بندی را دارند
        // استفاده از contains برای تطابق جزئی (مثلاً "مکانیک" با "مکانیک (استاتیک)" تطابق دارد)
        const suppliers = await prisma.companies.findMany({
          where: {
            Users: {
              role: "supplier",
            },
            CompanyCategories: {
              some: {
                category: {
                  contains: category,
                },
              },
            },
          },
          include: {
            CompanyCategories: true,
            Reviews: {
              select: {
                rating: true,
              },
            },
            Products: {
              where: {
                category: {
                  contains: category,
                },
              },
              select: {
                price: true,
                priceRange: true,
              },
            },
            _count: {
              select: {
                Products: true,
                Reviews: true,
              },
            },
          },
        });

        // محاسبه میانگین قیمت از محصولات
        const prices: number[] = [];
        suppliers.forEach((supplier) => {
          supplier.Products.forEach((product) => {
            if (product.price) {
              const price = parseFloat(product.price.replace(/[^\d.]/g, ""));
              if (!isNaN(price)) {
                prices.push(price);
              }
            }
            if (product.priceRange) {
              // اگر priceRange به صورت "1000-2000" است
              const rangeMatch = product.priceRange.match(/(\d+)/g);
              if (rangeMatch && rangeMatch.length >= 1) {
                const avgPrice =
                  rangeMatch.reduce((sum, p) => sum + parseFloat(p), 0) /
                  rangeMatch.length;
                prices.push(avgPrice);
              }
            }
          });
        });

        const averagePrice =
          prices.length > 0
            ? prices.reduce((sum, p) => sum + p, 0) / prices.length
            : null;

        // پیدا کردن بهترین تأمین‌کننده (بر اساس verified، rating، تعداد محصولات)
        const suppliersWithScore = suppliers.map((supplier) => {
          const avgRating =
            supplier.Reviews.length > 0
              ? supplier.Reviews.reduce(
                  (sum: number, r: { rating: number }) => sum + r.rating,
                  0
                ) / supplier.Reviews.length
              : 0;

          const score =
            (supplier.isVerified ? 10 : 0) +
            avgRating * 5 +
            Math.min(supplier._count.Products, 10) * 0.5;

          return {
            id: supplier.id,
            name: supplier.name,
            logo: supplier.logo 
              ? bufferToBase64(supplier.logo instanceof Buffer ? supplier.logo : Buffer.from(supplier.logo as any))
              : null,
            verified: supplier.isVerified,
            rating: Math.round(avgRating * 10) / 10,
            productCount: supplier._count.Products,
            score,
          };
        });

        const bestSupplier =
          suppliersWithScore.sort((a, b) => b.score - a.score)[0] || null;

        return {
          category,
          supplierCount: suppliers.length,
          bestSupplier: bestSupplier
            ? {
                id: bestSupplier.id,
                name: bestSupplier.name,
                logo: bestSupplier.logo,
                verified: bestSupplier.verified,
                rating: bestSupplier.rating,
              }
            : null,
          averagePrice: averagePrice
            ? Math.round(averagePrice).toLocaleString("fa-IR")
            : null,
        };
      })
    );

    return NextResponse.json({
      categoryCount: tenderCategories.length,
      categories: categoryAnalysis,
    });
  } catch (error) {
    console.error("Error fetching suppliers analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
