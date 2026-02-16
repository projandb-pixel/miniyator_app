"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ContractorProfile {
  id: string;
  name: string;
  logo: string | null;
  bio: string | null;
  rank: string | null;
  technicalAreas: string[];
  mainActivityAreas: string[];
  equipmentList: string | null;
  keyPersonnelCount: string | null;
  capacity: string | null;
  projects: Array<{
    id: string;
    title: string;
    client: string | null;
    value: string | null;
    year: string | null;
  }>;
  certificates: {
    hse: boolean;
    iso9001: boolean;
    iso45001: boolean;
    qualification: boolean;
    rank: boolean;
  };
  competitiveIndex: number;
  performanceGraph: Array<{
    month: string;
    successRate: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    client: string;
  }>;
}

function ContractorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractorId = searchParams.get("id");
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "projects" | "reviews" | "certificates">("info");

  useEffect(() => {
    if (contractorId) {
      fetchContractorProfile(contractorId);
    }
  }, [contractorId]);

  const fetchContractorProfile = async (id: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/contractor/${id}/profile`);
      // const data = await response.json();
      
      // Mock data for now
      setContractor({
        id,
        name: "پیمانکاری صنعتی پارس",
        logo: null,
        bio: "شرکت پیمانکاری با سابقه 20 ساله در پروژه‌های نفت، گاز و پتروشیمی",
        rank: "1",
        technicalAreas: ["مکانیک (استاتیک)", "برق", "ابزار دقیق"],
        mainActivityAreas: ["EPC"],
        equipmentList: "کمپرسور، پمپ، ماشین‌آلات جوشکاری",
        keyPersonnelCount: "150 نفر",
        capacity: "ظرفیت خالی: 3 پروژه",
        projects: [
          { id: "1", title: "احداث واحد پتروشیمی", client: "پتروشیمی بندرامام", value: "50 میلیارد", year: "1402" },
          { id: "2", title: "نصب تجهیزات برق", client: "پتروشیمی اروند", value: "25 میلیارد", year: "1401" },
        ],
        certificates: {
          hse: true,
          iso9001: true,
          iso45001: true,
          qualification: true,
          rank: true,
        },
        competitiveIndex: 85,
        performanceGraph: [
          { month: "مهر", successRate: 70 },
          { month: "آبان", successRate: 75 },
          { month: "آذر", successRate: 80 },
          { month: "دی", successRate: 85 },
        ],
        reviews: [
          { id: "1", rating: 5, comment: "پروژه با کیفیت و در زمان مقرر تحویل داده شد", client: "پتروشیمی بندرامام" },
        ],
      });
    } catch (error) {
      console.error("Error fetching contractor profile:", error);
    } finally {
      setLoading(false);
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

  if (!contractor) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="p-4 text-center">
          <p className="text-gray-600">پیمانکار یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => router.back()} className="text-gray-600">
            ← بازگشت
          </button>
          <h1 className="text-lg font-bold">پروفایل پیمانکار</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pb-20">
        {/* Profile Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {contractor.name && contractor.name.length > 0 ? contractor.name.charAt(0) : "?"}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{contractor.name}</h2>
              {contractor.rank && (
                <p className="text-sm text-gray-600">رتبه {contractor.rank} پیمانکاری</p>
              )}
            </div>
          </div>

          {contractor.bio && (() => {
            try {
              const bioData = JSON.parse(contractor.bio);
              const aboutText = bioData.about || contractor.bio;
              return aboutText ? (
                <p className="text-sm text-gray-700 mb-4">{aboutText}</p>
              ) : null;
            } catch {
              // اگر JSON نیست، به صورت مستقیم نمایش بده
              return (
                <p className="text-sm text-gray-700 mb-4">{contractor.bio}</p>
              );
            }
          })()}

          {/* Competitive Index */}
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">سطح رقابت‌پذیری</span>
              <span className="text-lg font-bold text-blue-700">{contractor.competitiveIndex}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${contractor.competitiveIndex}%` }}
              ></div>
            </div>
          </div>

          {/* Capacity */}
          {contractor.capacity && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900">{contractor.capacity}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            {[
              { id: "info", label: "اطلاعات" },
              { id: "projects", label: "پروژه‌ها" },
              { id: "reviews", label: "نظرات" },
              { id: "certificates", label: "گواهینامه‌ها" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Technical Areas */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold mb-3">حوزه‌های تخصصی</h3>
                <div className="flex flex-wrap gap-2">
                  {contractor.technicalAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              {contractor.equipmentList && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-bold mb-3">تجهیزات و ماشین‌آلات</h3>
                  <p className="text-sm text-gray-700">{contractor.equipmentList}</p>
                </div>
              )}

              {/* Personnel */}
              {contractor.keyPersonnelCount && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-bold mb-3">نیروهای کلیدی</h3>
                  <p className="text-sm text-gray-700">{contractor.keyPersonnelCount}</p>
                </div>
              )}

              {/* Performance Graph */}
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold mb-3">نمودار عملکرد مناقصه‌ای</h3>
                <div className="space-y-2">
                  {contractor.performanceGraph.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-12">{point.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-600 h-4 rounded-full"
                          style={{ width: `${point.successRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium w-12 text-left">{point.successRate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-3">
              {contractor.projects.length > 0 ? (
                contractor.projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-bold mb-2">{project.title}</h4>
                    {project.client && (
                      <p className="text-sm text-gray-600 mb-1">کارفرما: {project.client}</p>
                    )}
                    {project.value && (
                      <p className="text-sm font-bold text-green-600 mb-1">ارزش: {project.value}</p>
                    )}
                    {project.year && (
                      <p className="text-xs text-gray-500">سال: {project.year}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  پروژه‌ای ثبت نشده است
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-3">
              {contractor.reviews.length > 0 ? (
                contractor.reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{review.client}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-4 h-4 text-amber-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  نظری ثبت نشده است
                </div>
              )}
            </div>
          )}

          {activeTab === "certificates" && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-bold mb-3">گواهینامه‌ها</h3>
                <div className="space-y-2">
                  {contractor.certificates.hse && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">HSE-MS</span>
                    </div>
                  )}
                  {contractor.certificates.iso9001 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">ISO 9001</span>
                    </div>
                  )}
                  {contractor.certificates.iso45001 && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">ISO 45001</span>
                    </div>
                  )}
                  {contractor.certificates.qualification && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">گواهی صلاحیت پیمانکاری</span>
                    </div>
                  )}
                  {contractor.certificates.rank && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-sm">گواهی رتبه‌بندی</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractorProfileView() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-gray-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      }
    >
      <ContractorProfileContent />
    </Suspense>
  );
}
