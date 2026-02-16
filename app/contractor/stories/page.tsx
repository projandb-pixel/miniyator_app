"use client";

import { useState } from "react";
import Link from "next/link";
import ContractorNavigation from "@/components/contractor/ContractorNavigation";

export default function ContractorStories() {
  const [stories] = useState([
    {
      id: 1,
      company: "پتروشیمی بندرامام",
      type: "need",
      title: "نیاز فوری به تجهیزات برق",
      time: "2 ساعت پیش",
    },
    {
      id: 2,
      company: "پتروشیمی اروند",
      type: "progress",
      title: "پیشرفت 60% پروژه",
      time: "5 ساعت پیش",
    },
    {
      id: 3,
      company: "پتروشیمی مارون",
      type: "subcontractor",
      title: "نیاز به پیمانکار فرعی",
      time: "1 روز پیش",
    },
  ]);

  return (
    <div className="mobile-container bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/contractor/home" className="text-gray-600">
            ← بازگشت
          </Link>
          <h1 className="text-lg font-bold">استوری‌های صنعتی</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3">استوری‌های پیمانکاران</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 w-24 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                  {story.company && story.company.length > 0 ? story.company.charAt(0) : "?"}
                </div>
                <p className="text-xs text-gray-600 truncate">{story.company}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold mb-3">استوری‌های تأمین‌کنندگان</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { name: "تأمین تجهیزات پارس", type: "inventory" },
              { name: "ابزار دقیق صنعتی", type: "discount" },
              { name: "مکانیک صنعتی", type: "new-product" },
            ].map((story, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-24 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                  {story.name && story.name.length > 0 ? story.name.charAt(0) : "?"}
                </div>
                <p className="text-xs text-gray-600 truncate">{story.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h3 className="font-bold mb-3">ایجاد استوری جدید</h3>
          <div className="space-y-2">
            <Link
              href="/contractor/stories/create"
              className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-right hover:bg-gray-50"
            >
              📸 مراحل پیشرفت پروژه
            </Link>
            <Link
              href="/contractor/stories/create"
              className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-right hover:bg-gray-50"
            >
              ⚠️ اعلام نیاز فوری
            </Link>
            <Link
              href="/contractor/stories/create"
              className="block w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-right hover:bg-gray-50"
            >
              🤝 فراخوان همکاری
            </Link>
          </div>
        </div>
      </div>

      <ContractorNavigation />
    </div>
  );
}
