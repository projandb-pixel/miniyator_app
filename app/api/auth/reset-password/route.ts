import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// تغییر رمز عبور با استفاده از OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otpCode, newPassword } = body;

    if (!phone || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "شماره تلفن، کد تأیید و رمز عبور جدید الزامی است" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const normalizedOtp = otpCode.trim();

    // بررسی فرمت کد
    if (normalizedOtp.length !== 6 || !/^\d{6}$/.test(normalizedOtp)) {
      return NextResponse.json(
        {
          error: "کد تأیید باید 6 رقم باشد",
        },
        { status: 400 }
      );
    }

    // بررسی طول رمز عبور
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور باید حداقل 6 کاراکتر باشد" },
        { status: 400 }
      );
    }

    // پیدا کردن کاربر
    const user = await prisma.users.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "کاربری با این شماره موبایل یافت نشد",
        },
        { status: 404 }
      );
    }

    // بررسی کد OTP
    if (!user.otpCode || user.otpCode !== normalizedOtp) {
      return NextResponse.json(
        {
          error: "کد تأیید نامعتبر است",
        },
        { status: 400 }
      );
    }

    // بررسی انقضای کد
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return NextResponse.json(
        {
          error: "کد تأیید منقضی شده است. لطفاً دوباره درخواست دهید",
        },
        { status: 400 }
      );
    }

    // Hash کردن رمز عبور جدید
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // به‌روزرسانی رمز عبور و پاک کردن OTP
    await prisma.users.update({
      where: { phone: normalizedPhone },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    return NextResponse.json(
      { error: "خطا در تغییر رمز عبور" },
      { status: 500 }
    );
  }
}


