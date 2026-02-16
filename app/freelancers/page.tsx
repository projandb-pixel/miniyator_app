"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Freelancer {
  id: string;
  name: string;
  skill: string;
  experience: string;
  dailyRate: string;
  location: string;
  available: boolean;
  rating: number;
  avatar: string | null;
}

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>("all");

  useEffect(() => {
    fetchFreelancers();
  }, [selectedSkill]);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSkill !== "all") {
        params.append('skill', selectedSkill);
      }
      params.append('available', 'true');
      
      const response = await fetch(`/api/freelancers?${params.toString()}`);
      const data = await response.json();
      
      if (data.freelancers) {
        setFreelancers(data.freelancers);
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const skills = [
    "همه",
    "برق‌کار صنعتی",
    "تکنسین ابزاردقیق",
    "جوشکار",
    "سرپرست کارگاه",
    "نقشه‌کش Piping",
  ];

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
          <h1 className="text-xl font-bold text-gray-800">فریلنسرها</h1>
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Skill Filter Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2 p-4">
          {skills.map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill === "همه" ? "all" : skill)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                (selectedSkill === "all" && skill === "همه") || selectedSkill === skill
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Freelancers List */}
      <div className="pb-20">
        {freelancers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-96 p-8">
            <span className="text-6xl mb-4">👷</span>
            <p className="text-gray-600 text-center">هیچ فریلنسری وجود ندارد</p>
          </div>
        )}

        {freelancers.map((freelancer) => (
          <div key={freelancer.id} className="bg-white mb-3 p-4 border-b border-gray-100">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                freelancer.available ? "bg-green-500" : "bg-gray-400"
              }`}>
                {freelancer.avatar || (freelancer.name && freelancer.name.length > 0 ? freelancer.name.charAt(0) : "?")}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{freelancer.name}</h3>
                  {freelancer.available && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      ✓ در دسترس
                    </span>
                  )}
                  {!freelancer.available && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      مشغول
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-blue-600 mb-1">{freelancer.skill}</p>

                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                  <span>⭐ {freelancer.rating}</span>
                  <span>📅 {freelancer.experience} سابقه</span>
                  <span>📍 {freelancer.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-green-600">
                    {freelancer.dailyRate} تومان / روز
                  </p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    تماس
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bottom Sheet */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowFilters(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">فیلتر فریلنسرها</h2>
              <button onClick={() => setShowFilters(false)} className="text-gray-500">
                ✕
              </button>
            </div>

            {/* Skill Filter */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">مهارت</h3>
              <div className="flex flex-wrap gap-2">
                {["برق‌کار", "ابزاردقیق", "جوشکار", "سرپرست", "نقشه‌کش"].map((skill) => (
                  <button key={skill} className="px-4 py-2 border border-gray-300 rounded-full text-sm">
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">قیمت روزانه (میلیون تومان)</h3>
              <div className="flex items-center gap-4">
                <input type="range" min="1" max="5" step="0.5" className="flex-1" />
                <div className="flex gap-2 text-sm">
                  <span>۱</span>
                  <span>۵</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">موقعیت</h3>
              <div className="flex flex-wrap gap-2">
                {["ماهشهر", "تهران", "اصفهان", "بندرعباس"].map((loc) => (
                  <button key={loc} className="px-4 py-2 border border-gray-300 rounded-full text-sm">
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="font-medium">فقط در دسترس</span>
              </label>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
              اعمال فیلترها
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
