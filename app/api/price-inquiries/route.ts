import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - دریافت استعلام‌های قیمت
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get("contractorId");

    if (!contractorId) {
      return NextResponse.json(
        { error: "Contractor ID is required" },
        { status: 400 }
      );
    }

    const inquiries = await prisma.priceInquiries.findMany({
      where: {
        contractorId,
      },
      include: {
        PriceInquiryResponses: {
          include: {
            PriceInquiries: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // افزودن اطلاعات supplier به هر response
    const inquiriesWithSupplierInfo = await Promise.all(
      inquiries.map(async (inquiry) => {
        const responsesWithSupplier = await Promise.all(
          inquiry.PriceInquiryResponses.map(async (response) => {
            const supplier = await prisma.companies.findUnique({
              where: { id: response.supplierId },
              select: { id: true, name: true, logo: true },
            });
            return {
              ...response,
              supplier: supplier || null,
            };
          })
        );
        return {
          ...inquiry,
          responses: responsesWithSupplier,
        };
      })
    );

    return NextResponse.json({ inquiries: inquiriesWithSupplierInfo });
  } catch (error) {
    console.error("Error fetching price inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch price inquiries" },
      { status: 500 }
    );
  }
}

// POST - ایجاد استعلام قیمت جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      contractorId,
      category,
      product,
      quantity,
      deliveryTime,
      description,
      supplierIds,
    } = body;

    if (!contractorId || !category || !product || !quantity || !deliveryTime) {
      return NextResponse.json(
        { error: "تمام فیلدهای الزامی را پر کنید" },
        { status: 400 }
      );
    }

    if (
      !supplierIds ||
      !Array.isArray(supplierIds) ||
      supplierIds.length === 0
    ) {
      return NextResponse.json(
        { error: "حداقل یک تأمین‌کننده انتخاب کنید" },
        { status: 400 }
      );
    }

    // ایجاد استعلام
    const inquiry = await prisma.priceInquiries.create({
      data: {
        id: crypto.randomUUID(),
        contractorId,
        tenderId: null, // در صورت نیاز می‌توان اضافه کرد
        category,
        product,
        quantity,
        deliveryTime,
        description: description || null,
        status: "pending",
        updatedAt: new Date(),
      },
    });

    // دریافت اطلاعات پیمانکار برای notification
    const contractor = await prisma.companies.findUnique({
      where: { id: contractorId },
      select: { name: true, userId: true },
    });

    // ایجاد notification برای هر تأمین‌کننده
    const notifications = [];
    for (const supplierId of supplierIds) {
      // دریافت userId از companyId
      const supplier = await prisma.companies.findUnique({
        where: { id: supplierId },
        select: { userId: true, name: true },
      });

      if (supplier && supplier.userId) {
        const notification = await prisma.notifications.create({
          data: {
            id: crypto.randomUUID(),
            userId: supplier.userId,
            type: "price_inquiry",
            title: "استعلام قیمت جدید",
            message: `${
              contractor?.name || "یک پیمانکار"
            } برای ${product} استعلام قیمت ارسال کرده است`,
            url: `/price-inquiries/${inquiry.id}`,
          },
        });
        notifications.push(notification);
      }
    }

    // ایجاد notification برای پیمانکار
    if (contractor && contractor.userId) {
      await prisma.notifications.create({
        data: {
          id: crypto.randomUUID(),
          userId: contractor.userId,
          type: "price_inquiry_sent",
          title: "استعلام ارسال شد",
          message: `استعلام شما برای ${product} به ${supplierIds.length} تأمین‌کننده ارسال شد`,
          url: `/price-inquiries/${inquiry.id}`,
        },
      });
    }

    return NextResponse.json(
      {
        inquiry,
        notificationsCount: notifications.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating price inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create price inquiry" },
      { status: 500 }
    );
  }
}
