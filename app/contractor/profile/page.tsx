"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import ProvinceCitySelect from "@/components/ProvinceCitySelect";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";
import PersianDatePicker from "@/components/PersianDatePicker";

export default function ContractorProfile() {
  const [userId, setUserId] = useState<string | null>(null);
  const [, setProfile] = useState<{
    role: string;
    company?: {
      name?: string;
      legalType?: string;
      companyType?: string;
      registrationNumber?: string;
      nationalId?: string;
      establishmentYear?: string;
      address?: string;
      officePhone?: string;
      email?: string;
      website?: string;
      workingHours?: string;
      welcomeMessage?: string;
      bio?: string;
      city?: string;
      province?: string;
      logo?: string;
      letterheadImage?: string;
      activityType?: string;
      mainActivityAreas?: string;
      equipmentList?: string;
      keyPersonnelCount?: string;
      rank?: string;
      rankCertificate?: string;
      ministryCertificate?: string;
      hseCertificate?: string;
      qualificationCertificate?: string;
      iso9001?: boolean;
      iso14001?: boolean;
      iso45001?: boolean;
      iso50001?: boolean;
      wpsPqr?: boolean;
      asme?: boolean;
      api?: boolean;
      personnelCertificates?: string;
      categories?: Array<{ category: string }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    legalType: "",
    companyType: "",
    registrationNumber: "",
    nationalId: "",
    establishmentYear: "",
    province: "",
    city: "",
    address: "",
    officePhones: [] as string[],
    mobilePhones: [] as string[],
    email: "",
    website: "",
    logo: "",
    letterheadImage: "",
    bio: "",
    vision: "",
    mission: "",
    workingHours: "",
    welcomeMessage: "",
    mainActivityAreas: [] as string[],
    customMainActivityAreas: [] as string[],
    technicalAreas: [] as string[],
    equipmentList: [] as Array<{ name: string; count: number }>,
    machineryList: [] as Array<{ name: string; count: number }>,
    keyPersonnelCount: [] as Array<{ name: string; count: number }>,
    rank: "",
    rankField: "",
    rankCertificate: "",
    ministryCertificate: "",
    hseCertificate: "",
    hseCertificateFile: "",
    hseCertificateValid: false,
    hseCertificateExpiry: "",
    qualificationCertificate: "",
    qualificationCertificateFile: "",
    qualificationCertificateValid: false,
    qualificationCertificateExpiry: "",
    iso9001: false,
    iso14001: false,
    iso45001: false,
    iso50001: false,
    wpsPqr: false,
    asme: false,
    api: false,
    managementStandards: [] as Array<{
      name: string;
      valid: boolean;
      expiry: string;
    }>,
    professionalCertificates: [] as Array<{
      name: string;
      valid: boolean;
      expiry: string;
    }>,
    personnelCertificates: [] as Array<{ name: string; file: string }>,
    committeeMemberships: [] as Array<{ name: string; logo: string }>,
    projectHistory: [] as Array<{
      client: string;
      contractTitle: string;
      amount: string;
      startDate: string;
      endDate: string;
      status: "جاری" | "اتمام";
    }>,
    specializedSoftware: [] as Array<{ name: string }>,
  });

  const legalTypes = [
    { value: "sahami-khas", label: "سهامی خاص" },
    { value: "sahami-am", label: "سهامی عام" },
    { value: "masooliat-mahdud", label: "مسئولیت محدود" },
  ];

  const mainActivityAreas = useMemo(
    () => [
      { value: "epc", label: "EPC (Design – Procurement – Construction)" },
      { value: "pc", label: "PC (Procurement – Construction)" },
    ],
    []
  );

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

  const fourMItems = {
    equipment: [
      "جرثقیل",
      "بولدوزر",
      "لودر",
      "کمپرسور",
      "ژنراتور",
      "پمپ",
    ],
    machinery: ["ماشین جوش", "ماشین برش", "ماشین تراش", "سایر..."],
    manpower: ["مهندس", "تکنسین", "جوشکار", "برقکار", "نقاش", "سایر..."],
    material: ["فولاد", "بتن", "لوله", "سایر..."],
  };

  const rankFields = [
    "ساختمان",
    "راه و ساختمان",
    "تأسیسات و تجهیزات",
    "صنعت و معدن",
    "کشاورزی",
    "آب",
    "برق",
    "نفت و گاز",
    "سایر",
  ];

  const ranks = [
    { value: "1", label: "رتبه ۱ (بالاترین)" },
    { value: "2", label: "رتبه ۲" },
    { value: "3", label: "رتبه ۳" },
    { value: "4", label: "رتبه ۴" },
    { value: "5", label: "رتبه ۵" },
  ];

  const fetchProfile = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const response = await fetch(`/api/profile?userId=${id}`);
        const data = await response.json();

        if (data.user && data.user.company) {
          setProfile(data.user);
          const company = data.user.company;

          // Parse mainActivityAreas from JSON string if exists
          let mainAreas: string[] = [];
          if (company.mainActivityAreas) {
            try {
              mainAreas = JSON.parse(company.mainActivityAreas);
            } catch {
              mainAreas = [];
            }
          }

          // Parse bio field (contractors only need about/vision/mission here)
          let bioData: { about?: string; vision?: string; mission?: string } = {};
          if (company.bio) {
            try {
              const parsed = JSON.parse(company.bio);
              if (parsed && typeof parsed === "object") {
                bioData = {
                  about: (parsed as any).about,
                  vision: (parsed as any).vision,
                  mission: (parsed as any).mission,
                };
              }
            } catch {
              bioData = { about: company.bio };
            }
          }

          // Parse office phones
          const officePhones = company.officePhone
            ? company.officePhone.split(",").filter(Boolean)
            : [];

          // Parse equipment and personnel lists
          let equipmentList: Array<{ name: string; count: number }> = [];
          let keyPersonnelCount: Array<{ name: string; count: number }> = [];
          try {
            if (company.equipmentList) {
              const parsed = JSON.parse(company.equipmentList);
              // Backward compatibility: convert string[] to new format
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === "string") {
                  equipmentList = parsed.map((item: string) => ({
                    name: item,
                    count: 1,
                  }));
                } else {
                  equipmentList = parsed;
                }
              }
            }
          } catch {}
          try {
            if (company.keyPersonnelCount) {
              const parsed = JSON.parse(company.keyPersonnelCount);
              // Backward compatibility: convert string[] to new format
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === "string") {
                  keyPersonnelCount = parsed.map((item: string) => ({
                    name: item,
                    count: 1,
                  }));
                } else {
                  keyPersonnelCount = parsed;
                }
              }
            }
          } catch {}

          setProfileForm({
            name: company.name || "",
            legalType: company.legalType || company.companyType || "",
            companyType: company.companyType || company.legalType || "",
            registrationNumber: company.registrationNumber || "",
            nationalId: company.nationalId || "",
            establishmentYear: company.establishmentYear || "",
            province: company.province || "",
            city: company.city || "",
            address: company.address || "",
            officePhones: officePhones,
            mobilePhones: [],
            email: company.email || "",
            website: company.website || "",
            logo: company.logo || "",
            letterheadImage: company.letterheadImage || "",
            bio: bioData.about || "",
            vision: bioData.vision || "",
            mission: bioData.mission || "",
            workingHours: company.workingHours || "",
            welcomeMessage: company.welcomeMessage || "",
            mainActivityAreas: mainAreas.filter((a: string) =>
              mainActivityAreas.some((ma) => ma.value === a)
            ),
            customMainActivityAreas: mainAreas.filter(
              (a: string) => !mainActivityAreas.some((ma) => ma.value === a)
            ),
            technicalAreas:
              company.categories?.map(
                (c: { category: string }) => c.category
              ) || [],
            equipmentList: equipmentList,
            machineryList: [],
            keyPersonnelCount: keyPersonnelCount,
            rank: company.rank || "",
            rankField: "",
            rankCertificate: company.rankCertificate || "",
            ministryCertificate: company.ministryCertificate || "",
            hseCertificate: company.hseCertificate || "",
            hseCertificateFile: "",
            hseCertificateValid: false,
            hseCertificateExpiry: "",
            qualificationCertificate: company.qualificationCertificate || "",
            qualificationCertificateFile: "",
            qualificationCertificateValid: false,
            qualificationCertificateExpiry: "",
            iso9001: false,
            iso14001: false,
            iso45001: false,
            iso50001: false,
            wpsPqr: false,
            asme: false,
            api: false,
            managementStandards: [],
            professionalCertificates: [],
            personnelCertificates: [],
            committeeMemberships: [],
            projectHistory: [],
            specializedSoftware: [],
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    },
    [mainActivityAreas]
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      fetch(`/api/profile?userId=${storedUserId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            if (data.user.role !== "contractor") {
              if (globalThis.window) {
                globalThis.window.location.href = "/supplier/profile";
              }
            } else {
              setUserId(storedUserId);
              fetchProfile(storedUserId);
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
  }, [fetchProfile]);

  const toggleArrayItem = (
    array: string[],
    item: string,
    field: "mainActivityAreas" | "technicalAreas"
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const getMissingFields = () => {
    const missing: string[] = [];

    if (!profileForm.name || profileForm.name.trim() === "") {
      missing.push("نام شرکت");
    }
    if (!profileForm.province || profileForm.province.trim() === "") {
      missing.push("استان");
    }
    if (!profileForm.city || profileForm.city.trim() === "") {
      missing.push("شهر");
    }

    return missing;
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    const trimmedForm = {
      name: profileForm.name?.trim() || "",
      province: profileForm.province?.trim() || "",
      city: profileForm.city?.trim() || "",
    };

    const missing: string[] = [];
    if (!trimmedForm.name) missing.push("نام شرکت");
    if (!trimmedForm.province) missing.push("استان");
    if (!trimmedForm.city) missing.push("شهر");

    if (missing.length > 0) {
      alert(`لطفاً فیلدهای زیر را پر کنید:\n${missing.join("\n")}`);
      return;
    }

    try {
      setSaving(true);

      const bioPayload: Record<string, string> = {};
      const aboutValue = profileForm.bio?.trim();
      const visionValue = profileForm.vision?.trim();
      const missionValue = profileForm.mission?.trim();
      if (aboutValue) bioPayload.about = aboutValue;
      if (visionValue) bioPayload.vision = visionValue;
      if (missionValue) bioPayload.mission = missionValue;
      const bioValue =
        Object.keys(bioPayload).length > 0 ? JSON.stringify(bioPayload) : null;

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyData: {
            name: trimmedForm.name,
            legalType: profileForm.legalType?.trim() || null,
            companyType: profileForm.legalType?.trim() || null,
            registrationNumber: profileForm.registrationNumber?.trim() || null,
            nationalId: profileForm.nationalId?.trim() || null,
            establishmentYear: profileForm.establishmentYear?.trim() || null,
            city: trimmedForm.city,
            province: trimmedForm.province,
            address: profileForm.address?.trim() || null,
            officePhone: profileForm.officePhones.join(",") || null,
            email: profileForm.email?.trim() || null,
            website: profileForm.website?.trim() || null,
            logo: profileForm.logo || null,
            letterheadImage: profileForm.letterheadImage?.trim() || null,
            bio: bioValue,
            workingHours: profileForm.workingHours?.trim() || null,
            welcomeMessage: profileForm.welcomeMessage?.trim() || null,
            mainActivityAreas: JSON.stringify([
              ...profileForm.mainActivityAreas,
              ...profileForm.customMainActivityAreas,
            ]),
            equipmentList: JSON.stringify(profileForm.equipmentList),
            keyPersonnelCount: JSON.stringify(profileForm.keyPersonnelCount),
            rank: profileForm.rank?.trim() || null,
            rankCertificate: profileForm.rankCertificate || null,
            ministryCertificate: profileForm.ministryCertificate || null,
            hseCertificate: profileForm.hseCertificateFile || null,
            qualificationCertificate:
              profileForm.qualificationCertificateFile || null,
            iso9001: false,
            iso14001: false,
            iso45001: false,
            iso50001: false,
            wpsPqr: false,
            asme: false,
            api: false,
            personnelCertificates: null,
          },
          categories: profileForm.technicalAreas,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // بررسی وضعیت تکمیل پروفایل
        const statusResponse = await fetch(
          `/api/auth/profile-status?userId=${userId}`
        );
        const statusData = await statusResponse.json();

        if (statusData.profileCompleted) {
          alert("پروفایل با موفقیت ذخیره شد");
          if (globalThis.window) {
            globalThis.window.location.href = "/contractor/dashboard";
          }
        } else {
          alert(
            "پروفایل ذخیره شد، اما هنوز کامل نشده است. لطفاً تمام فیلدهای الزامی را پر کنید."
          );
          await fetchProfile(userId);
        }
      } else {
        alert(data.error || "خطا در ذخیره پروفایل");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("خطا در ذخیره پروفایل");
    } finally {
      setSaving(false);
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

  const missingFields = getMissingFields();

  return (
    <div className="mobile-container bg-gray-50">
      <style jsx global>{`
        .category-btn-text {
          color: #000000 !important;
          font-weight: 700 !important;
        }
      `}</style>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/dashboard" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">پروفایل</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Banner */}
        {missingFields.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              لطفاً اطلاعات زیر را تکمیل کنید تا بتوانید از تمام امکانات استفاده
              کنید
            </p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
          <h2 className="text-xl font-bold mb-4">🔵 ۱) اطلاعات پایه شرکت</h2>

          <div className="space-y-4 mb-6">
            {/* الف) مشخصات حقوقی */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                🔹 الف) مشخصات حقوقی
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  نوع شخصیت حقوقی *
                </label>
                <select
                  value={profileForm.legalType}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      legalType: e.target.value,
                      companyType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  {legalTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ب) اطلاعات هویتی شرکت */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                🔹 ب) اطلاعات هویتی شرکت
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    نام کامل شرکت *
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="نام کامل شرکت"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      شناسه ملی
                    </label>
                    <input
                      type="text"
                      value={profileForm.nationalId}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          nationalId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="شناسه ملی"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      شماره ثبت
                    </label>
                    <input
                      type="text"
                      value={profileForm.registrationNumber}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          registrationNumber: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="شماره ثبت"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    سال تأسیس
                  </label>
                  <input
                    type="number"
                    value={profileForm.establishmentYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      // فقط اعداد را قبول کن و حداکثر 4 رقم
                      const numericValue = value.replace(/\D/g, "").slice(0, 4);
                      setProfileForm((prev) => ({
                        ...prev,
                        establishmentYear: numericValue,
                      }));
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      // اگر مقدار وارد شده و کمتر از 4 رقم است، پاک کن
                      if (value && value.length < 4) {
                        setProfileForm((prev) => ({
                          ...prev,
                          establishmentYear: "",
                        }));
                      }
                    }}
                    maxLength={4}
                    min="1300"
                    max="1500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="مثال: ۱۳۸۰"
                  />
                </div>

                <ProvinceCitySelect
                  selectedProvince={profileForm.province}
                  selectedCity={profileForm.city}
                  onProvinceChange={(province) =>
                    setProfileForm((prev) => ({ ...prev, province, city: "" }))
                  }
                  onCityChange={(city) =>
                    setProfileForm((prev) => ({ ...prev, city }))
                  }
                  required={true}
                />

                <div>
                  <label className="block text-sm font-medium mb-1">
                    آدرس دفتر مرکزی
                  </label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="آدرس کامل دفتر مرکزی"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    شماره تماس
                  </label>
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-600">
                        شماره ثابت
                      </label>
                      {profileForm.officePhones.map((phone, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const newPhones = [...profileForm.officePhones];
                              newPhones[index] = e.target.value;
                              setProfileForm((prev) => ({
                                ...prev,
                                officePhones: newPhones,
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="02112345678"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPhones = profileForm.officePhones.filter(
                                (_, i) => i !== index
                              );
                              setProfileForm((prev) => ({
                                ...prev,
                                officePhones: newPhones,
                              }));
                            }}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileForm((prev) => ({
                            ...prev,
                            officePhones: [...prev.officePhones, ""],
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        + افزودن شماره ثابت
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-600">
                        شماره موبایل
                      </label>
                      {profileForm.mobilePhones.map((phone, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const newPhones = [...profileForm.mobilePhones];
                              newPhones[index] = e.target.value;
                              setProfileForm((prev) => ({
                                ...prev,
                                mobilePhones: newPhones,
                              }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="09123456789"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newPhones = profileForm.mobilePhones.filter(
                                (_, i) => i !== index
                              );
                              setProfileForm((prev) => ({
                                ...prev,
                                mobilePhones: newPhones,
                              }));
                            }}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                          >
                            حذف
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setProfileForm((prev) => ({
                            ...prev,
                            mobilePhones: [...prev.mobilePhones, ""],
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        + افزودن شماره موبایل
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    ایمیل کاری
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    درباره ما
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="درباره شرکت..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    چشم‌انداز
                  </label>
                  <textarea
                    value={profileForm.vision}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        vision: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="چشم‌انداز شرکت..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    مأموریت
                  </label>
                  <textarea
                    value={profileForm.mission}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        mission: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="مأموریت شرکت..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    بارگذاری لوگوی پیمانکار
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // بررسی اندازه فایل (حداکثر 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert("حجم فایل نباید بیشتر از 5 مگابایت باشد");
                          e.target.value = ""; // پاک کردن انتخاب
                          return;
                        }
                        // بررسی نوع فایل
                        if (!file.type.startsWith("image/")) {
                          alert("لطفاً فقط فایل تصویری انتخاب کنید");
                          e.target.value = ""; // پاک کردن انتخاب
                          return;
                        }
                        // تبدیل فایل به base64
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm((prev) => ({
                            ...prev,
                            logo: reader.result as string,
                          }));
                        };
                        reader.onerror = () => {
                          alert("خطا در خواندن فایل. لطفاً دوباره تلاش کنید");
                          e.target.value = ""; // پاک کردن انتخاب
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  {profileForm.logo && (
                    <Image
                      src={profileForm.logo}
                      alt="Logo"
                      width={128}
                      height={128}
                      className="mt-2 w-32 h-32 object-contain"
                      unoptimized
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 🔵 ۲) حوزه تخصصی فعالیت */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">🔵 ۲) حوزه تخصصی فعالیت</h2>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">🔹 حوزه‌های اصلی</h3>
              <div className="space-y-2 mb-3">
                {mainActivityAreas.map((area) => (
                  <button
                    key={area.value}
                    onClick={() =>
                      toggleArrayItem(
                        profileForm.mainActivityAreas,
                        area.value,
                        "mainActivityAreas"
                      )
                    }
                    className={`w-full p-3 rounded-lg border-2 text-right transition ${
                      profileForm.mainActivityAreas.includes(area.value)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {profileForm.customMainActivityAreas.map((area, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => {
                        const newAreas = [
                          ...profileForm.customMainActivityAreas,
                        ];
                        newAreas[index] = e.target.value;
                        setProfileForm((prev) => ({
                          ...prev,
                          customMainActivityAreas: newAreas,
                        }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="حوزه اصلی ..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newAreas =
                          profileForm.customMainActivityAreas.filter(
                            (_, i) => i !== index
                          );
                        setProfileForm((prev) => ({
                          ...prev,
                          customMainActivityAreas: newAreas,
                        }));
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm((prev) => ({
                      ...prev,
                      customMainActivityAreas: [
                        ...prev.customMainActivityAreas,
                        "",
                      ],
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  + افزودن حوزه اصلی
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">🔹 حوزه‌های فنی</h3>
              <p className="text-sm text-gray-600 mb-3">
                ✔ پیمانکار می‌تواند چند مورد انتخاب کند.
              </p>
              <div className="space-y-2">
                {technicalAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() =>
                      toggleArrayItem(
                        profileForm.technicalAreas,
                        area,
                        "technicalAreas"
                      )
                    }
                    className={`category-btn-text w-full p-3 rounded-lg border-2 text-right transition ${
                      profileForm.technicalAreas.includes(area)
                        ? "border-blue-700 bg-blue-300"
                        : "border-gray-500 bg-gray-200"
                    }`}
                  >
                    {area}
                    {profileForm.technicalAreas.includes(area) && (
                      <span className="mr-2 text-blue-700">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 🔵 ۳) ارزیابی کیفی */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">🔵 ۳) ارزیابی کیفی</h2>

            {/* سوابق تجربی */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">🔹 سوابق تجربی</h3>
              <div className="space-y-4">
                {profileForm.projectHistory.map((project, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">سابقه {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newHistory = profileForm.projectHistory.filter(
                            (_, i) => i !== index
                          );
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm"
                      >
                        حذف
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        نام کارفرما
                      </label>
                      <input
                        type="text"
                        value={project.client}
                        onChange={(e) => {
                          const newHistory = [...profileForm.projectHistory];
                          newHistory[index].client = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="نام کارفرما"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        عنوان قرارداد
                      </label>
                      <input
                        type="text"
                        value={project.contractTitle}
                        onChange={(e) => {
                          const newHistory = [...profileForm.projectHistory];
                          newHistory[index].contractTitle = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="عنوان قرارداد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        مبلغ (تومان)
                      </label>
                      <input
                        type="text"
                        value={project.amount}
                        onChange={(e) => {
                          const newHistory = [...profileForm.projectHistory];
                          newHistory[index].amount = e.target.value;
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="مبلغ قرارداد"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          تاریخ شروع
                        </label>
                        <PersianDatePicker
                          value={project.startDate}
                          onChange={(value) => {
                            const newHistory = [...profileForm.projectHistory];
                            newHistory[index].startDate = value;
                            setProfileForm((prev) => ({
                              ...prev,
                              projectHistory: newHistory,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="تاریخ شروع"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          تاریخ پایان
                        </label>
                        <PersianDatePicker
                          value={project.endDate}
                          onChange={(value) => {
                            const newHistory = [...profileForm.projectHistory];
                            newHistory[index].endDate = value;
                            setProfileForm((prev) => ({
                              ...prev,
                              projectHistory: newHistory,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="تاریخ پایان"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        وضعیت
                      </label>
                      <select
                        value={project.status}
                        onChange={(e) => {
                          const newHistory = [...profileForm.projectHistory];
                          newHistory[index].status = e.target.value as
                            | "جاری"
                            | "اتمام";
                          setProfileForm((prev) => ({
                            ...prev,
                            projectHistory: newHistory,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="جاری">جاری</option>
                        <option value="اتمام">اتمام</option>
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm((prev) => ({
                      ...prev,
                      projectHistory: [
                        ...prev.projectHistory,
                        {
                          client: "",
                          contractTitle: "",
                          amount: "",
                          startDate: "",
                          endDate: "",
                          status: "جاری",
                        },
                      ],
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  + افزودن سابقه تجربی
                </button>
              </div>
            </div>

            {/* لیست منابع */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">🔹 لیست منابع</h3>

              {/* تجهیزات و ماشین‌آلات */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  🟩 تجهیزات و ماشین‌آلات
                </h4>
                <div className="space-y-3">
                  {fourMItems.equipment.map((item) => {
                    const existingItem = profileForm.equipmentList.find(
                      (i) => i.name === item
                    );
                    const isChecked = !!existingItem;
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileForm((prev) => ({
                                ...prev,
                                equipmentList: [
                                  ...prev.equipmentList,
                                  { name: item, count: 1 },
                                ],
                              }));
                            } else {
                              setProfileForm((prev) => ({
                                ...prev,
                                equipmentList: prev.equipmentList.filter(
                                  (i) => i.name !== item
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">{item}</span>
                        {isChecked && (
                          <label className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={existingItem?.count || 1}
                              onChange={(e) => {
                                const count = Number.parseInt(e.target.value, 10) || 1;
                                setProfileForm((prev) => ({
                                  ...prev,
                                  equipmentList: prev.equipmentList.map((i) =>
                                    i.name === item ? { ...i, count } : i
                                  ),
                                }));
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="تعداد"
                              aria-label={`تعداد ${item}`}
                            />
                            <span className="text-xs text-gray-500">عدد</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                  {fourMItems.machinery.map((item) => {
                    const existingItem = profileForm.machineryList.find(
                      (i) => i.name === item
                    );
                    const isChecked = !!existingItem;
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileForm((prev) => ({
                                ...prev,
                                machineryList: [
                                  ...prev.machineryList,
                                  { name: item, count: 1 },
                                ],
                              }));
                            } else {
                              setProfileForm((prev) => ({
                                ...prev,
                                machineryList: prev.machineryList.filter(
                                  (i) => i.name !== item
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">{item}</span>
                        {isChecked && (
                          <input
                            type="number"
                            min="1"
                            value={existingItem?.count || 1}
                            onChange={(e) => {
                              const count = Number.parseInt(e.target.value) || 1;
                              setProfileForm((prev) => ({
                                ...prev,
                                machineryList: prev.machineryList.map((i) =>
                                  i.name === item ? { ...i, count } : i
                                ),
                              }));
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="تعداد"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* پرسنل کلیدی */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">🟩 پرسنل کلیدی</h4>
                <div className="space-y-3">
                  {fourMItems.manpower.map((item) => {
                    const existingItem = profileForm.keyPersonnelCount.find(
                      (i) => i.name === item
                    );
                    const isChecked = !!existingItem;
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfileForm((prev) => ({
                                ...prev,
                                keyPersonnelCount: [
                                  ...prev.keyPersonnelCount,
                                  { name: item, count: 1 },
                                ],
                              }));
                            } else {
                              setProfileForm((prev) => ({
                                ...prev,
                                keyPersonnelCount: prev.keyPersonnelCount.filter(
                                  (i) => i.name !== item
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">{item}</span>
                        {isChecked && (
                          <input
                            type="number"
                            min="1"
                            value={existingItem?.count || 1}
                            onChange={(e) => {
                              const count = Number.parseInt(e.target.value) || 1;
                              setProfileForm((prev) => ({
                                ...prev,
                                keyPersonnelCount: prev.keyPersonnelCount.map(
                                  (i) => (i.name === item ? { ...i, count } : i)
                                ),
                              }));
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="تعداد"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* نرم‌افزارهای تخصصی */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  🟩 نرم‌افزارهای تخصصی
                </h4>
                <div className="space-y-3">
                  {profileForm.specializedSoftware.map((software, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <input
                          type="text"
                          value={software.name}
                          onChange={(e) => {
                            const newSoftware = [
                              ...profileForm.specializedSoftware,
                            ];
                            newSoftware[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              specializedSoftware: newSoftware,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام نرم‌افزار"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSoftware =
                              profileForm.specializedSoftware.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              specializedSoftware: newSoftware,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        specializedSoftware: [
                          ...prev.specializedSoftware,
                          { name: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن نرم‌افزار تخصصی
                  </button>
                </div>
              </div>
            </div>

            {/* سیستم‌های مدیریتی، گواهی‌نامه‌ها و استانداردها */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                🔷 سیستم‌های مدیریتی، گواهی‌نامه‌ها و استانداردها
              </h3>

              {/* الف) رتبه‌بندی رسمی */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  🔹 الف) رتبه‌بندی رسمی
                </h3>
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      رتبه (رتبه ۱ بالاترین)
                    </label>
                    <select
                      value={profileForm.rank}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          rank: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">انتخاب کنید</option>
                      {ranks.map((rank) => (
                        <option key={rank.value} value={rank.value}>
                          {rank.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {profileForm.rank && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        نوع رشته رتبه
                      </label>
                      <select
                        value={profileForm.rankField}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            rankField: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="">انتخاب کنید</option>
                        {rankFields.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {profileForm.rank && (
                  <div className="space-y-3 bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-800">
                      مدارک الزامی اگر دارای رتبه باشد:
                    </p>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        گواهی رتبه‌بندی از سازمان برنامه و بودجه
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileForm((prev) => ({
                                ...prev,
                                rankCertificate: reader.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {profileForm.rankCertificate && (
                        <a
                          href={profileForm.rankCertificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm mt-1 block"
                        >
                          مشاهده فایل
                        </a>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        گواهی صلاحیت پیمانکاری وزارت نفت (در صورت وجود)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileForm((prev) => ({
                                ...prev,
                                ministryCertificate: reader.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {profileForm.ministryCertificate && (
                        <a
                          href={profileForm.ministryCertificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm mt-1 block"
                        >
                          مشاهده فایل
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* استانداردهای مدیریتی */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  🟩 استانداردهای مدیریتی
                </h4>
                <div className="space-y-3">
                  {profileForm.managementStandards.map((standard, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={standard.name}
                          onChange={(e) => {
                            const newStandards = [
                              ...profileForm.managementStandards,
                            ];
                            newStandards[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              managementStandards: newStandards,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام استاندارد (مثال: ISO 9001)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newStandards =
                              profileForm.managementStandards.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              managementStandards: newStandards,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={standard.valid}
                            onChange={(e) => {
                              const newStandards = [
                                ...profileForm.managementStandards,
                              ];
                              newStandards[index].valid = e.target.checked;
                              setProfileForm((prev) => ({
                                ...prev,
                                managementStandards: newStandards,
                              }));
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">وضعیت اعتبار</span>
                        </label>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">
                            تاریخ پایان اعتبار
                          </label>
                          <PersianDatePicker
                            value={standard.expiry}
                            onChange={(value) => {
                              const newStandards = [
                                ...profileForm.managementStandards,
                              ];
                              newStandards[index].expiry = value;
                              setProfileForm((prev) => ({
                                ...prev,
                                managementStandards: newStandards,
                              }));
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                            placeholder="تاریخ پایان اعتبار"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        managementStandards: [
                          ...prev.managementStandards,
                          { name: "", valid: false, expiry: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن استاندارد مدیریتی
                  </button>
                </div>
              </div>

              {/* گواهینامه‌های حرفه‌ای */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  🟩 گواهینامه‌های حرفه‌ای
                </h4>
                <div className="space-y-3">
                  {profileForm.professionalCertificates.map((cert, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => {
                            const newCerts = [
                              ...profileForm.professionalCertificates,
                            ];
                            newCerts[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              professionalCertificates: newCerts,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام گواهینامه (مثال: WPS/PQR)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newCerts =
                              profileForm.professionalCertificates.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              professionalCertificates: newCerts,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={cert.valid}
                            onChange={(e) => {
                              const newCerts = [
                                ...profileForm.professionalCertificates,
                              ];
                              newCerts[index].valid = e.target.checked;
                              setProfileForm((prev) => ({
                                ...prev,
                                professionalCertificates: newCerts,
                              }));
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">وضعیت اعتبار</span>
                        </label>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">
                            تاریخ پایان اعتبار
                          </label>
                          <PersianDatePicker
                            value={cert.expiry}
                            onChange={(value) => {
                              const newCerts = [
                                ...profileForm.professionalCertificates,
                              ];
                              newCerts[index].expiry = value;
                              setProfileForm((prev) => ({
                                ...prev,
                                professionalCertificates: newCerts,
                              }));
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                            placeholder="تاریخ پایان اعتبار"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        professionalCertificates: [
                          ...prev.professionalCertificates,
                          { name: "", valid: false, expiry: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن گواهینامه حرفه‌ای
                  </button>
                </div>
              </div>

              {/* عضویت در کمیته‌ها و انجمن‌ها */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  🟩 عضویت در کمیته‌ها و انجمن‌ها
                </h4>
                <div className="space-y-3">
                  {profileForm.committeeMemberships.map((membership, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={membership.name}
                          onChange={(e) => {
                            const newMemberships = [
                              ...profileForm.committeeMemberships,
                            ];
                            newMemberships[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              committeeMemberships: newMemberships,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام کمیته/انجمن"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newMemberships =
                              profileForm.committeeMemberships.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              committeeMemberships: newMemberships,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          لوگوی کمیته/انجمن
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newMemberships = [
                                  ...profileForm.committeeMemberships,
                                ];
                                newMemberships[index].logo =
                                  reader.result as string;
                                setProfileForm((prev) => ({
                                  ...prev,
                                  committeeMemberships: newMemberships,
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        {membership.logo && (
                          <Image
                            src={membership.logo}
                            alt="Logo"
                            width={96}
                            height={96}
                            className="mt-2 w-24 h-24 object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        committeeMemberships: [
                          ...prev.committeeMemberships,
                          { name: "", logo: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن عضویت در کمیته/انجمن
                  </button>
                </div>
              </div>
            </div>

            {/* ب) گواهینامه‌ها و مدارک تخصصی */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                🔹 ب) گواهینامه‌ها و مدارک تخصصی
              </h3>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-red-600">
                  گواهینامه‌های الزامی برای صنعت نفت، گاز و پتروشیمی:
                </p>
                <div className="space-y-3">
                  <div className="border border-gray-300 rounded-lg p-3">
                    <label className="block text-sm font-medium mb-1">
                      گواهی صلاحیت ایمنی پیمانکاران (HSE) - وزارت کار *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm((prev) => ({
                              ...prev,
                              hseCertificateFile: reader.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-2"
                    />
                    {profileForm.hseCertificateFile && (
                      <a
                        href={profileForm.hseCertificateFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm block mb-2"
                      >
                        مشاهده فایل
                      </a>
                    )}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profileForm.hseCertificateValid}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              hseCertificateValid: e.target.checked,
                            }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">وضعیت اعتبار</span>
                      </label>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          تاریخ پایان اعتبار
                        </label>
                        <PersianDatePicker
                          value={profileForm.hseCertificateExpiry}
                          onChange={(value) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              hseCertificateExpiry: value,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                          placeholder="تاریخ پایان اعتبار"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-3">
                    <label className="block text-sm font-medium mb-1">
                      گواهی تایید صلاحیت پیمانکاری – سازمان برنامه و بودجه *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm((prev) => ({
                              ...prev,
                              qualificationCertificateFile:
                                reader.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 mb-2"
                    />
                    {profileForm.qualificationCertificateFile && (
                      <a
                        href={profileForm.qualificationCertificateFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm block mb-2"
                      >
                        مشاهده فایل
                      </a>
                    )}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profileForm.qualificationCertificateValid}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              qualificationCertificateValid: e.target.checked,
                            }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm">وضعیت اعتبار</span>
                      </label>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          تاریخ پایان اعتبار
                        </label>
                        <PersianDatePicker
                          value={profileForm.qualificationCertificateExpiry}
                          onChange={(value) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              qualificationCertificateExpiry: value,
                            }))
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                          placeholder="تاریخ پایان اعتبار"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  گواهی‌های مربوط به پرسنل
                </label>
                <div className="space-y-3">
                  {profileForm.personnelCertificates.map((cert, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => {
                            const newCerts = [
                              ...profileForm.personnelCertificates,
                            ];
                            newCerts[index].name = e.target.value;
                            setProfileForm((prev) => ({
                              ...prev,
                              personnelCertificates: newCerts,
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="نام گواهی پرسنل"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newCerts =
                              profileForm.personnelCertificates.filter(
                                (_, i) => i !== index
                              );
                            setProfileForm((prev) => ({
                              ...prev,
                              personnelCertificates: newCerts,
                            }));
                          }}
                          className="mr-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const newCerts = [
                                ...profileForm.personnelCertificates,
                              ];
                              newCerts[index].file = reader.result as string;
                              setProfileForm((prev) => ({
                                ...prev,
                                personnelCertificates: newCerts,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {cert.file && (
                        <a
                          href={cert.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm mt-1 block"
                        >
                          مشاهده فایل
                        </a>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({
                        ...prev,
                        personnelCertificates: [
                          ...prev.personnelCertificates,
                          { name: "", file: "" },
                        ],
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    + افزودن گواهی پرسنل
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره پروفایل"}
          </button>
        </div>
      </div>

      <ContractorNavigation />
    </div>
  );
}
