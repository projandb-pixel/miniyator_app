import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

// GET - دریافت لیست مکالمات کاربر
export async function GET(request: NextRequest) {
  try {
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

    const companyId = user.Companies.id;

    // دریافت تمام پیام‌هایی که کاربر در آن‌ها شرکت دارد
    // این شامل پیام‌های ارسالی و دریافتی است
    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          { senderCompanyId: companyId },
          { receiverCompanyId: companyId },
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
        createdAt: "desc",
      },
    });

    // گروه‌بندی پیام‌ها بر اساس مکالمه (جفت sender-receiver)
    const conversations = new Map<string, any>();

    messages.forEach((message) => {
      // تعیین طرف مقابل
      const otherCompanyId =
        message.senderCompanyId === companyId
          ? message.receiverCompanyId
          : message.senderCompanyId;

      const otherCompanyRaw =
        message.senderCompanyId === companyId
          ? message.ReceiverCompany
          : message.SenderCompany;

      // تبدیل logo از Buffer به base64
      const otherCompany = {
        ...otherCompanyRaw,
        logo: otherCompanyRaw.logo
          ? bufferToBase64(
              otherCompanyRaw.logo instanceof Buffer
                ? otherCompanyRaw.logo
                : Buffer.from(otherCompanyRaw.logo as any)
            )
          : null,
      };

      const conversationKey = [companyId, otherCompanyId]
        .sort()
        .join("::");

      if (!conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          id: conversationKey,
          otherCompany: otherCompany,
          otherCompanyId: otherCompanyId,
          lastMessage: message,
          unreadCount: 0,
          messages: [],
        });
      }

      const conversation = conversations.get(conversationKey);
      conversation.messages.push(message);

      // اگر پیام جدیدتر است، به‌روزرسانی کن
      if (
        new Date(message.createdAt) >
        new Date(conversation.lastMessage.createdAt)
      ) {
        conversation.lastMessage = message;
      }

      // شمارش پیام‌های خوانده نشده
      if (
        message.receiverCompanyId === companyId &&
        !message.read
      ) {
        conversation.unreadCount++;
      }
    });

    // تبدیل به آرایه و مرتب‌سازی بر اساس آخرین پیام
    const conversationsList = Array.from(conversations.values())
      .map((conv) => {
        const now = new Date();
        const created = new Date(conv.lastMessage.createdAt);
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
          const date = new Date(conv.lastMessage.createdAt);
          timeAgo = date.toLocaleDateString("fa-IR");
        }

        return {
          ...conv,
          lastMessageTime: timeAgo,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
      );

    return NextResponse.json({ conversations: conversationsList });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - ارسال پیام جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderUserId, receiverCompanyId, content } = body;

    if (!senderUserId || !receiverCompanyId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // دریافت شرکت فرستنده
    const senderUser = await prisma.users.findUnique({
      where: { id: senderUserId },
      include: { Companies: true },
    });

    if (!senderUser || !senderUser.Companies) {
      return NextResponse.json(
        { error: "Sender company not found" },
        { status: 404 }
      );
    }

    // ایجاد پیام
    console.log("Creating message:", {
      senderCompanyId: senderUser.Companies.id,
      receiverCompanyId: receiverCompanyId,
      content: content.trim().substring(0, 50),
    });
    
    const message = await prisma.messages.create({
      data: {
        id: crypto.randomUUID(),
        senderCompanyId: senderUser.Companies.id,
        receiverCompanyId: receiverCompanyId,
        content: content.trim(),
        read: false,
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
    });

    console.log("Message created successfully:", message.id);

    // ایجاد اعلان برای گیرنده
    const receiverCompany = await prisma.companies.findUnique({
      where: { id: receiverCompanyId },
      include: { Users: true },
    });

    if (receiverCompany && receiverCompany.Users) {
      const receiverUserId = receiverCompany.Users.id;
      await prisma.notifications.create({
        data: {
          id: crypto.randomUUID(),
          userId: receiverUserId,
          type: "message",
          title: "پیام جدید",
          message: `${senderUser.Companies.name}: ${content.substring(0, 50)}...`,
          url: `/contractor/messages?companyId=${senderUser.Companies.id}`,
        },
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

// PATCH - علامت‌گذاری پیام به عنوان خوانده شده
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageIds, conversationId } = body;

    if (messageIds && Array.isArray(messageIds)) {
      // علامت‌گذاری چند پیام
      await prisma.messages.updateMany({
        where: {
          id: { in: messageIds },
        },
        data: { read: true },
      });
    } else if (conversationId) {
      // علامت‌گذاری تمام پیام‌های یک مکالمه
      const [companyId1, companyId2] = conversationId.split("::");
      await prisma.messages.updateMany({
        where: {
          OR: [
            {
              senderCompanyId: companyId1,
              receiverCompanyId: companyId2,
            },
            {
              senderCompanyId: companyId2,
              receiverCompanyId: companyId1,
            },
          ],
        },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating messages:", error);
    return NextResponse.json(
      { error: "Failed to update messages" },
      { status: 500 }
    );
  }
}


