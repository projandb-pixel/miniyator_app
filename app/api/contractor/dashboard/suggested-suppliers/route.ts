import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت تأمین‌کنندگان پیشنهادی بر اساس تخصص‌های پیمانکار
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // دریافت اطلاعات پیمانکار و تخصص‌هایش
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Companies: {
          include: {
            CompanyCategories: true,
          },
        },
      },
    });

    if (!user || !user.Companies) {
      return NextResponse.json({ suppliers: [] });
    }

    // دریافت تخصص‌های پیمانکار
    const contractorCategories = user.Companies.CompanyCategories.map(
      (c) => c.category
    );

    // اگر پیمانکار تخصصی ندارد، تأمین‌کنندگان verified را پیشنهاد بده
    if (contractorCategories.length === 0) {
      const suppliers = await prisma.companies.findMany({
        where: {
          Users: {
            role: "supplier",
          },
          isVerified: true,
        },
        include: {
          CompanyCategories: true,
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
        orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
        take: limit,
      });

      const suppliersWithStats = suppliers.map((supplier) => {
        const avgRating =
          supplier.Reviews.length > 0
            ? supplier.Reviews.reduce(
                (sum: number, r: { rating: number }) => sum + r.rating,
                0
              ) / supplier.Reviews.length
            : 0;

        return {
          id: supplier.id,
          name: supplier.name,
          category: supplier.CompanyCategories[0]?.category || "عمومی",
          categories: supplier.CompanyCategories.map((c) => c.category),
          logo: supplier.logo
            ? bufferToBase64(supplier.logo instanceof Buffer ? supplier.logo : Buffer.from(supplier.logo as any))
            : (supplier.name && supplier.name.length > 0 ? supplier.name.charAt(0) : "?"),
          rating: Math.round(avgRating * 10) / 10,
          verified: supplier.isVerified,
        };
      });

      return NextResponse.json({ suppliers: suppliersWithStats });
    }

    // پیدا کردن تأمین‌کنندگانی که دسته‌بندی مشترک دارند
    const suppliers = await prisma.companies.findMany({
      where: {
        Users: {
          role: "supplier",
        },
        CompanyCategories: {
          some: {
            category: {
              in: contractorCategories,
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
        _count: {
          select: {
            Products: true,
            Reviews: true,
          },
        },
      },
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      take: limit * 2, // بیشتر بگیریم تا بعداً فیلتر کنیم
    });

    // محاسبه امتیاز تطابق و مرتب‌سازی
    const suppliersWithMatchScore = suppliers.map((supplier) => {
      const supplierCategories = supplier.CompanyCategories.map(
        (c) => c.category
      );

      // تعداد دسته‌بندی‌های مشترک
      const commonCategories = supplierCategories.filter((cat) =>
        contractorCategories.some(
          (cc) =>
            cc.includes(cat) ||
            cat.includes(cc) ||
            cc.toLowerCase().includes(cat.toLowerCase()) ||
            cat.toLowerCase().includes(cc.toLowerCase())
        )
      ).length;

      const avgRating =
        supplier.Reviews.length > 0
          ? supplier.Reviews.reduce(
              (sum: number, r: { rating: number }) => sum + r.rating,
              0
            ) / supplier.Reviews.length
          : 0;

      // امتیاز: تعداد دسته‌بندی‌های مشترک + verified + rating
      const matchScore =
        commonCategories * 10 + (supplier.isVerified ? 5 : 0) + avgRating;

      return {
        id: supplier.id,
        name: supplier.name,
        category: supplierCategories[0] || "عمومی",
        categories: supplierCategories,
        logo: supplier.logo
          ? bufferToBase64(supplier.logo as Buffer)
          : null,
        rating: Math.round(avgRating * 10) / 10,
        verified: supplier.isVerified,
        matchScore,
      };
    });

    // مرتب‌سازی بر اساس امتیاز تطابق و محدود کردن
    const sortedSuppliers = suppliersWithMatchScore
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore, ...supplier }) => {
        // matchScore is used for sorting but removed from final output
        return supplier;
      });

    // اگر تأمین‌کننده کافی پیدا نشد، تأمین‌کنندگان verified را اضافه کن
    if (sortedSuppliers.length < limit) {
      const additionalSuppliers = await prisma.companies.findMany({
        where: {
          Users: {
            role: "supplier",
          },
          isVerified: true,
          id: {
            notIn: sortedSuppliers.map((s) => s.id),
          },
        },
        include: {
          CompanyCategories: true,
          Reviews: {
            select: {
              rating: true,
            },
          },
        },
        take: limit - sortedSuppliers.length,
      });

      additionalSuppliers.forEach((supplier) => {
        const avgRating =
          supplier.Reviews.length > 0
            ? supplier.Reviews.reduce(
                (sum: number, r: { rating: number }) => sum + r.rating,
                0
              ) / supplier.Reviews.length
            : 0;

        const supplierData: {
          id: string;
          name: string;
          category: string;
          categories: string[];
          logo: string;
          rating: number;
          verified: boolean;
        } = {
          id: supplier.id,
          name: supplier.name,
          category: supplier.CompanyCategories[0]?.category || "عمومی",
          categories: supplier.CompanyCategories.map((c) => c.category),
          logo:
            (supplier.logo ? bufferToBase64(supplier.logo as Buffer) : null) ??
            supplier.name.charAt(0),
          rating: Math.round(avgRating * 10) / 10,
          verified: supplier.isVerified,
        };
        sortedSuppliers.push(supplierData);
      });
    }

    return NextResponse.json({ suppliers: sortedSuppliers });
  } catch (error) {
    console.error("Error fetching suggested suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggested suppliers" },
      { status: 500 }
    );
  }
}
