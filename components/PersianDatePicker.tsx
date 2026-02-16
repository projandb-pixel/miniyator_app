"use client";

import { useState, useRef, useEffect } from "react";
import { toJalaali, toGregorian, isValidJalaaliDate } from "jalaali-js";

interface PersianDatePickerProps {
  value: string; // Gregorian date in YYYY-MM-DD format
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function PersianDatePicker({
  value,
  onChange,
  className = "",
  placeholder = "تاریخ را انتخاب کنید",
}: PersianDatePickerProps) {
  const [persianDate, setPersianDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState({ year: 1403, month: 1 });
  const calendarRef = useRef<HTMLDivElement>(null);

  // Convert Gregorian to Persian
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        const jDate = toJalaali(year, month, day);
        setPersianDate(
          `${jDate.jy}/${String(jDate.jm).padStart(2, "0")}/${String(jDate.jd).padStart(2, "0")}`
        );
        setCurrentMonth({ year: jDate.jy, month: jDate.jm });
      } else {
        setPersianDate("");
      }
    } else {
      setPersianDate("");
    }
  }, [value]);

  // Get current Persian date
  useEffect(() => {
    if (!value) {
      const now = new Date();
      const jNow = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      setCurrentMonth({ year: jNow.jy, month: jNow.jm });
    }
  }, []);

  // Convert Persian to Gregorian
  const handlePersianDateChange = (persianValue: string) => {
    setPersianDate(persianValue);
    const parts = persianValue.split("/");
    if (parts.length === 3) {
      const [jy, jm, jd] = parts.map((p) => parseInt(p.trim()));
      if (isValidJalaaliDate(jy, jm, jd)) {
        const gDate = toGregorian(jy, jm, jd);
        const gregorianDate = `${gDate.gy}-${String(gDate.gm).padStart(2, "0")}-${String(gDate.gd).padStart(2, "0")}`;
        onChange(gregorianDate);
      }
    } else if (persianValue === "") {
      onChange("");
    }
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    if (month === 12 && isLeapYear(year)) {
      return 30;
    }
    return daysInMonth[month - 1];
  };

  const isLeapYear = (year: number) => {
    return (year + 2346) % 128 <= 29;
  };

  // Get first day of month (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    const gDate = toGregorian(year, month, 1);
    const date = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
    // Convert JavaScript day (0=Sunday) to Persian day (0=Saturday)
    // Saturday=6, Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5
    const jsDay = date.getDay();
    return (jsDay + 1) % 7;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
    const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month);
    const persianWeekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return { days, persianWeekDays };
  };

  const selectDate = (day: number) => {
    const persianValue = `${currentMonth.year}/${String(currentMonth.month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    handlePersianDateChange(persianValue);
    setShowCalendar(false);
  };

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth.month + direction;
    let newYear = currentMonth.year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    setCurrentMonth({ year: newYear, month: newMonth });
  };

  const monthNames = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];

  const { days, persianWeekDays } = generateCalendarDays();

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div className="relative" ref={calendarRef}>
      <input
        type="text"
        value={persianDate}
        onChange={(e) => handlePersianDateChange(e.target.value)}
        onFocus={() => setShowCalendar(true)}
        placeholder={placeholder}
        className={className}
        dir="rtl"
      />
      {showCalendar && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <div className="text-center font-semibold">
              {monthNames[currentMonth.month - 1]} {currentMonth.year}
            </div>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {persianWeekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-sm font-semibold text-gray-600 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-2"></div>;
              }
              const isSelected =
                persianDate ===
                `${currentMonth.year}/${String(currentMonth.month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={`p-2 text-sm rounded hover:bg-blue-100 ${
                    isSelected
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const jNow = toJalaali(
                  now.getFullYear(),
                  now.getMonth() + 1,
                  now.getDate()
                );
                const todayPersian = `${jNow.jy}/${String(jNow.jm).padStart(2, "0")}/${String(jNow.jd).padStart(2, "0")}`;
                handlePersianDateChange(todayPersian);
                setShowCalendar(false);
              }}
              className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

