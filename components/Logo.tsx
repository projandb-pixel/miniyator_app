export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 24, text: "text-lg", gap: "gap-2" },
    md: { icon: 32, text: "text-xl", gap: "gap-3" },
    lg: { icon: 48, text: "text-2xl", gap: "gap-4" },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <div className={`flex items-center ${gap}`}>
      {/* Text */}
      <span className={`font-bold text-gray-800 ${text}`}>وین تندر</span>
      
      {/* Icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-800"
      >
        {/* Outer circle (target) */}
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Inner circle (target) */}
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Megaphone body - left side */}
        <line
          x1="16"
          y1="18"
          x2="16"
          y2="30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Megaphone body - right side (wider opening) */}
        <line
          x1="16"
          y1="18"
          x2="26"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="30"
          x2="26"
          y2="28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Sound waves - top (3 lines) */}
        <line
          x1="26"
          y1="20"
          x2="30"
          y2="18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="26"
          y1="22"
          x2="32"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="26"
          y1="24"
          x2="34"
          y2="22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Sound waves - bottom (3 lines) */}
        <line
          x1="26"
          y1="24"
          x2="30"
          y2="26"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="26"
          y1="26"
          x2="32"
          y2="28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="26"
          y1="28"
          x2="34"
          y2="30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
