"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PriceInquiry {
  id: string;
  product: string;
  category: string;
  quantity: string;
  deliveryTime: string;
  description: string | null;
  createdAt: string;
  status: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  responses: Array<{
    id: string;
    price: string;
    deliveryTime: string | null;
    notes: string | null;
  }>;
}

export default function SupplierHome() {
  const [inquiries, setInquiries] = useState<PriceInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<PriceInquiry | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseForm, setResponseForm] = useState({
    price: "",
    deliveryTime: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      // بررسی نقش کاربر
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.role !== "supplier") {
              // اگر پیمانکار است، به صفحه پیمانکار هدایت کن
              if (globalThis.window) {
                globalThis.window.location.href = "/contractor/home";
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
      console.error('Error fetching company:', error);
      setLoading(false);
    }
  };

  const fetchInquiries = async (supplierCompanyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supplier/inquiries/received?supplierId=${supplierCompanyId}`);
      const data = await response.json();
      
      if (data.inquiries) {
        setInquiries(data.inquiries);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (inquiry: PriceInquiry) => {
    setSelectedInquiry(inquiry);
    setResponseForm({
      price: "",
      deliveryTime: "",
      notes: "",
    });
    setShowResponseForm(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry || !companyId) return;

    if (!responseForm.price) {
      alert('قیمت الزامی است');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/supplier/inquiries/${selectedInquiry.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: companyId,
          price: responseForm.price,
          deliveryTime: responseForm.deliveryTime || null,
          notes: responseForm.notes || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('پاسخ شما با موفقیت ارسال شد');
        setShowResponseForm(false);
        setSelectedInquiry(null);
        if (companyId) {
          fetchInquiries(companyId);
        }
      } else {
        alert(data.error || 'خطا در ارسال پاسخ');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('خطا در ارسال پاسخ');
    } finally {
      setSaving(false);
    }
  };

  const getDeliveryTimeLabel = (deliveryTime: string) => {
    const labels: { [key: string]: string } = {
      urgent: 'فوری (کمتر از ۱ هفته)',
      '1week': '۱-۲ هفته',
      '2weeks': '۲-۴ هفته',
      '1month': 'بیش از ۱ ماه',
    };
    return labels[deliveryTime] || deliveryTime;
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      electrical: 'برق',
      instrumentation: 'ابزار دقیق',
      mechanical: 'مکانیک',
      civil: 'سیویل',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
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
            <h1 className="text-xl font-bold">خانه تأمین‌کننده</h1>
            <Link href="/supplier-dashboard" className="text-blue-600 text-sm">
              داشبورد
            </Link>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">لطفاً ابتدا وارد شوید و پروفایل خود را تکمیل کنید</p>
            <Link href="/auth/login" className="text-blue-600 mt-2 inline-block">
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
          <h1 className="text-xl font-bold">استعلام‌های دریافتی</h1>
          <Link href="/supplier/dashboard" className="text-blue-600 text-sm">
            داشبورد
          </Link>
        </div>
      </div>

      <div className="pb-20">
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 m-4 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-lg font-bold mb-2">استعلامی دریافت نکرده‌اید</h3>
            <p className="text-gray-600">
              استعلام‌های قیمت که پیمانکاران برای شما ارسال می‌کنند اینجا نمایش داده می‌شوند
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {inquiries.map((inquiry) => {
              const hasResponded = inquiry.responses.length > 0;
              return (
                <div key={inquiry.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {inquiry.company.logo || (inquiry.company.name && inquiry.company.name.length > 0 ? inquiry.company.name.charAt(0) : "?")}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{inquiry.product}</h3>
                      <p className="text-sm text-gray-600">{inquiry.company.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(inquiry.createdAt)}
                      </p>
                    </div>
                    {hasResponded && (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                        ✓ پاسخ داده شده
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">دسته:</span>
                      <span className="font-medium mr-1">{getCategoryLabel(inquiry.category)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">مقدار:</span>
                      <span className="font-medium mr-1">{inquiry.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">زمان نیاز:</span>
                      <span className="font-medium mr-1">{getDeliveryTimeLabel(inquiry.deliveryTime)}</span>
                    </div>
                  </div>

                  {inquiry.description && (
                    <p className="text-sm text-gray-700 mb-3 border-r-2 border-gray-200 pr-2">
                      {inquiry.description}
                    </p>
                  )}

                  {hasResponded ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-700 mb-1">پاسخ شما:</p>
                      <p className="text-sm font-bold text-green-600">
                        قیمت: {inquiry.responses[0].price}
                      </p>
                      {inquiry.responses[0].deliveryTime && (
                        <p className="text-xs text-gray-600 mt-1">
                          زمان تحویل: {inquiry.responses[0].deliveryTime}
                        </p>
                      )}
                      {inquiry.responses[0].notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {inquiry.responses[0].notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRespond(inquiry)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium mt-3"
                    >
                      پاسخ به استعلام
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Form Modal */}
      {showResponseForm && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">پاسخ به استعلام</h2>
              <button
                onClick={() => setShowResponseForm(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium mb-1">{selectedInquiry.product}</p>
              <p className="text-sm text-gray-600">از: {selectedInquiry.company.name}</p>
              <p className="text-sm text-gray-600">مقدار: {selectedInquiry.quantity}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">قیمت *</label>
                <input
                  type="text"
                  value={responseForm.price}
                  onChange={(e) => setResponseForm({ ...responseForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: ۱۵ میلیون تومان"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">زمان تحویل</label>
                <input
                  type="text"
                  value={responseForm.deliveryTime}
                  onChange={(e) => setResponseForm({ ...responseForm, deliveryTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="مثال: ۲ هفته"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">توضیحات</label>
                <textarea
                  value={responseForm.notes}
                  onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="توضیحات اضافی، شرایط پرداخت، گارانتی و..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitResponse}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'در حال ارسال...' : 'ارسال پاسخ'}
                </button>
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          <Link href="/supplier/home" className="text-black">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </Link>
          <Link href="/supplier/marketplace" className="text-gray-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </Link>
          <Link href="/supplier/dashboard" className="text-gray-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </Link>
          <Link href="/supplier/dashboard" className="text-gray-400">
            <div className="w-6 h-6 rounded-full bg-gray-300"></div>
          </Link>
        </div>
      </div>
    </div>
  );
}

