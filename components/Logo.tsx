import Image from "next/image";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 20, text: "text-lg", gap: "gap-2" },
    md: { icon: 28, text: "text-xl", gap: "gap-3" },
    lg: { icon: 40, text: "text-2xl", gap: "gap-4" },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <div className={`flex items-center ${gap}`}>
      <Image
        src="/icon.svg"
        width={icon}
        height={icon}
        alt="لوگوی وین تندر"
        className="object-contain"
        priority={size === "lg"}
      />
      {/* Text */}
      <span className={`font-bold text-gray-800 ${text}`}>وین تندر</span>
    </div>
  );
}
