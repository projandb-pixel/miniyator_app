"use client";

import { useState, useEffect } from "react";

interface TenderTimerProps {
  deadline: string | Date;
  label: string;
  className?: string;
}

export default function TenderTimer({
  deadline,
  label,
  className = "",
}: TenderTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const difference = deadlineDate.getTime() - now.getTime();

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        expired: false,
      };
    };

    // محاسبه اولیه
    setTimeLeft(calculateTimeLeft());

    // به‌روزرسانی هر ثانیه
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.expired) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm ${className}`}
      >
        <div className="text-[10px] text-gray-500 mb-0.5 font-medium">{label}</div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
          <span className="text-[10px] text-red-600 font-semibold">منقضی شده</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm ${className}`}
    >
      <div className="text-[10px] text-gray-500 mb-1 font-medium">{label}</div>
      <div className="flex items-center justify-center gap-0.5">
        {timeLeft.days > 0 && (
          <>
            <span className="text-xs font-bold text-gray-800">
              {timeLeft.days}
            </span>
            <span className="text-[10px] text-gray-500 mr-0.5">روز</span>
            <span className="text-gray-300 mx-0.5">•</span>
          </>
        )}
        <span className="text-xs font-bold text-gray-800">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="text-gray-400 text-[10px] mx-0.5">:</span>
        <span className="text-xs font-bold text-gray-800">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="text-gray-400 text-[10px] mx-0.5">:</span>
        <span className="text-xs font-bold text-gray-800">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

