"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Supplier {
  id: string;
  name: string;
  logo?: string | null;
  categories: string[];
}

interface Tender {
  id: string;
  title: string;
}

export default function ContractorPriceInquiryPage() {
  const [formData, setFormData] = useState({
    tenderId: "",
    category: "",
    product: "",
    quantity: "",
    deliveryTime: "",
    description: "",
    selectedSuppliers: [] as string[],
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [favoriteSuppliers, setFavoriteSuppliers] = useState<Supplier[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const technicalAreas = [
    "مکانیک (استاتیک: مخازن، پایپینگ، مبدل و ....)",
    "مکانیک (روتاری: کمپرسور، پمپ و...)",
    "برق",
    "ابزار دقیق، اتوماسیون صنعتی و کنترل",
    "آنالایزر",
    "F&G",
    "IT (نرم‌افزار، سخت افزار، شبکه و نظارت تصویری)",
    "سیویل و سازه",
    "تعمیرات و نگهداری (O&M)",
    "رنگ، عایق، سندبلاست",
    "HSE خدمات ایمنی",
    "بازرسی فنی (QA/QC)",
  ];

  useEffect(() => {
    // بررسی نقش کاربر
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
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
              fetchTenders();
              fetchFavoriteSuppliers(storedUserId);
              fetchSuppliers();
            }
          }
        })
        .catch(() => {
          fetchTenders();
          if (storedUserId) {
            fetchFavoriteSuppliers(storedUserId);
          }
          fetchSuppliers();
        });
    } else {
      if (globalThis.window) {
        globalThis.window.location.href = "/auth/login";
      }
    }
  }, []);

  const fetchTenders = async () => {
    try {
      const response = await fetch('/api/tenders?limit=100');
      const data = await response.json();
      if (data.tenders) {
        setTenders(data.tenders.map((t: any) => ({
          id: t.id,
          title: t.title || "بدون عنوان",
        })));
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
    }
  };

  const fetchFavoriteSuppliers = async (userId: string) => {
    try {
      const response = await fetch(`/api/contractor/dashboard/suggested-suppliers?userId=${userId}&limit=50`);
      const data = await response.json();
      if (data.suppliers) {
        const suppliersWithCategories = data.suppliers.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name,
          logo: supplier.logo,
          categories: supplier.categories || [],
        }));
        setFavoriteSuppliers(suppliersWithCategories);
      }
    } catch (error) {
      console.error('Error fetching favorite suppliers:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers?limit=100');
      const data = await response.json();
      
      if (data.suppliers) {
        // تبدیل categories به آرایه
        const suppliersWithCategories = data.suppliers.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name,
          logo: supplier.logo,
          categories: supplier.categories || [],
        }));
        setSuppliers(suppliersWithCategories);
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

  const toggleAllFavoriteSuppliers = () => {
    const allFavoriteIds = favoriteSuppliers.map(s => s.id);
    const allSelected = allFavoriteIds.every(id => formData.selectedSuppliers.includes(id));
    
    if (allSelected) {
      // حذف همه
      setFormData(prev => ({
        ...prev,
        selectedSuppliers: prev.selectedSuppliers.filter(id => !allFavoriteIds.includes(id))
      }));
    } else {
      // اضافه کردن همه
      setFormData(prev => ({
        ...prev,
        selectedSuppliers: [...new Set([...prev.selectedSuppliers, ...allFavoriteIds])]
      }));
    }
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

      setSubmitting(true);

      // دریافت companyId از userId
      const userResponse = await fetch(`/api/profile?userId=${userId}`);
      const userData = await userResponse.json();
      
      if (!userData.user || !userData.user.company) {
        alert('لطفاً ابتدا پروفایل خود را تکمیل کنید');
        setSubmitting(false);
        return;
      }

      const contractorCompanyId = userData.user.company.id;

      const requestBody = {
        contractorId: contractorCompanyId,
        tenderId: formData.tenderId || null,
        category: formData.category,
        product: formData.product,
        quantity: formData.quantity,
        deliveryTime: formData.deliveryTime,
        description: formData.description,
        supplierIds: formData.selectedSuppliers,
      };

      console.log('Submitting price inquiry:', requestBody);

      const response = await fetch('/api/contractor/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Price inquiry response:', { status: response.status, data });

      if (response.ok) {
        alert(`استعلام با موفقیت به ${formData.selectedSuppliers.length} تأمین‌کننده ارسال شد`);
        // Reset form
        setFormData({
          tenderId: "",
          category: "",
          product: "",
          quantity: "",
          deliveryTime: "",
          description: "",
          selectedSuppliers: [],
        });
        // هدایت به صفحه استعلام‌ها
        if (globalThis.window) {
          globalThis.window.location.href = "/contractor/inquiries";
        }
      } else {
        const errorMessage = data.error || (data.details ? `${data.error}: ${data.details}` : 'خطا در ارسال استعلام');
        alert(errorMessage);
        console.error('Price inquiry error:', data);
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('خطا در ارسال استعلام');
    } finally {
      setSubmitting(false);
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
          <Link href="/contractor/inquiries" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">استعلام قیمت</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Tender Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">عنوان مناقصه</label>
            <select
              value={formData.tenderId}
              onChange={(e) => setFormData({ ...formData, tenderId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">بدون عنوان</option>
              {tenders.map((tender) => (
                <option key={tender.id} value={tender.id}>
                  {tender.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">دسته‌بندی *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">انتخاب کنید</option>
              {technicalAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">کالا/خدمات *</label>
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
            <label className="block text-gray-700 mb-2 font-medium">مقدار *</label>
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
            <label className="block text-gray-700 mb-2 font-medium">زمان نیاز *</label>
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

          {/* Favorite Suppliers Selection */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">
              ارسال به تأمین‌کنندگان مورد علاقه ({formData.selectedSuppliers.length} انتخاب شده)
            </label>
            {favoriteSuppliers.length > 0 && (
              <div className="mb-3">
                <label className="flex items-center gap-2 p-2 border-2 border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={favoriteSuppliers.every(s => formData.selectedSuppliers.includes(s.id))}
                    onChange={toggleAllFavoriteSuppliers}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-blue-700">انتخاب همه</span>
                </label>
              </div>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {favoriteSuppliers.map((supplier) => (
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
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {supplier.logo ? (
                      <Image
                        src={supplier.logo}
                        alt={supplier.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      supplier.name && supplier.name.length > 0 ? supplier.name.charAt(0) : "?"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{supplier.name}</p>
                    {supplier.categories && supplier.categories.length > 0 && (
                      <p className="text-xs text-gray-600">{supplier.categories.join(', ')}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {favoriteSuppliers.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4 mb-4">هیچ تأمین‌کننده مورد علاقه‌ای یافت نشد</p>
            )}
          </div>

          {/* All Suppliers Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-medium">
                مشاهده همه تأمین‌کنندگان
              </label>
              <button
                onClick={() => setShowAllSuppliers(!showAllSuppliers)}
                className="text-blue-600 text-sm font-medium"
              >
                {showAllSuppliers ? "بستن" : "نمایش"}
              </button>
            </div>
            {showAllSuppliers && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suppliers
                  .filter(s => !favoriteSuppliers.some(fs => fs.id === s.id))
                  .map((supplier) => (
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
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {supplier.logo ? (
                          <Image
                            src={supplier.logo}
                            alt={supplier.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          supplier.name && supplier.name.length > 0 ? supplier.name.charAt(0) : "?"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.categories && supplier.categories.length > 0 && (
                          <p className="text-xs text-gray-600">{supplier.categories.join(', ')}</p>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            )}
            {showAllSuppliers && suppliers.filter(s => !favoriteSuppliers.some(fs => fs.id === s.id)).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">هیچ تأمین‌کننده دیگری یافت نشد</p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "در حال ارسال..." : `ارسال استعلام به ${formData.selectedSuppliers.length} تأمین‌کننده`}
          </button>

          <p className="text-xs text-gray-500 text-center">
            استعلام شما به صورت هم‌زمان به تمام تأمین‌کنندگان انتخاب شده ارسال می‌شود
          </p>
        </div>
      </div>
    </div>
  );
}
