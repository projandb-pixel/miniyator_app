import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/sms";

// ارسال OTP برای بازیابی رمز عبور
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "شماره تلفن الزامی است" },
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

    // بررسی وجود کاربر
    const user = await prisma.users.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      // برای امنیت، پیام یکسان برگردانیم
      return NextResponse.json(
        { error: "اگر این شماره موبایل در سیستم ثبت شده باشد، کد تأیید ارسال خواهد شد" },
        { status: 404 }
      );
    }

    // تولید کد 6 رقمی
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // محاسبه زمان انقضا (10 دقیقه)
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // به‌روزرسانی کاربر با کد OTP
    await prisma.users.update({
      where: { phone: normalizedPhone },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    // ارسال پیامک
    try {
      const smsSent = await sendVerificationCode(normalizedPhone, otpCode);

      if (!smsSent) {
        console.error("خطا در ارسال پیامک");
        // حتی اگر پیامک ارسال نشد، کد را در دیتابیس ذخیره می‌کنیم
      }

      return NextResponse.json({
        success: true,
        message: "کد تأیید برای بازیابی رمز عبور ارسال شد",
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
    console.error("خطا در ارسال کد بازیابی:", error);
    return NextResponse.json(
      { error: "خطا در ارسال کد بازیابی" },
      { status: 500 }
    );
  }
}



