import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت پیام‌های یک مکالمه خاص
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // دریافت شرکت کاربر
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { Companies: true },
    });

    if (!user || !user.Companies) {
      return NextResponse.json(
        { error: "User or company not found" },
        { status: 404 }
      );
    }

    const userCompany = user.Companies; // Store to avoid null check issues
    const companyId = userCompany.id;

    // استخراج companyId طرف مقابل از conversationId
    // استفاده از "::" به عنوان separator چون UUIDها خودشان "-" دارند
    // اما برای سازگاری با پیام‌های قدیمی، هر دو separator را پشتیبانی می‌کنیم
    let companyId1: string, companyId2: string;
    if (conversationId.includes("::")) {
      [companyId1, companyId2] = conversationId.split("::");
    } else {
      // Fallback برای پیام‌های قدیمی که با "-" join شده‌اند
      // باید UUIDها را به درستی split کنیم
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 کاراکتر)
      const parts = conversationId.split("-");
      if (parts.length >= 10) {
        // دو UUID با "-" join شده‌اند
        companyId1 = parts.slice(0, 5).join("-");
        companyId2 = parts.slice(5).join("-");
      } else {
        // فقط یک UUID یا format نامعتبر
        return NextResponse.json(
          { error: "Invalid conversation ID format" },
          { status: 400 }
        );
      }
    }
    
    const otherCompanyId =
      companyId1 === companyId ? companyId2 : companyId1;

    console.log("Fetching messages for conversation:", conversationId);
    console.log("User company ID:", companyId);
    console.log("Other company ID:", otherCompanyId);
    console.log("Split conversationId:", { companyId1, companyId2 });

    if (!otherCompanyId || otherCompanyId === companyId || !otherCompanyId.includes("-")) {
      console.error("Invalid otherCompanyId:", otherCompanyId);
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }
    
    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          {
            senderCompanyId: companyId,
            receiverCompanyId: otherCompanyId,
          },
          {
            senderCompanyId: otherCompanyId,
            receiverCompanyId: companyId,
          },
        ],
      },
      include: {
        SenderCompany: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        ReceiverCompany: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log("Found", messages.length, "messages");

    // دریافت اطلاعات شرکت طرف مقابل
    const otherCompany = await prisma.companies.findUnique({
      where: { id: otherCompanyId },
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    console.log("Other company found:", otherCompany ? "Yes" : "No");
    if (otherCompany) {
      console.log("Other company name:", otherCompany.name);
    }

    // فرمت کردن پیام‌ها
    const formattedMessages = messages.map((message) => {
      const isSender = message.senderCompanyId === companyId;
      const now = new Date();
      const created = new Date(message.createdAt);
      const diffMs = now.getTime() - created.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo = "";
      if (diffHours < 1) {
        timeAgo = "چند دقیقه پیش";
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ساعت پیش`;
      } else if (diffDays === 1) {
        timeAgo = "دیروز";
      } else if (diffDays < 7) {
        timeAgo = `${diffDays} روز پیش`;
      } else {
        const date = new Date(message.createdAt);
        timeAgo = date.toLocaleDateString("fa-IR");
      }

      const senderCompany = isSender
        ? {
            ...userCompany,
            logo: userCompany.logo 
              ? bufferToBase64(userCompany.logo instanceof Buffer ? userCompany.logo : Buffer.from(userCompany.logo as any))
              : null,
          }
        : {
            ...message.SenderCompany,
            logo: message.SenderCompany.logo 
              ? bufferToBase64(message.SenderCompany.logo instanceof Buffer ? message.SenderCompany.logo : Buffer.from(message.SenderCompany.logo as any))
              : null,
          };

      const receiverCompany = isSender
        ? {
            ...message.ReceiverCompany,
            logo: message.ReceiverCompany.logo 
              ? bufferToBase64(message.ReceiverCompany.logo instanceof Buffer ? message.ReceiverCompany.logo : Buffer.from(message.ReceiverCompany.logo as any))
              : null,
          }
        : {
            ...userCompany,
            logo: userCompany.logo 
              ? bufferToBase64(userCompany.logo instanceof Buffer ? userCompany.logo : Buffer.from(userCompany.logo as any))
              : null,
          };

      return {
        id: message.id,
        content: message.content,
        isSender,
        read: message.read,
        createdAt: message.createdAt,
        timeAgo,
        sender: senderCompany,
        receiver: receiverCompany,
      };
    });

    return NextResponse.json({
      messages: formattedMessages,
      otherCompany: otherCompany ? {
        ...otherCompany,
        logo: otherCompany.logo 
          ? bufferToBase64(otherCompany.logo instanceof Buffer ? otherCompany.logo : Buffer.from(otherCompany.logo as any))
          : null,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}


