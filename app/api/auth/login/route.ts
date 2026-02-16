import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// لاگین با شماره موبایل و رمز عبور
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: "شماره تلفن و رمز عبور الزامی است" },
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

    // پیدا کردن کاربر
    const user = await prisma.users.findUnique({
      where: { phone: normalizedPhone },
      include: { Companies: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // بررسی وجود رمز عبور
    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "این حساب کاربری رمز عبور ندارد. لطفاً از طریق بازیابی رمز عبور، رمز عبور تنظیم کنید.",
        },
        { status: 401 }
      );
    }

    // بررسی رمز عبور
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "شماره موبایل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // ایجاد response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });

    // تنظیم cookie برای userId (30 روز)
    // برای موبایل: از sameSite: 'lax' استفاده می‌کنیم که در اکثر مرورگرهای موبایل کار می‌کند
    // httpOnly: true برای امنیت، اما middleware می‌تواند آن را بخواند
    // در development: secure را false می‌کنیم تا در HTTP کار کند
    // بررسی اینکه آیا از HTTPS استفاده می‌شود یا نه
    const isHttps = request.url.startsWith("https://");
    const isProduction = process.env.NODE_ENV === "production";
    const shouldUseSecure = isProduction && isHttps;

    response.cookies.set("userId", user.id, {
      httpOnly: true,
      secure: shouldUseSecure, // فقط در production و HTTPS از secure استفاده کن
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 روز
      path: "/",
    });

    console.log("Cookie set for user:", user.id, {
      httpOnly: true,
      secure: shouldUseSecure,
      sameSite: "lax",
      isHttps,
      isProduction,
      url: request.url,
    });

    return response;
  } catch (error) {
    console.error("Error in login:", error);
    return NextResponse.json(
      { error: "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
}
