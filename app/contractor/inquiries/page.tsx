"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PriceInquiryResponse {
  id: string;
  supplierId: string;
  price: string;
  deliveryTime: string | null;
  notes: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
}

interface PriceInquiry {
  id: string;
  category: string;
  product: string;
  quantity: string;
  deliveryTime: string;
  description: string | null;
  status: string;
  createdAt: string;
  responses: PriceInquiryResponse[];
}

export default function ContractorInquiries() {
  const [inquiries, setInquiries] = useState<PriceInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      // بررسی نقش کاربر
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.role !== "contractor") {
              // اگر تأمین‌کننده است، به صفحه تأمین‌کننده هدایت کن
              if (globalThis.window) {
                globalThis.window.location.href = "/supplier/home";
              }
            } else {
              setUserId(storedUserId);
              fetchCompanyId(storedUserId);
            }
          }
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

  const fetchCompanyId = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();

      if (data.user && data.user.company) {
        setCompanyId(data.user.company.id);
        fetchInquiries(data.user.company.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      setLoading(false);
    }
  };

  const fetchInquiries = async (contractorCompanyId: string) => {
    try {
      setLoading(true);
      console.log("Fetching inquiries for contractorId:", contractorCompanyId);
      const response = await fetch(
        `/api/contractor/inquiries?contractorId=${contractorCompanyId}`
      );
      const data = await response.json();
      console.log("Inquiries response:", {
        status: response.status,
        data,
        inquiriesCount: data.inquiries?.length,
      });

      if (data.inquiries) {
        setInquiries(data.inquiries);
        console.log("Inquiries set:", data.inquiries.length);
        // Log first inquiry's first response supplier logo for debugging
        if (
          data.inquiries.length > 0 &&
          data.inquiries[0].responses &&
          data.inquiries[0].responses.length > 0
        ) {
          console.log(
            "First response supplier:",
            data.inquiries[0].responses[0].supplier
          );
          console.log(
            "First response supplier logo:",
            data.inquiries[0].responses[0].supplier?.logo
          );
        }
      } else {
        console.warn("No inquiries in response:", data);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (inquiry: PriceInquiry) => {
    if (inquiry.responses.length > 0) {
      return (
        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
          {inquiry.responses.length} پاسخ دریافت شده
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
        در انتظار پاسخ
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      electrical: "برق",
      instrumentation: "ابزار دقیق",
      mechanical: "مکانیک",
      civil: "سیویل",
    };
    return labels[category] || category;
  };

  const getDeliveryTimeLabel = (deliveryTime: string) => {
    const labels: { [key: string]: string } = {
      urgent: "فوری (کمتر از ۱ هفته)",
      "1week": "۱-۲ هفته",
      "2weeks": "۲-۴ هفته",
      "1month": "بیش از ۱ ماه",
    };
    return labels[deliveryTime] || deliveryTime;
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!userId || !companyId) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Link href="/contractor/dashboard" className="text-gray-600">
              ← بازگشت
            </Link>
            <h1 className="text-lg font-bold">استعلام‌های من</h1>
            <div className="w-10"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              لطفاً ابتدا وارد شوید و پروفایل خود را تکمیل کنید
            </p>
            <Link
              href="/auth/login"
              className="text-blue-600 mt-2 inline-block"
            >
              ورود به حساب کاربری
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/dashboard" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">استعلام‌های من</h1>
          <Link
            href="/contractor/price-inquiry"
            className="text-blue-600 text-sm"
          >
            + جدید
          </Link>
        </div>
      </div>

      <div className="p-4 pb-20">
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-bold mb-2">
              هنوز استعلامی ارسال نکرده‌اید
            </h3>
            <p className="text-gray-600 mb-4">
              برای ارسال استعلام قیمت به تأمین‌کنندگان، روی دکمه "جدید" کلیک
              کنید
            </p>
            <Link
              href="/contractor/price-inquiry"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              ارسال استعلام جدید
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {inquiry.product}
                    </h3>
                    <p className="text-sm text-gray-600">
                      دسته: {getCategoryLabel(inquiry.category)}
                    </p>
                  </div>
                  {getStatusBadge(inquiry)}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">مقدار:</span>
                    <span className="font-medium mr-1">{inquiry.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">زمان نیاز:</span>
                    <span className="font-medium mr-1">
                      {getDeliveryTimeLabel(inquiry.deliveryTime)}
                    </span>
                  </div>
                </div>

                {inquiry.description && (
                  <p className="text-sm text-gray-700 mb-3 border-r-2 border-gray-200 pr-2">
                    {inquiry.description}
                  </p>
                )}

                <div className="text-xs text-gray-500 mb-3">
                  تاریخ ارسال: {formatDate(inquiry.createdAt)}
                </div>

                {/* پاسخ‌ها */}
                {inquiry.responses.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-bold mb-3 text-sm">
                      پاسخ‌های دریافتی ({inquiry.responses.length})
                    </h4>
                    <div className="space-y-3">
                      {inquiry.responses.map((response) => (
                        <div
                          key={response.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {response.supplier ? (
                                <>
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden relative">
                                    {response.supplier.logo ? (
                                      <>
                                        <img
                                          src={response.supplier.logo}
                                          alt={response.supplier.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target =
                                              e.target as HTMLImageElement;
                                            target.style.display = "none";
                                            const fallback =
                                              target.parentElement?.querySelector(
                                                ".logo-fallback"
                                              ) as HTMLElement;
                                            if (fallback) {
                                              fallback.style.display = "flex";
                                            }
                                          }}
                                        />
                                        <span
                                          className="logo-fallback absolute inset-0 flex items-center justify-center"
                                          style={{ display: "none" }}
                                        >
                                          {response.supplier.name &&
                                          response.supplier.name.length > 0
                                            ? response.supplier.name.charAt(0)
                                            : "?"}
                                        </span>
                                      </>
                                    ) : response.supplier.name &&
                                      response.supplier.name.length > 0 ? (
                                      response.supplier.name.charAt(0)
                                    ) : (
                                      "?"
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {response.supplier.name}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <p className="font-medium text-sm">
                                  تأمین‌کننده
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(response.createdAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">قیمت:</span>
                              <span className="font-bold text-green-600 mr-1">
                                {response.price}
                              </span>
                            </div>
                            {response.deliveryTime && (
                              <div>
                                <span className="text-gray-600">
                                  زمان تحویل:
                                </span>
                                <span className="font-medium mr-1">
                                  {response.deliveryTime}
                                </span>
                              </div>
                            )}
                          </div>
                          {response.notes && (
                            <p className="text-sm text-gray-700 mt-2 border-r-2 border-gray-300 pr-2">
                              {response.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inquiry.responses.length === 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                      هنوز پاسخی دریافت نشده است
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
