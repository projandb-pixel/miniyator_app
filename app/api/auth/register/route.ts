import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ثبت‌نام اولیه با شماره موبایل، رمز عبور، نام شرکت و نقش
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, companyName, role } = body;

    // اعتبارسنجی ورودی‌ها
    if (!phone || !password || !companyName || !role) {
      return NextResponse.json(
        { error: "همه فیلدها الزامی است" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    // بررسی فرمت شماره موبایل
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "شماره موبایل باید با 09 شروع شود و 11 رقم باشد" },
        { status: 400 }
      );
    }

    // بررسی طول رمز عبور
    if (password.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل 6 کاراکتر باشد" },
        { status: 400 }
      );
    }

    // بررسی نقش
    if (role !== "contractor" && role !== "supplier") {
      return NextResponse.json(
        { error: "نقش باید contractor یا supplier باشد" },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر با این شماره موبایل
    const existingUser = await prisma.users.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "لطفاً ابتدا شماره موبایل خود را با کد تأیید تأیید کنید" },
        { status: 400 }
      );
    }

    // بررسی اینکه شماره موبایل تأیید شده باشد
    if (!existingUser.isVerified) {
      return NextResponse.json(
        { error: "لطفاً ابتدا شماره موبایل خود را با کد تأیید تأیید کنید" },
        { status: 400 }
      );
    }

    // اگر کاربر قبلاً ثبت‌نام کرده و رمز عبور دارد
    if (existingUser.password) {
      return NextResponse.json(
        { error: "کاربری با این شماره موبایل قبلاً ثبت‌نام کرده است" },
        { status: 409 }
      );
    }

    // Hash کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // به‌روزرسانی کاربر و ایجاد شرکت در یک transaction
    const result = await prisma.$transaction(async (tx) => {
      // به‌روزرسانی کاربر موجود (که قبلاً OTP دریافت و تأیید کرده)
      const user = await tx.users.update({
        where: { phone: normalizedPhone },
        data: {
          password: hashedPassword,
          role: role,
          profileCompleted: false,
          // isVerified قبلاً true است و باید باقی بماند
        },
      });

      // بررسی اینکه آیا شرکت قبلاً وجود دارد یا نه
      let company = await tx.companies.findUnique({
        where: { userId: user.id },
      });

      if (!company) {
        // ایجاد شرکت با حداقل اطلاعات
        // برای Company، city و province الزامی هستند، پس مقادیر پیش‌فرض می‌گذاریم
        company = await tx.companies.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            name: companyName.trim(),
            city: "تهران", // پیش‌فرض - کاربر بعداً در تکمیل پروفایل تغییر می‌دهد
            province: "تهران", // پیش‌فرض - کاربر بعداً در تکمیل پروفایل تغییر می‌دهد
            updatedAt: new Date(),
          },
        });
      } else {
        // اگر شرکت وجود دارد، فقط نام را به‌روزرسانی کن
        company = await tx.companies.update({
          where: { id: company.id },
          data: {
            name: companyName.trim(),
          },
        });
      }

      return { user, company };
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        phone: result.user.phone,
        role: result.user.role,
        profileCompleted: result.user.profileCompleted,
      },
      message: "ثبت‌نام با موفقیت انجام شد",
    });
  } catch (error) {
    console.error("Error in register:", error);
    return NextResponse.json(
      { error: "خطا در ثبت‌نام" },
      { status: 500 }
    );
  }
}


