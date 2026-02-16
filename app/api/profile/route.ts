import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { base64ToBuffer, bufferToBase64 } from "@/lib/file-utils";

// Helper function برای تبدیل base64 string به hex string برای SQL Server
function base64ToHex(base64String: string | null | undefined): string | null {
  if (!base64String || typeof base64String !== "string" || !base64String.trim()) {
    return null;
  }
  try {
    const buffer = base64ToBuffer(base64String.trim());
    return '0x' + buffer.toString('hex').toUpperCase();
  } catch (error) {
    console.error("Error converting base64 to hex:", error);
    return null;
  }
}

// Helper function برای escape کردن single quotes در SQL
function escapeSqlString(str: string | null | undefined): string {
  if (!str) return 'NULL';
  return `N'${str.replaceAll("'", "''")}'`;
}

// GET - دریافت پروفایل کاربر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("Profile API called with userId:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Companies: {
          include: {
            CompanyCategories: true,
            Products: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            Projects: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            Reviews: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.error("User not found for userId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // تبدیل blob fields به base64 برای frontend
    let company = user.Companies;
    if (company) {
      const products =
        company.Products?.map((p) => ({
          ...p,
          image: p.image
            ? bufferToBase64(
                p.image instanceof Buffer ? p.image : Buffer.from(p.image as any)
              )
            : null,
        })) ?? [];
      const projects = company.Projects ?? [];
      const reviews = company.Reviews ?? [];

      company = {
        ...company,
        logo: company.logo
          ? bufferToBase64(
              company.logo instanceof Buffer
                ? company.logo
                : Buffer.from(company.logo as any)
            )
          : null,
        letterheadImage: company.letterheadImage
          ? bufferToBase64(
              company.letterheadImage instanceof Buffer
                ? company.letterheadImage
                : Buffer.from(company.letterheadImage as any)
            )
          : null,
        hseCertificate: company.hseCertificate
          ? bufferToBase64(
              company.hseCertificate instanceof Buffer
                ? company.hseCertificate
                : Buffer.from(company.hseCertificate as any)
            )
          : null,
        ministryCertificate: company.ministryCertificate
          ? bufferToBase64(
              company.ministryCertificate instanceof Buffer
                ? company.ministryCertificate
                : Buffer.from(company.ministryCertificate as any)
            )
          : null,
        qualificationCertificate: company.qualificationCertificate
          ? bufferToBase64(
              company.qualificationCertificate instanceof Buffer
                ? company.qualificationCertificate
                : Buffer.from(company.qualificationCertificate as any)
            )
          : null,
        rankCertificate: company.rankCertificate
          ? bufferToBase64(
              company.rankCertificate instanceof Buffer
                ? company.rankCertificate
                : Buffer.from(company.rankCertificate as any)
            )
          : null,
        products,
        projects,
        reviews,
      } as typeof company & {
        logo: string | null;
        letterheadImage: string | null;
        hseCertificate: string | null;
        ministryCertificate: string | null;
        qualificationCertificate: string | null;
        rankCertificate: string | null;
        products: typeof products;
        projects: typeof projects;
        reviews: typeof reviews;
      };

      // حذف کلیدهای PascalCase برای سازگاری فرانت
      delete (company as any).Products;
      delete (company as any).Projects;
      delete (company as any).Reviews;

      // تبدیل CompanyCategories به categories
      if (company.CompanyCategories) {
        (company as any).categories = company.CompanyCategories.map(
          (cc: { category: string }) => ({ category: cc.category })
        );
        delete (company as any).CompanyCategories;
      } else {
        (company as any).categories = [];
      }

      // استخراج vendorMemberships از bio
      if (company.bio) {
        try {
          const bioData = JSON.parse(company.bio);
          if (bioData.vendorMemberships && Array.isArray(bioData.vendorMemberships)) {
            (company as any).vendorMemberships = bioData.vendorMemberships;
          }
        } catch {
          // اگر bio JSON نیست، vendorMemberships وجود ندارد
        }
      }
    }

    // تبدیل Companies به company برای سازگاری با frontend
    const userResponse = {
      ...user,
      company: company || null,
    };
    // حذف Companies از response برای جلوگیری از confusion
    const userResponseObj: Record<string, unknown> = userResponse;
    if ("Companies" in userResponseObj) {
      delete userResponseObj.Companies;
    }

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH - به‌روزرسانی پروفایل
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, companyData, categories, vendorMemberships } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { Companies: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    type CompanyWithCategories = Prisma.CompaniesGetPayload<{
      include: { CompanyCategories: true };
    }>;

    let company: CompanyWithCategories | null = null;

    if (user.Companies) {
      // بررسی اینکه آیا فیلدهای binary وجود دارند
      const hasBinaryFields = !!(
        companyData.logo ||
        companyData.letterheadImage ||
        companyData.rankCertificate ||
        companyData.ministryCertificate ||
        companyData.hseCertificate ||
        companyData.qualificationCertificate
      );

      if (hasBinaryFields) {
        // استفاده از raw query برای فیلدهای binary
        const logoHex = base64ToHex(companyData.logo);
        const letterheadImageHex = base64ToHex(companyData.letterheadImage);
        const rankCertificateHex = base64ToHex(companyData.rankCertificate);
        const ministryCertificateHex = base64ToHex(companyData.ministryCertificate);
        const hseCertificateHex = base64ToHex(companyData.hseCertificate);
        const qualificationCertificateHex = base64ToHex(companyData.qualificationCertificate);

        // Parse existing bio data if it's a JSON string
        let bioData: any = {};
        if (companyData.bio) {
          try {
            bioData = JSON.parse(companyData.bio);
          } catch {
            // If not JSON, treat as plain text
            bioData = { about: companyData.bio };
          }
        }
        
        // Add vendorMemberships if provided (even if empty array to clear previous data)
        if (vendorMemberships !== undefined && Array.isArray(vendorMemberships)) {
          bioData.vendorMemberships = vendorMemberships;
        }
        
        const bioValue = Object.keys(bioData).length > 0 ? JSON.stringify(bioData) : null;

        // ساخت UPDATE query با hex strings برای فیلدهای binary
        const updateFields: string[] = [];
        updateFields.push(`name = ${escapeSqlString(companyData.name)}`);
        updateFields.push(`companyType = ${escapeSqlString(companyData.companyType)}`);
        updateFields.push(`legalType = ${escapeSqlString(companyData.legalType)}`);
        updateFields.push(`activityType = ${escapeSqlString(companyData.activityType)}`);
        updateFields.push(`isKnowledgeBased = ${companyData.isKnowledgeBased ? 1 : 0}`);
        updateFields.push(`registrationNumber = ${escapeSqlString(companyData.registrationNumber)}`);
        updateFields.push(`nationalId = ${escapeSqlString(companyData.nationalId)}`);
        updateFields.push(`establishmentYear = ${escapeSqlString(companyData.establishmentYear)}`);
        updateFields.push(`city = ${escapeSqlString(companyData.city)}`);
        updateFields.push(`province = ${escapeSqlString(companyData.province)}`);
        updateFields.push(`address = ${escapeSqlString(companyData.address)}`);
        updateFields.push(`officePhone = ${escapeSqlString(companyData.officePhone)}`);
        updateFields.push(`email = ${escapeSqlString(companyData.email)}`);
        updateFields.push(`website = ${escapeSqlString(companyData.website)}`);
        updateFields.push(`logo = ${logoHex || 'NULL'}`);
        updateFields.push(`letterheadImage = ${letterheadImageHex || 'NULL'}`);
        updateFields.push(`workingHours = ${escapeSqlString(companyData.workingHours)}`);
        updateFields.push(`welcomeMessage = ${escapeSqlString(companyData.welcomeMessage)}`);
        updateFields.push(`mainActivityAreas = ${escapeSqlString(companyData.mainActivityAreas)}`);
        updateFields.push(`equipmentList = ${escapeSqlString(companyData.equipmentList)}`);
        updateFields.push(`keyPersonnelCount = ${escapeSqlString(companyData.keyPersonnelCount)}`);
        updateFields.push(`rank = ${escapeSqlString(companyData.rank)}`);
        updateFields.push(`rankCertificate = ${rankCertificateHex || 'NULL'}`);
        updateFields.push(`ministryCertificate = ${ministryCertificateHex || 'NULL'}`);
        updateFields.push(`hseCertificate = ${hseCertificateHex || 'NULL'}`);
        updateFields.push(`qualificationCertificate = ${qualificationCertificateHex || 'NULL'}`);
        updateFields.push(`iso9001 = ${companyData.iso9001 ? 1 : 0}`);
        updateFields.push(`iso14001 = ${companyData.iso14001 ? 1 : 0}`);
        updateFields.push(`iso45001 = ${companyData.iso45001 ? 1 : 0}`);
        updateFields.push(`iso50001 = ${companyData.iso50001 ? 1 : 0}`);
        updateFields.push(`wpsPqr = ${companyData.wpsPqr ? 1 : 0}`);
        updateFields.push(`asme = ${companyData.asme ? 1 : 0}`);
        updateFields.push(`api = ${companyData.api ? 1 : 0}`);
        updateFields.push(`personnelCertificates = ${escapeSqlString(companyData.personnelCertificates)}`);
        updateFields.push(`bio = ${escapeSqlString(bioValue)}`);
        updateFields.push(`updatedAt = '${new Date().toISOString()}'`);

        await (prisma as any).$executeRawUnsafe(
          `UPDATE Companies SET ${updateFields.join(', ')} WHERE id = N'${user.Companies.id}'`
        );

        // دریافت شرکت به‌روزرسانی شده
        company = await prisma.companies.findUnique({
          where: { id: user.Companies.id },
          include: {
            CompanyCategories: true,
          },
        });
      } else {
        // اگر فیلدهای binary نداریم، از Prisma update استفاده می‌کنیم
        company = await prisma.companies.update({
          where: { id: user.Companies.id },
          data: {
            name: companyData.name,
            companyType: companyData.companyType || null,
            legalType: companyData.legalType || null,
            activityType: companyData.activityType || null,
            isKnowledgeBased: companyData.isKnowledgeBased || false,
            registrationNumber: companyData.registrationNumber || null,
            nationalId: companyData.nationalId || null,
            establishmentYear: companyData.establishmentYear || null,
            city: companyData.city,
            province: companyData.province,
            address: companyData.address || null,
            officePhone: companyData.officePhone || null,
            email: companyData.email || null,
            website: companyData.website || null,
            workingHours: companyData.workingHours || null,
            welcomeMessage: companyData.welcomeMessage || null,
            mainActivityAreas: companyData.mainActivityAreas || null,
            equipmentList: companyData.equipmentList || null,
            keyPersonnelCount: companyData.keyPersonnelCount || null,
            rank: companyData.rank || null,
            iso9001: companyData.iso9001 || false,
            iso14001: companyData.iso14001 || false,
            iso45001: companyData.iso45001 || false,
            iso50001: companyData.iso50001 || false,
            wpsPqr: companyData.wpsPqr || false,
            asme: companyData.asme || false,
            api: companyData.api || false,
            personnelCertificates: companyData.personnelCertificates || null,
            bio: (() => {
              // Parse existing bio data if it's a JSON string
              let bioData: any = {};
              if (companyData.bio) {
                try {
                  bioData = JSON.parse(companyData.bio);
                } catch {
                  // If not JSON, treat as plain text
                  bioData = { about: companyData.bio };
                }
              }
              
              // Add vendorMemberships if provided (even if empty array to clear previous data)
              if (vendorMemberships !== undefined && Array.isArray(vendorMemberships)) {
                bioData.vendorMemberships = vendorMemberships;
              }
              
              return Object.keys(bioData).length > 0 ? JSON.stringify(bioData) : null;
            })(),
            updatedAt: new Date(),
          },
          include: {
            CompanyCategories: true,
          },
        });
      }

      // به‌روزرسانی دسته‌بندی‌ها
      if (company && categories && Array.isArray(categories)) {
        // حذف دسته‌بندی‌های قدیمی
        await prisma.companyCategories.deleteMany({
          where: { companyId: company.id },
        });

        // افزودن دسته‌بندی‌های جدید
        if (categories.length > 0) {
          const companyId = company.id;
          await prisma.companyCategories.createMany({
            data: categories.map((cat: string) => ({
              id: crypto.randomUUID(),
              companyId: companyId,
              category: cat,
            })),
          });
        }

        // دریافت مجدد company با CompanyCategories به‌روز شده
        company = await prisma.companies.findUnique({
          where: { id: company.id },
          include: {
            CompanyCategories: true,
          },
        });
      }
    } else {
      // ایجاد شرکت جدید - ثبت‌نام از طریق تکمیل پروفایل
      if (!companyData.name || !companyData.city || !companyData.province) {
        return NextResponse.json(
          { error: "نام شرکت، شهر و استان الزامی هستند" },
          { status: 400 }
        );
      }

      // برای تأمین‌کنندگان، نوع شخصیت حقوقی و نوع فعالیت الزامی است
      if (
        user.role === "supplier" &&
        (!companyData.legalType || !companyData.activityType)
      ) {
        return NextResponse.json(
          {
            error: "نوع شخصیت حقوقی و نوع فعالیت برای تأمین‌کنندگان الزامی است",
          },
          { status: 400 }
        );
      }

      // بررسی اینکه آیا فیلدهای binary وجود دارند
      const hasBinaryFields = !!(
        companyData.logo ||
        companyData.letterheadImage ||
        companyData.rankCertificate ||
        companyData.ministryCertificate ||
        companyData.hseCertificate ||
        companyData.qualificationCertificate
      );

      const companyId = crypto.randomUUID();
      const now = new Date();

      if (hasBinaryFields) {
        // استفاده از raw query برای فیلدهای binary
        const logoHex = base64ToHex(companyData.logo);
        const letterheadImageHex = base64ToHex(companyData.letterheadImage);
        const rankCertificateHex = base64ToHex(companyData.rankCertificate);
        const ministryCertificateHex = base64ToHex(companyData.ministryCertificate);
        const hseCertificateHex = base64ToHex(companyData.hseCertificate);
        const qualificationCertificateHex = base64ToHex(companyData.qualificationCertificate);

        // Parse existing bio data if it's a JSON string
        let bioData: any = {};
        if (companyData.bio) {
          try {
            bioData = JSON.parse(companyData.bio);
          } catch {
            // If not JSON, treat as plain text
            bioData = { about: companyData.bio };
          }
        }
        
        // Add vendorMemberships if provided (even if empty array to clear previous data)
        if (vendorMemberships !== undefined && Array.isArray(vendorMemberships)) {
          bioData.vendorMemberships = vendorMemberships;
        }
        
        const bioValue = Object.keys(bioData).length > 0 ? JSON.stringify(bioData) : null;

        // ساخت INSERT query با hex strings برای فیلدهای binary
        await (prisma as any).$executeRawUnsafe(
          `INSERT INTO Companies (id, userId, name, companyType, legalType, activityType, isKnowledgeBased, registrationNumber, nationalId, establishmentYear, city, province, address, officePhone, email, website, logo, letterheadImage, workingHours, welcomeMessage, mainActivityAreas, equipmentList, keyPersonnelCount, rank, rankCertificate, ministryCertificate, hseCertificate, qualificationCertificate, iso9001, iso14001, iso45001, iso50001, wpsPqr, asme, api, personnelCertificates, bio, isVerified, createdAt, updatedAt)
           VALUES (N'${companyId}', N'${userId}', ${escapeSqlString(companyData.name)}, ${escapeSqlString(companyData.companyType || companyData.legalType)}, ${escapeSqlString(companyData.legalType)}, ${escapeSqlString(companyData.activityType)}, ${companyData.isKnowledgeBased ? 1 : 0}, ${escapeSqlString(companyData.registrationNumber)}, ${escapeSqlString(companyData.nationalId)}, ${escapeSqlString(companyData.establishmentYear)}, ${escapeSqlString(companyData.city)}, ${escapeSqlString(companyData.province)}, ${escapeSqlString(companyData.address)}, ${escapeSqlString(companyData.officePhone)}, ${escapeSqlString(companyData.email)}, ${escapeSqlString(companyData.website)}, ${logoHex || 'NULL'}, ${letterheadImageHex || 'NULL'}, ${escapeSqlString(companyData.workingHours)}, ${escapeSqlString(companyData.welcomeMessage)}, ${escapeSqlString(companyData.mainActivityAreas)}, ${escapeSqlString(companyData.equipmentList)}, ${escapeSqlString(companyData.keyPersonnelCount)}, ${escapeSqlString(companyData.rank)}, ${rankCertificateHex || 'NULL'}, ${ministryCertificateHex || 'NULL'}, ${hseCertificateHex || 'NULL'}, ${qualificationCertificateHex || 'NULL'}, ${companyData.iso9001 ? 1 : 0}, ${companyData.iso14001 ? 1 : 0}, ${companyData.iso45001 ? 1 : 0}, ${companyData.iso50001 ? 1 : 0}, ${companyData.wpsPqr ? 1 : 0}, ${companyData.asme ? 1 : 0}, ${companyData.api ? 1 : 0}, ${escapeSqlString(companyData.personnelCertificates)}, ${escapeSqlString(bioValue)}, 0, '${now.toISOString()}', '${now.toISOString()}')`
        );

        // دریافت شرکت ایجاد شده
        company = await prisma.companies.findUnique({
          where: { id: companyId },
          include: {
            CompanyCategories: true,
          },
        });
      } else {
        // اگر فیلدهای binary نداریم، از Prisma create استفاده می‌کنیم
        company = await prisma.companies.create({
          data: {
            id: companyId,
            userId,
            name: companyData.name,
            updatedAt: now,
            city: companyData.city,
            province: companyData.province,
            companyType: companyData.companyType || companyData.legalType || null,
            legalType: companyData.legalType || null,
            activityType: companyData.activityType || null,
            isKnowledgeBased: companyData.isKnowledgeBased || false,
            registrationNumber: companyData.registrationNumber || null,
            nationalId: companyData.nationalId || null,
            establishmentYear: companyData.establishmentYear || null,
            address: companyData.address || null,
            officePhone: companyData.officePhone || null,
            email: companyData.email || null,
            website: companyData.website || null,
            workingHours: companyData.workingHours || null,
            welcomeMessage: companyData.welcomeMessage || null,
            mainActivityAreas: companyData.mainActivityAreas || null,
            equipmentList: companyData.equipmentList || null,
            keyPersonnelCount: companyData.keyPersonnelCount || null,
            rank: companyData.rank || null,
            iso9001: companyData.iso9001 || false,
            iso14001: companyData.iso14001 || false,
            iso45001: companyData.iso45001 || false,
            iso50001: companyData.iso50001 || false,
            wpsPqr: companyData.wpsPqr || false,
            asme: companyData.asme || false,
            api: companyData.api || false,
            personnelCertificates: companyData.personnelCertificates || null,
            bio: (() => {
              // Parse existing bio data if it's a JSON string
              let bioData: any = {};
              if (companyData.bio) {
                try {
                  bioData = JSON.parse(companyData.bio);
                } catch {
                  // If not JSON, treat as plain text
                  bioData = { about: companyData.bio };
                }
              }
              
              // Add vendorMemberships if provided (even if empty array to clear previous data)
              if (vendorMemberships !== undefined && Array.isArray(vendorMemberships)) {
                bioData.vendorMemberships = vendorMemberships;
              }
              
              return Object.keys(bioData).length > 0 ? JSON.stringify(bioData) : null;
            })(),
          },
          include: {
            CompanyCategories: true,
          },
        });
      }

      // افزودن دسته‌بندی‌ها
      if (
        company &&
        categories &&
        Array.isArray(categories) &&
        categories.length > 0
      ) {
        const companyId = company.id;
        await prisma.companyCategories.createMany({
          data: categories.map((cat: string) => ({
            id: crypto.randomUUID(),
            companyId: companyId,
            category: cat,
          })),
        });

        // دریافت مجدد company با CompanyCategories به‌روز شده
        company = await prisma.companies.findUnique({
          where: { id: companyId },
          include: {
            CompanyCategories: true,
          },
        });
      }
    }

    // دریافت شرکت به‌روزرسانی شده با دسته‌بندی‌ها
    if (!company) {
      return NextResponse.json(
        { error: "Failed to create or update company" },
        { status: 500 }
      );
    }

    const updatedCompany = await prisma.companies.findUnique({
      where: { id: company.id },
      include: {
        CompanyCategories: true,
        Products: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        Projects: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        Reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    // تنظیم profileCompleted به true بعد از ذخیره موفق پروفایل
    await prisma.users.update({
      where: { id: userId },
      data: {
        profileCompleted: true,
      },
    });

    // دریافت user به‌روزرسانی شده با company
    const updatedUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Companies: {
          include: {
            CompanyCategories: true,
            Products: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            Projects: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            Reviews: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    // تبدیل Companies به company برای سازگاری با frontend
    const companyResponseData =
      updatedCompany || updatedUser?.Companies || null;

    // استخراج vendorMemberships از bio اگر وجود دارد
    let vendorMembershipsData: unknown[] = [];
    let originalBio = companyResponseData?.bio || "";
    if (companyResponseData?.bio) {
      try {
        const bioData = JSON.parse(companyResponseData.bio);
        if (
          bioData.vendorMemberships &&
          Array.isArray(bioData.vendorMemberships)
        ) {
          vendorMembershipsData = bioData.vendorMemberships;
          originalBio = bioData.originalBio || "";
        }
      } catch {
        // bio یک JSON معتبر نیست، پس vendorMemberships ندارد
      }
    }

    const companyWithVendors = companyResponseData
      ? {
          ...companyResponseData,
          bio: originalBio,
          vendorMemberships: vendorMembershipsData,
        }
      : null;

    const userResponse: Record<string, unknown> = {
      ...updatedUser,
      company: companyWithVendors,
    };
    // حذف Companies از response برای جلوگیری از confusion
    if ("Companies" in userResponse) {
      delete userResponse.Companies;
    }

    return NextResponse.json({
      user: userResponse,
      company: companyWithVendors,
      profileCompleted: updatedUser?.profileCompleted || false,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
