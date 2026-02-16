import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "@prisma/client", "@prisma/adapter-mssql"],
  // اضافه کردن turbopack config برای سازگاری با Next.js 16
  turbopack: {},
};

// فقط در production build از PWA استفاده کن
// در development، PWA را غیرفعال می‌کنیم تا با Turbopack سازگار باشد
let finalConfig: NextConfig = nextConfig;

// بررسی اینکه آیا در حال build هستیم یا نه
const isBuild = process.env.NODE_ENV === "production";

if (isBuild) {
  try {
    // فقط در production build، next-pwa را استفاده کن
    const withPWA = require("next-pwa")({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: false,
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: "NetworkFirst",
          options: {
            cacheName: "offlineCache",
            expiration: {
              maxEntries: 200,
            },
          },
        },
      ],
      buildExcludes: [/app-manifest\.json$/],
    });
    finalConfig = withPWA(nextConfig);
  } catch (error) {
    console.warn("Failed to load next-pwa, continuing without PWA:", error);
  }
}

export default finalConfig;
