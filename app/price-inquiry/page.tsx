"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Supplier {
  id: string;
  name: string;
  categories: string[];
}

export default function PriceInquiry() {
  const [formData, setFormData] = useState({
    category: "",
    product: "",
    quantity: "",
    deliveryTime: "",
    description: "",
    selectedSuppliers: [] as string[],
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // بررسی نقش کاربر
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
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
              fetchSuppliers();
            }
          }
        })
        .catch(() => {
          fetchSuppliers();
        });
    } else {
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers?limit=50');
      const data = await response.json();
      
      if (data.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupplier = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSuppliers: prev.selectedSuppliers.includes(id)
        ? prev.selectedSuppliers.filter(s => s !== id)
        : [...prev.selectedSuppliers, id]
    }));
  };

  const handleSubmit = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('لطفاً ابتدا وارد شوید');
        return;
      }

      if (formData.selectedSuppliers.length === 0) {
        alert('لطفاً حداقل یک تأمین‌کننده انتخاب کنید');
        return;
      }

      if (!formData.category || !formData.product || !formData.quantity || !formData.deliveryTime) {
        alert('لطفاً تمام فیلدهای الزامی را پر کنید');
        return;
      }

      // دریافت companyId از userId
      const userResponse = await fetch(`/api/profile?userId=${userId}`);
      const userData = await userResponse.json();
      
      if (!userData.user || !userData.user.company) {
        alert('لطفاً ابتدا پروفایل خود را تکمیل کنید');
        return;
      }

      const contractorCompanyId = userData.user.company.id;

      const response = await fetch('/api/contractor/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: contractorCompanyId,
          category: formData.category,
          product: formData.product,
          quantity: formData.quantity,
          deliveryTime: formData.deliveryTime,
          description: formData.description,
          supplierIds: formData.selectedSuppliers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`استعلام با موفقیت به ${formData.selectedSuppliers.length} تأمین‌کننده ارسال شد`);
        // Reset form
        setFormData({
          category: "",
          product: "",
          quantity: "",
          deliveryTime: "",
          description: "",
          selectedSuppliers: [],
        });
      } else {
        alert(data.error || 'خطا در ارسال استعلام');
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('خطا در ارسال استعلام');
    }
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

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/shared/marketplace" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">استعلام قیمت</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">دسته‌بندی</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">انتخاب کنید</option>
              <option value="electrical">برق</option>
              <option value="instrumentation">ابزار دقیق</option>
              <option value="mechanical">مکانیک</option>
              <option value="civil">سیویل</option>
            </select>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">محصول / خدمت</label>
            <input
              type="text"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              placeholder="مثال: ترانسمیتر فشار"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">مقدار</label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="مثال: ۱۰ عدد"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">زمان نیاز</label>
            <select
              value={formData.deliveryTime}
              onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">انتخاب کنید</option>
              <option value="urgent">فوری (کمتر از ۱ هفته)</option>
              <option value="1week">۱-۲ هفته</option>
              <option value="2weeks">۲-۴ هفته</option>
              <option value="1month">بیش از ۱ ماه</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">توضیحات</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="مشخصات فنی، شرایط خاص، و سایر توضیحات..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Supplier Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              ارسال به تأمین‌کنندگان ({formData.selectedSuppliers.length} انتخاب شده)
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suppliers.map((supplier) => (
                <label
                  key={supplier.id}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                    formData.selectedSuppliers.includes(supplier.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedSuppliers.includes(supplier.id)}
                    onChange={() => toggleSupplier(supplier.id)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-xs text-gray-600">{supplier.categories.join(', ')}</p>
                  </div>
                </label>
              ))}
            </div>
            {suppliers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">هیچ تأمین‌کننده‌ای یافت نشد</p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium text-lg hover:bg-blue-700 transition"
          >
            ارسال استعلام به {formData.selectedSuppliers.length} تأمین‌کننده
          </button>

          <p className="text-xs text-gray-500 text-center">
            استعلام شما به صورت هم‌زمان به تمام تأمین‌کنندگان انتخاب شده ارسال می‌شود
          </p>
        </div>
      </div>
    </div>
  );
}
