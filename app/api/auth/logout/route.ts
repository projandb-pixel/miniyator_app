import { NextRequest, NextResponse } from "next/server";

// Logout - پاک کردن cookie
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "با موفقیت خارج شدید",
    });

    // پاک کردن cookie
    response.cookies.set('userId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // فوراً expire می‌شود
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Error in logout:", error);
    return NextResponse.json(
      { error: "خطا در خروج از سیستم" },
      { status: 500 }
    );
  }
}









