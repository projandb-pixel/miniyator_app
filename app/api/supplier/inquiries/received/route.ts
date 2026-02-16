import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت استعلام‌های دریافتی یک تأمین‌کننده
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // دریافت تمام استعلام‌هایی که به این تأمین‌کننده ارسال شده‌اند
    // این کار از طریق notification انجام می‌شود، اما بهتر است مستقیماً از PriceInquiry استفاده کنیم
    // برای این کار باید لیست استعلام‌ها را بگیریم و بررسی کنیم که آیا این تأمین‌کننده در لیست supplierIds بوده یا نه

    // راه حل بهتر: از notification استفاده کنیم
    const supplier = await prisma.companies.findUnique({
      where: { id: supplierId },
      select: { userId: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // دریافت notification های مربوط به استعلام قیمت
    const notifications = await prisma.notifications.findMany({
      where: {
        userId: supplier.userId,
        type: "price_inquiry",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      "Notifications found:",
      notifications.length,
      "for supplier:",
      supplierId,
      "userId:",
      supplier.userId
    );

    // لاگ تمام notification ها برای دیباگ
    notifications.forEach((n, index) => {
      console.log(`Notification ${index + 1}:`, {
        id: n.id,
        url: n.url,
        type: n.type,
        createdAt: n.createdAt,
      });
    });

    // استخراج inquiryId از URL notification
    const inquiryIds = notifications
      .map((n) => {
        // پشتیبانی از هر دو فرمت: /price-inquiries/[id] و /supplier/home
        const match = n.url?.match(/\/price-inquiries\/([^\/]+)/);
        if (match) {
          console.log(`Extracted inquiryId from URL ${n.url}: ${match[1]}`);
          return match[1];
        }
        // اگر URL برابر /supplier/home است، باید inquiryId را از metadata یا data دیگری بگیریم
        // اما فعلاً فقط از URL استفاده می‌کنیم
        console.warn(`Could not extract inquiryId from URL: ${n.url}`);
        return null;
      })
      .filter((id): id is string => id !== null);

    console.log("Extracted inquiry IDs:", inquiryIds);

    if (inquiryIds.length === 0) {
      console.log("No inquiry IDs found, returning empty array");
      return NextResponse.json({ inquiries: [] });
    }

    // دریافت استعلام‌ها با raw query (چون tenderId در دیتابیس وجود ندارد)
    try {
      // استفاده از raw query برای دریافت استعلام‌ها
      // اگر inquiryIds خالی است، آرایه خالی برگردان
      if (inquiryIds.length === 0) {
        return NextResponse.json({ inquiries: [] });
      }

      // استفاده از Prisma.$queryRaw برای امنیت (SQL Server از @p1, @p2 استفاده می‌کند)
      // اما برای IN با array، باید از روش دیگری استفاده کنیم
      // راه حل: استفاده از Prisma.$queryRaw با template literal برای هر ID
      let inquiriesRaw: Array<{
        id: string;
        contractorId: string;
        category: string;
        product: string;
        quantity: string;
        deliveryTime: string;
        description: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
      }> = [];

      // اگر فقط یک ID داریم، از query ساده استفاده می‌کنیم
      if (inquiryIds.length === 1) {
        inquiriesRaw = await prisma.$queryRaw<
          Array<{
            id: string;
            contractorId: string;
            category: string;
            product: string;
            quantity: string;
            deliveryTime: string;
            description: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
          }>
        >`
          SELECT id, contractorId, category, product, quantity, deliveryTime, description, status, createdAt, updatedAt
          FROM PriceInquiries
          WHERE id = ${inquiryIds[0]}
          ORDER BY createdAt DESC
        `;
      } else {
        // برای چند ID، از OR استفاده می‌کنیم (امن‌تر از string concatenation)
        const conditions = inquiryIds
          .map((id) => `id = '${id.replace(/'/g, "''")}'`)
          .join(" OR ");
        const query = `
          SELECT id, contractorId, category, product, quantity, deliveryTime, description, status, createdAt, updatedAt
          FROM PriceInquiries
          WHERE ${conditions}
          ORDER BY createdAt DESC
        `;
        inquiriesRaw = await prisma.$queryRawUnsafe<
          Array<{
            id: string;
            contractorId: string;
            category: string;
            product: string;
            quantity: string;
            deliveryTime: string;
            description: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
          }>
        >(query);
      }

      console.log("Raw inquiries found:", inquiriesRaw.length);

      // دریافت اطلاعات پیمانکار و responses برای هر inquiry
      const inquiriesWithDetails = await Promise.all(
        inquiriesRaw.map(async (inquiry) => {
          // دریافت اطلاعات پیمانکار
          const contractor = await prisma.companies.findUnique({
            where: { id: inquiry.contractorId },
            select: { id: true, name: true, logo: true },
          });

          // تبدیل logo به base64 string اگر Buffer است
          let logoString: string | null = null;
          if (contractor?.logo) {
            try {
              if (Buffer.isBuffer(contractor.logo)) {
                logoString = bufferToBase64(contractor.logo);
              } else if (typeof contractor.logo === "string") {
                logoString = contractor.logo;
              } else {
                // اگر object است، آن را نادیده می‌گیریم
                logoString = null;
              }
            } catch (logoError) {
              console.error("Error converting logo to base64:", logoError);
              logoString = null;
            }
          }

          // دریافت responses با raw query
          const responses = await prisma.$queryRaw<
            Array<{
              id: string;
              inquiryId: string;
              supplierId: string;
              price: string;
              deliveryTime: string | null;
              notes: string | null;
              createdAt: Date;
            }>
          >`
            SELECT id, inquiryId, supplierId, price, deliveryTime, notes, createdAt
            FROM PriceInquiryResponses
            WHERE inquiryId = ${inquiry.id} AND supplierId = ${supplierId}
          `;

          // ساخت object جدید با فقط فیلدهای مورد نیاز (بدون spread operator برای جلوگیری از مشکلات)
          const formattedInquiry = {
            id: String(inquiry.id),
            contractorId: String(inquiry.contractorId),
            category: String(inquiry.category),
            product: String(inquiry.product),
            quantity: String(inquiry.quantity),
            deliveryTime: String(inquiry.deliveryTime),
            description: inquiry.description
              ? String(inquiry.description)
              : null,
            status: String(inquiry.status),
            createdAt:
              inquiry.createdAt instanceof Date
                ? inquiry.createdAt.toISOString()
                : String(inquiry.createdAt),
            updatedAt:
              inquiry.updatedAt instanceof Date
                ? inquiry.updatedAt.toISOString()
                : String(inquiry.updatedAt),
            company: contractor
              ? {
                  id: String(contractor.id),
                  name: String(contractor.name),
                  logo: logoString,
                }
              : null,
            Companies: contractor
              ? {
                  id: String(contractor.id),
                  name: String(contractor.name),
                  logo: logoString,
                }
              : null, // برای سازگاری با کدهای قدیمی
            responses: responses.map((r) => ({
              id: String(r.id),
              inquiryId: String(r.inquiryId),
              supplierId: String(r.supplierId),
              price: String(r.price),
              deliveryTime: r.deliveryTime ? String(r.deliveryTime) : null,
              notes: r.notes ? String(r.notes) : null,
              createdAt:
                r.createdAt instanceof Date
                  ? r.createdAt.toISOString()
                  : String(r.createdAt),
            })),
            PriceInquiryResponses: responses.map((r) => ({
              id: String(r.id),
              inquiryId: String(r.inquiryId),
              supplierId: String(r.supplierId),
              price: String(r.price),
              deliveryTime: r.deliveryTime ? String(r.deliveryTime) : null,
              notes: r.notes ? String(r.notes) : null,
              createdAt:
                r.createdAt instanceof Date
                  ? r.createdAt.toISOString()
                  : String(r.createdAt),
            })), // برای سازگاری با کدهای قدیمی
          };

          return formattedInquiry;
        })
      );

      console.log("Final inquiries with details:", inquiriesWithDetails.length);

      return NextResponse.json({ inquiries: inquiriesWithDetails });
    } catch (error) {
      console.error("Error fetching inquiries with raw query:", error);
      // Fallback: استفاده از findMany اگر raw query خطا داد
      try {
        const inquiries = await prisma.priceInquiries.findMany({
          where: {
            id: {
              in: inquiryIds,
            },
          },
          include: {
            Companies: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            PriceInquiryResponses: {
              where: {
                supplierId: supplierId,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // تبدیل Date objects به string و ساخت object جدید با فقط فیلدهای مورد نیاز
        const formattedInquiries = inquiries.map((inquiry) => {
          // تبدیل logo به base64 string اگر Buffer است
          let logoString: string | null = null;
          if (inquiry.Companies?.logo) {
            try {
              if (Buffer.isBuffer(inquiry.Companies.logo)) {
                logoString = bufferToBase64(inquiry.Companies.logo);
              } else if (typeof inquiry.Companies.logo === "string") {
                logoString = inquiry.Companies.logo;
              } else {
                // اگر object است، آن را نادیده می‌گیریم
                logoString = null;
              }
            } catch (logoError) {
              console.error("Error converting logo to base64:", logoError);
              logoString = null;
            }
          }

          const company = inquiry.Companies
            ? {
                id: String(inquiry.Companies.id),
                name: String(inquiry.Companies.name),
                logo: logoString,
              }
            : null;

          return {
            id: String(inquiry.id),
            contractorId: String(inquiry.contractorId),
            category: String(inquiry.category),
            product: String(inquiry.product),
            quantity: String(inquiry.quantity),
            deliveryTime: String(inquiry.deliveryTime),
            description: inquiry.description
              ? String(inquiry.description)
              : null,
            status: String(inquiry.status),
            createdAt:
              inquiry.createdAt instanceof Date
                ? inquiry.createdAt.toISOString()
                : String(inquiry.createdAt),
            updatedAt:
              inquiry.updatedAt instanceof Date
                ? inquiry.updatedAt.toISOString()
                : String(inquiry.updatedAt),
            company: company,
            Companies: company, // برای سازگاری با کدهای قدیمی
            responses: inquiry.PriceInquiryResponses.map((r) => ({
              id: String(r.id),
              inquiryId: String(r.inquiryId),
              supplierId: String(r.supplierId),
              price: String(r.price),
              deliveryTime: r.deliveryTime ? String(r.deliveryTime) : null,
              notes: r.notes ? String(r.notes) : null,
              createdAt:
                r.createdAt instanceof Date
                  ? r.createdAt.toISOString()
                  : String(r.createdAt),
            })),
            PriceInquiryResponses: inquiry.PriceInquiryResponses.map((r) => ({
              id: String(r.id),
              inquiryId: String(r.inquiryId),
              supplierId: String(r.supplierId),
              price: String(r.price),
              deliveryTime: r.deliveryTime ? String(r.deliveryTime) : null,
              notes: r.notes ? String(r.notes) : null,
              createdAt:
                r.createdAt instanceof Date
                  ? r.createdAt.toISOString()
                  : String(r.createdAt),
            })), // برای سازگاری با کدهای قدیمی
          };
        });

        return NextResponse.json({ inquiries: formattedInquiries });
      } catch (fallbackError) {
        console.error("Error in fallback findMany:", fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error("Error fetching received inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch received inquiries" },
      { status: 500 }
    );
  }
}
