"use client";

import Image from "next/image";
import { getPetrochemicalLogo, isPetrochemicalCompany } from "@/lib/petrochemical-logos";

interface CompanyLogoProps {
  companyName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CompanyLogo({
  companyName,
  size = "md",
  className = "",
}: CompanyLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const logoPath = isPetrochemicalCompany(companyName)
    ? getPetrochemicalLogo(companyName)
    : null;

  if (logoPath) {
    return (
      <div
        className={`${sizeClasses[size]} bg-blue-100 rounded-full flex items-center justify-center overflow-hidden ${className}`}
      >
        <Image
          src={logoPath}
          alt={companyName}
          width={size === "sm" ? 32 : size === "md" ? 40 : 48}
          height={size === "sm" ? 32 : size === "md" ? 40 : 48}
          className="w-full h-full object-contain p-1"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            if (target.parentElement) {
              const fallback = document.createElement("span");
              fallback.className = "text-blue-600 font-bold";
              fallback.textContent = companyName && companyName.length > 0 ? companyName.charAt(0) : "?";
              target.parentElement.appendChild(fallback);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-blue-100 rounded-full flex items-center justify-center ${className}`}
    >
      <span className="text-blue-600 font-bold">
        {companyName && companyName.length > 0 ? companyName.charAt(0) : "?"}
      </span>
    </div>
  );
}


