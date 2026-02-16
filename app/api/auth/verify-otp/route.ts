import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// تأیید کد OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // پشتیبانی از هر دو نام فیلد: otp و otpCode
    const { phone, otpCode, otp } = body;
    const finalOtpCode = otpCode || otp;

    console.log("Received OTP verification request:", { phone, otpCode, otp, finalOtpCode, body });

    if (!phone || !finalOtpCode) {
      console.error("Missing phone or otpCode:", { phone, otpCode, otp, finalOtpCode });
      return NextResponse.json(
        { error: "شماره تلفن و کد تأیید الزامی است" },
        { status: 400 }
      );
    }

    // Trim و normalize کردن شماره تلفن
    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const normalizedOtp = finalOtpCode.trim();

    // بررسی فرمت کد
    if (normalizedOtp.length !== 6 || !/^\d{6}$/.test(normalizedOtp)) {
      return NextResponse.json(
        {
          error: "کد تأیید باید 6 رقم باشد",
        },
        { status: 400 }
      );
    }

    // بررسی کد در دیتابیس
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

    // بررسی کد
    if (user.otpCode !== normalizedOtp) {
      console.error("OTP mismatch:", { 
        received: normalizedOtp, 
        stored: user.otpCode,
        phone: normalizedPhone 
      });
      return NextResponse.json(
        {
          error: "کد تأیید نامعتبر است",
        },
        { status: 400 }
      );
    }

    // بررسی انقضای کد
    if (!user.otpExpiresAt) {
      return NextResponse.json(
        {
          error: "کد تأیید منقضی شده است",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(user.otpExpiresAt);

    if (now > expiresAt) {
      return NextResponse.json(
        {
          error: "کد تأیید منقضی شده است",
        },
        { status: 400 }
      );
    }

    // پاک کردن کد استفاده شده
    await prisma.users.update({
      where: { phone: normalizedPhone },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        isVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "شماره تلفن تأیید شد",
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("خطا در تأیید کد:", error);
    return NextResponse.json(
      { error: "خطا در تأیید کد" },
      { status: 500 }
    );
  }
}

