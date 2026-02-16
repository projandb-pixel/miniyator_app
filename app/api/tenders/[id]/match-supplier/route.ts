import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - بررسی تطابق کالاهای تامین‌کننده با نیازمندی‌های مناقصه
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // دریافت مناقصه با نیازمندی‌ها و دسته‌بندی‌ها
    const tender = await prisma.tenders.findUnique({
      where: { id },
      include: {
        TenderCategories: true,
        TenderRequirements: true,
      },
    });

    if (!tender) {
      return NextResponse.json({ error: "Tender not found" }, { status: 404 });
    }

    // دریافت شرکت تامین‌کننده
    const supplier = await prisma.companies.findUnique({
      where: { id: supplierId },
      include: {
        Products: true,
        CompanyCategories: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // بررسی تطابق دسته‌بندی‌ها
    const tenderCategories = tender.TenderCategories.map((c) =>
      c.category.toLowerCase()
    );
    const supplierCategories = supplier.CompanyCategories.map((c) =>
      c.category.toLowerCase()
    );
    const matchedCategories = tenderCategories.filter((cat) =>
      supplierCategories.some(
        (supCat) => supCat.includes(cat) || cat.includes(supCat)
      )
    );

    // بررسی تطابق کالاها با نیازمندی‌ها
    const matchedRequirements: Array<{
      requirement: {
        id: string;
        item: string | null;
        category: string | null;
        description: string | null;
      };
      matchedProducts: Array<{ id: string; name: string; category: string }>;
    }> = [];

    tender.TenderRequirements.forEach((req) => {
      const matchedProducts = supplier.Products.filter((product) => {
        // تطابق بر اساس دسته‌بندی
        const categoryMatch =
          req.category &&
          product.category.toLowerCase().includes(req.category.toLowerCase());

        // تطابق بر اساس نام کالا
        const nameMatch =
          req.item &&
          (product.name.toLowerCase().includes(req.item.toLowerCase()) ||
            req.item.toLowerCase().includes(product.name.toLowerCase()));

        // تطابق بر اساس توضیحات
        const descMatch =
          req.description &&
          product.description &&
          (product.description
            .toLowerCase()
            .includes(req.description.toLowerCase()) ||
            req.description
              .toLowerCase()
              .includes(product.description.toLowerCase()));

        return categoryMatch || nameMatch || descMatch;
      });

      if (matchedProducts.length > 0) {
        matchedRequirements.push({
          requirement: req,
          matchedProducts: matchedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
          })),
        });
      }
    });

    // محاسبه درصد تطابق
    const categoryMatchPercentage =
      tenderCategories.length > 0
        ? (matchedCategories.length / tenderCategories.length) * 100
        : 0;

    const requirementMatchPercentage =
      tender.TenderRequirements.length > 0
        ? (matchedRequirements.length / tender.TenderRequirements.length) * 100
        : 0;

    const overallMatchPercentage =
      (categoryMatchPercentage + requirementMatchPercentage) / 2;

    // تعیین مناسب بودن مناقصه
    const isSuitable = overallMatchPercentage >= 30; // حداقل 30% تطابق

    return NextResponse.json({
      isSuitable,
      matchPercentage: Math.round(overallMatchPercentage),
      categoryMatch: {
        percentage: Math.round(categoryMatchPercentage),
        matched: matchedCategories,
        total: tenderCategories.length,
      },
      requirementMatch: {
        percentage: Math.round(requirementMatchPercentage),
        matched: matchedRequirements.length,
        total: tender.TenderRequirements.length,
        details: matchedRequirements,
      },
      tenderCategories: tenderCategories,
      tenderRequirements: tender.TenderRequirements,
    });
  } catch (error) {
    console.error("Error matching supplier with tender:", error);
    return NextResponse.json(
      { error: "Failed to match supplier with tender" },
      { status: 500 }
    );
  }
}
