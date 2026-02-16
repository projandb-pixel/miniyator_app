"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function StoryViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get("id");
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
    
    if (storyId) {
      fetchStory(storyId, storedUserId);
    }
  }, [storyId]);

  const fetchStory = async (id: string, userId: string | null) => {
    try {
      setLoading(true);
      const url = userId
        ? `/api/stories/${id}?userId=${userId}`
        : `/api/stories/${id}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.story) {
        setStory(data.story);
      } else {
        alert(data.error || "استوری یافت نشد");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      alert("خطا در دریافت استوری");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStoryGradient = (type: string) => {
    switch (type) {
      case "need":
        return "from-red-500 to-orange-500";
      case "progress":
        return "from-blue-500 to-cyan-500";
      case "subcontractor":
        return "from-purple-500 to-pink-500";
      case "inventory":
        return "from-green-500 to-emerald-500";
      case "discount":
        return "from-yellow-500 to-orange-500";
      case "new-product":
        return "from-indigo-500 to-purple-500";
      case "service":
        return "from-teal-500 to-cyan-500";
      case "tender_share":
        return "from-blue-500 to-indigo-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} روز پیش`;
    } else if (hours > 0) {
      return `${hours} ساعت پیش`;
    } else if (minutes > 0) {
      return `${minutes} دقیقه پیش`;
    } else {
      return "همین الان";
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mobile-container bg-black">
        <div className="flex items-center justify-center min-h-screen text-white">
          <p>استوری یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-black">
      <div
        className={`relative w-full h-screen bg-gradient-to-br ${getStoryGradient(
          story.type
        )} flex flex-col`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="text-white bg-black/30 rounded-full p-2"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {story.company.logo ? (
                <img
                  src={story.company.logo}
                  alt={story.company.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold">
                  {story.company.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-sm">
                  {story.company.name}
                </p>
                <p className="text-white/80 text-xs">
                  {formatTime(story.createdAt)}
                </p>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute top-16 left-0 right-0 px-4 z-10">
          <div className="w-full bg-white/30 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all duration-5000"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            {story.imageUrl && (
              <img
                src={story.imageUrl}
                alt={story.title}
                className="w-full max-w-md mx-auto mb-4 rounded-lg"
              />
            )}
            {story.videoUrl && (
              <video
                src={story.videoUrl}
                controls
                className="w-full max-w-md mx-auto mb-4 rounded-lg"
              />
            )}
            <h2 className="text-white text-2xl font-bold mb-4">{story.title}</h2>
            {story.content && (
              <p className="text-white/90 text-lg whitespace-pre-line">{story.content}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
          <div className="flex items-center justify-center gap-2">
            <Link
              href={`/contractor/messages?companyId=${story.companyId}`}
              className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white/20 transition"
              title="پیام"
            >
              💬
            </Link>
            {story.company.role === "supplier" && (
              <Link
                href={`/contractor/inquiries?supplierId=${story.companyId}`}
                className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white/20 transition"
                title="استعلام"
              >
                📧
              </Link>
            )}
            {story.type === "tender_share" && (
              <Link
                href={`/tender-details?id=${story.tenderId || ""}`}
                className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white/20 transition"
                title="مشاهده مناقصه"
              >
                📄
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoryView() {
  return (
    <Suspense
      fallback={
        <div className="mobile-container bg-black">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      }
    >
      <StoryViewContent />
    </Suspense>
  );
}
