import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";
import { Prisma } from "@prisma/client";

// Types
type ReviewWithCompany = Prisma.ReviewsGetPayload<{
  include: {
    Companies: {
      select: {
        id: true;
        name: true;
        logo: true;
      };
    };
  };
}>;

interface TransformedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  contractorId: string;
  contractor: {
    id: string;
    name: string;
    logo: string | null;
  };
}

// Product and Document types are inferred from Prisma query results

// GET - دریافت جزئیات یک تأمین‌کننده
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Fetching supplier with ID:", id);

    // دریافت اطلاعات company
    const supplier = await prisma.companies.findUnique({
      where: { id },
      include: {
        Users: {
          select: {
            role: true,
          },
        },
        CompanyCategories: true,
        Products: true,
        Documents: true,
        Projects: true,
        _count: {
          select: {
            Products: true,
            Projects: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا این company واقعاً یک supplier است
    if (supplier.Users?.role !== "supplier") {
      return NextResponse.json(
        { error: "This company is not a supplier" },
        { status: 404 }
      );
    }

    // دریافت reviews به صورت جداگانه
    let reviews: TransformedReview[] = [];
    let avgRating = 0;

    try {
      const reviewsData = await prisma.reviews.findMany({
        where: { companyId: id },
        include: {
          Companies: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // تبدیل ساختار برای سازگاری با frontend
      reviews = reviewsData.map((r: ReviewWithCompany) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        contractorId: r.contractorId,
        contractor: {
          id: r.Companies.id,
          name: r.Companies.name,
          logo: r.Companies.logo ? bufferToBase64(Buffer.from(r.Companies.logo)) : null,
        },
      }));

      // محاسبه امتیاز متوسط
      if (reviews.length > 0) {
        avgRating =
          reviews.reduce(
            (sum: number, r: TransformedReview) => sum + (r.rating || 0),
            0
          ) / reviews.length;
      }
    } catch (reviewError) {
      console.error("Error fetching reviews:", reviewError);
      // اگر reviews وجود نداشت، ادامه می‌دهیم با آرایه خالی
      reviews = [];
    }

    // اطمینان از اینکه همه فیلدها به درستی تنظیم شده‌اند
    const supplierResponse = {
      id: supplier.id,
      name: supplier.name || "",
      logo: supplier.logo ? bufferToBase64(Buffer.from(supplier.logo)) : null,
      bio: supplier.bio || null,
      address: supplier.address || null,
      website: supplier.website || null,
      officePhone: supplier.officePhone || null,
      email: supplier.email || null,
      activityType: supplier.activityType || null,
      legalType: supplier.legalType || null,
      companyType: supplier.companyType || null,
      isKnowledgeBased: supplier.isKnowledgeBased === true,
      workingHours: supplier.workingHours || null,
      welcomeMessage: supplier.welcomeMessage || null,
      isVerified: supplier.isVerified || false,
      rating: Math.round(avgRating * 10) / 10,
      categories: supplier.CompanyCategories || [],
      products: (supplier.Products || []).map((product) => ({
        ...product,
        image: product.image ? bufferToBase64(Buffer.from(product.image)) : null,
      })),
      projects: supplier.Projects || [],
      documents: (() => {
        // استخراج vendorMemberships از bio و تبدیل به documents
        const documentsFromDB = (supplier.Documents || []).map((doc) => ({
          ...doc,
          fileUrl: doc.fileData ? bufferToBase64(Buffer.from(doc.fileData)) : null,
        }));

        // استخراج vendorMemberships از bio
        let vendorMemberships: Array<{
          id: string;
          name: string;
          isActive: boolean;
          expiryDate: string;
          logo?: string;
        }> = [];

        if (supplier.bio) {
          try {
            const bioData = JSON.parse(supplier.bio);
            if (bioData.vendorMemberships && Array.isArray(bioData.vendorMemberships)) {
              vendorMemberships = bioData.vendorMemberships;
            }
          } catch {
            // اگر bio JSON نیست، vendorMemberships وجود ندارد
          }
        }

        // تبدیل vendorMemberships به documents
        const documentsFromVendorMemberships = vendorMemberships.map((membership) => ({
          id: membership.id,
          type: "عضویت در وندور لیست / انجمن / کمیته",
          title: membership.name,
          fileUrl: membership.logo || null,
          logo: membership.logo || null, // برای نمایش لوگو
          createdAt: new Date().toISOString(),
          // اضافه کردن اطلاعات اضافی برای نمایش
          isActive: membership.isActive,
          expiryDate: membership.expiryDate,
        }));

        // ترکیب documents از دیتابیس و vendorMemberships
        return [...documentsFromDB, ...documentsFromVendorMemberships];
      })(),
      reviews: reviews,
    };

    return NextResponse.json({
      supplier: supplierResponse,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    // نمایش جزئیات خطا برای دیباگ
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to fetch supplier",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
