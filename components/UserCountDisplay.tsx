"use client";

import { useState, useEffect } from "react";

interface UserCountDisplayProps {
  contractorCount: number;
  supplierCount: number;
}

export default function UserCountDisplay({
  contractorCount,
  supplierCount,
}: UserCountDisplayProps) {
  const [displayedContractors, setDisplayedContractors] = useState(0);
  const [displayedSuppliers, setDisplayedSuppliers] = useState(0);

  useEffect(() => {
    // Reset به صفر برای شروع انیمیشن جدید
    setDisplayedContractors(0);
    setDisplayedSuppliers(0);

    // انیمیشن شمارش برای پیمانکاران
    const contractorDuration = 1500; // 1.5 ثانیه - سرعت منطقی‌تر
    const contractorSteps = Math.max(30, Math.min(contractorCount, 60)); // تعداد مراحل بر اساس مقدار
    const contractorIncrement = contractorCount / contractorSteps;
    const contractorInterval = contractorDuration / contractorSteps;

    let contractorStep = 0;
    const contractorTimer = setInterval(() => {
      contractorStep++;
      const nextValue = Math.min(
        Math.floor(contractorIncrement * contractorStep),
        contractorCount
      );
      setDisplayedContractors(nextValue);
      if (contractorStep >= contractorSteps) {
        clearInterval(contractorTimer);
        setDisplayedContractors(contractorCount);
      }
    }, contractorInterval);

    // انیمیشن شمارش برای تأمین‌کنندگان (با تاخیر کمی)
    const supplierDuration = 1500; // 1.5 ثانیه - سرعت منطقی‌تر
    const supplierSteps = Math.max(30, Math.min(supplierCount, 60)); // تعداد مراحل بر اساس مقدار
    const supplierIncrement = supplierCount / supplierSteps;
    const supplierInterval = supplierDuration / supplierSteps;

    const supplierTimeout = setTimeout(() => {
      let supplierStep = 0;
      const supplierTimer = setInterval(() => {
        supplierStep++;
        const nextValue = Math.min(
          Math.floor(supplierIncrement * supplierStep),
          supplierCount
        );
        setDisplayedSuppliers(nextValue);
        if (supplierStep >= supplierSteps) {
          clearInterval(supplierTimer);
          setDisplayedSuppliers(supplierCount);
        }
      }, supplierInterval);

      // ذخیره timer برای cleanup
      (supplierTimer as any).__cleanup = supplierTimer;
    }, 200); // تاخیر 200ms برای تأمین‌کنندگان

    return () => {
      clearInterval(contractorTimer);
      clearTimeout(supplierTimeout);
    };
  }, [contractorCount, supplierCount]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .user-count-blue-text {
          color: #2563eb !important;
        }
        .user-count-orange-text {
          color: #ea580c !important;
        }
      `}} />
      <div className="flex items-center gap-4 text-xs" style={{ color: '#6b7280' }}>
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="#2563eb"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke="#2563eb"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span style={{ color: '#6b7280' }}>
            <span className="font-bold user-count-blue-text">{displayedContractors.toLocaleString('fa-IR')}</span> پیمانکار
          </span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="#ea580c"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke="#ea580c"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span style={{ color: '#6b7280' }}>
            <span className="font-bold user-count-orange-text">{displayedSuppliers.toLocaleString('fa-IR')}</span> تأمین‌کننده
          </span>
        </div>
      </div>
    </>
  );
}

