"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

interface Conversation {
  id: string;
  otherCompany: {
    id: string;
    name: string;
    logo: string | null;
  };
  otherCompanyId: string;
  lastMessage: {
    content: string;
    createdAt: string;
  };
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  isSender: boolean;
  read: boolean;
  createdAt: string;
  timeAgo: string;
  sender: unknown | null;
  receiver: unknown | null;
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
}

function ContractorMessagesInner() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchConversations(storedUserId);
    } else {
      setLoading(false);
    }

    // بررسی اگر companyId در URL وجود دارد
    const companyId = searchParams.get("companyId");
    if (companyId) {
      setSelectedCompanyId(companyId);
    }
  }, [searchParams]);

  const fetchConversations = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages?userId=${userId}`);
      const data = await response.json();

      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // اگر companyId انتخاب شده، صفحه چت را نمایش بده
  if (selectedCompanyId) {
    return (
      <ChatView
        userId={userId}
        companyId={selectedCompanyId}
        onBack={() => {
          setSelectedCompanyId(null);
          if (userId) fetchConversations(userId);
        }}
      />
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">پیام‌ها</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pb-20">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 p-8">
            <span className="text-6xl mb-4">💬</span>
            <h3 className="text-lg font-bold mb-2">هیچ پیامی وجود ندارد</h3>
            <p className="text-gray-600 text-center">
              پیام‌های شما با تأمین‌کنندگان و پیمانکاران اینجا نمایش داده
              می‌شوند
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  console.log("Opening conversation with:", {
                    conversationId: conversation.id,
                    otherCompanyId: conversation.otherCompanyId,
                    otherCompanyName: conversation.otherCompany.name,
                  });
                  setSelectedCompanyId(conversation.otherCompanyId);
                }}
                className="bg-white p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {conversation.otherCompany.logo ? (
                      <img
                        src={conversation.otherCompany.logo}
                        alt={conversation.otherCompany.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : conversation.otherCompany.name &&
                      conversation.otherCompany.name.length > 0 ? (
                      conversation.otherCompany.name.charAt(0)
                    ) : (
                      "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-800 truncate">
                        {conversation.otherCompany.name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 mr-2">
                        {conversation.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mr-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContractorNavigation />
    </div>
  );
}

export default function ContractorMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ContractorMessagesInner />
    </Suspense>
  );
}

// کامپوننت چت
function ChatView({
  userId,
  companyId,
  onBack,
}: {
  userId: string | null;
  companyId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherCompany, setOtherCompany] = useState<Company | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = useCallback(
    async (showLoading: boolean = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        // ساخت conversationId
        const response = await fetch(`/api/profile?userId=${userId}`);
        const userData = await response.json();
        const myCompanyId = userData.user?.company?.id;

        if (!myCompanyId) {
          console.error("My company ID not found");
          if (showLoading) {
            setLoading(false);
          }
          return;
        }

        console.log("Building conversationId:", {
          myCompanyId,
          companyId,
          areEqual: myCompanyId === companyId,
        });

        if (myCompanyId === companyId) {
          console.error("Cannot create conversation with self!");
          if (showLoading) {
            alert("خطا: نمی‌توانید با خودتان مکالمه کنید");
            setLoading(false);
          }
          return;
        }

        const conversationId = [myCompanyId, companyId].sort().join("::");

        const messagesResponse = await fetch(
          `/api/messages/${conversationId}?userId=${userId}`
        );
        const data = await messagesResponse.json();

        // بررسی اینکه آیا پیام جدیدی آمده است
        const previousMessageCount = messages.length;
        const newMessageCount = data.messages?.length || 0;
        const hasNewMessages = newMessageCount > previousMessageCount;

        if (data.messages) {
          // فقط اگر تعداد پیام‌ها تغییر کرده، state را به‌روزرسانی کن
          if (newMessageCount !== previousMessageCount) {
            setMessages(data.messages);
            // اگر پیام جدیدی آمده و کاربر در پایین صفحه است، اسکرول کن
            if (hasNewMessages) {
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        } else {
          if (previousMessageCount > 0) {
            setMessages([]);
          }
        }
        if (data.otherCompany) {
          console.log("Setting otherCompany:", data.otherCompany);
          setOtherCompany(data.otherCompany);
        } else {
          console.log("No otherCompany found in response");
          // اگر otherCompany وجود ندارد، از API دریافت کن
          try {
            const companyResponse = await fetch(`/api/suppliers/${companyId}`);
            const companyData = await companyResponse.json();
            if (companyData.supplier) {
              setOtherCompany({
                id: companyData.supplier.id,
                name: companyData.supplier.name,
                logo: companyData.supplier.logo,
              });
            }
          } catch (err) {
            console.error("Error fetching company:", err);
          }
        }

        // علامت‌گذاری پیام‌ها به عنوان خوانده شده
        if (data.messages && data.messages.length > 0) {
          const unreadIds = data.messages
            .filter((m: Message) => !m.read && !m.isSender)
            .map((m: Message) => m.id);
          if (unreadIds.length > 0) {
            await fetch(`/api/messages`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIds: unreadIds }),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [userId, companyId, messages.length]
  );

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId, companyId, fetchMessages]);

  useEffect(() => {
    // اسکرول به پایین هنگام بارگذاری پیام‌ها
    scrollToBottom();
  }, [messages]);

  // Auto-refresh: دریافت خودکار پیام‌های جدید هر 3 ثانیه
  useEffect(() => {
    if (!userId || loading) return;

    const interval = setInterval(() => {
      // فقط اگر در حال ارسال پیام نیستیم، پیام‌های جدید را دریافت کن
      if (!sending) {
        fetchMessages(false); // false = بدون نمایش loading
      }
    }, 3000); // هر 3 ثانیه

    return () => clearInterval(interval);
  }, [userId, companyId, loading, sending, fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || sending) {
      console.log("Cannot send message:", {
        hasMessage: !!newMessage.trim(),
        hasUserId: !!userId,
        sending,
      });
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    console.log("Sending message:", {
      content: messageContent.substring(0, 50),
      receiverCompanyId: companyId,
      senderUserId: userId,
    });

    // اضافه کردن پیام موقت به state برای نمایش فوری
    const tempMessage = {
      id: tempId,
      content: messageContent,
      isSender: true,
      read: false,
      createdAt: new Date().toISOString(),
      timeAgo: "چند لحظه پیش",
      sender: null,
      receiver: null,
    };

    setMessages((prev) => {
      console.log("Adding temp message, current count:", prev.length);
      return [...prev, tempMessage];
    });
    setNewMessage("");
    scrollToBottom();

    try {
      setSending(true);
      const response = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUserId: userId,
          receiverCompanyId: companyId,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Message sent successfully:", responseData);
        // کمی تاخیر برای اطمینان از ذخیره شدن در دیتابیس
        await new Promise((resolve) => setTimeout(resolve, 100));
        // دریافت مجدد پیام‌ها برای جایگزینی پیام موقت با پیام واقعی
        await fetchMessages();
      } else {
        // اگر ارسال ناموفق بود، پیام موقت را حذف کن
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const errorData = await response.json();
        alert(errorData.error || "خطا در ارسال پیام");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // اگر ارسال ناموفق بود، پیام موقت را حذف کن
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="text-gray-600">
            ←
          </button>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {otherCompany?.logo ? (
              <img
                src={otherCompany.logo}
                alt={otherCompany.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              otherCompany?.name?.charAt(0) || "?"
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{otherCompany?.name || "..."}</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <span className="text-4xl mb-2">💬</span>
            <p>هنوز پیامی رد و بدل نشده است</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  message.isSender
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.isSender ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {message.timeAgo}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "ارسال"}
          </button>
        </div>
      </div>
    </div>
  );
}
