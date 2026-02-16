import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/sms";

// ارسال کد تأیید برای شماره تلفن
export async function POST(request: NextRequest) {
  try {
    const { phone, role } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    // Normalize phone number - حذف فاصله‌ها و کاراکترهای اضافی
    const normalizedPhone = phone.trim().replace(/\s+/g, "");

    // بررسی فرمت شماره موبایل
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "شماره موبایل باید با 09 شروع شود و 11 رقم باشد" },
        { status: 400 }
      );
    }

    // تولید کد 6 رقمی
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // محاسبه زمان انقضا (10 دقیقه)
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // ایجاد یا به‌روزرسانی کاربر با کد OTP
    await prisma.users.upsert({
      where: { phone: normalizedPhone },
      update: {
        otpCode,
        otpExpiresAt,
        role: role || undefined,
      },
      create: {
        id: crypto.randomUUID(),
        phone: normalizedPhone,
        role: role || "contractor",
        otpCode,
        otpExpiresAt,
        updatedAt: new Date(),
      },
    });

    // ارسال پیامک
    try {
      const smsSent = await sendVerificationCode(normalizedPhone, otpCode);

      if (!smsSent) {
        console.error("خطا در ارسال پیامک");
        // حتی اگر پیامک ارسال نشد، کد را در دیتابیس ذخیره می‌کنیم
        // برای تست می‌توان از کد استفاده کرد
      }

      return NextResponse.json({
        success: true,
        message: "کد تأیید ارسال شد",
        expiresIn: 600, // 10 دقیقه
      });
    } catch (smsError) {
      console.error("خطا در ارسال پیامک:", smsError);
      // حتی اگر پیامک ارسال نشد، کد در دیتابیس ذخیره شده است
      return NextResponse.json({
        success: true,
        message: "کد تأیید ایجاد شد",
        expiresIn: 600,
      });
    }
  } catch (error) {
    console.error("خطا در ارسال کد تأیید:", error);
    return NextResponse.json(
      { error: "خطا در ارسال کد تأیید" },
      { status: 500 }
    );
  }
}
