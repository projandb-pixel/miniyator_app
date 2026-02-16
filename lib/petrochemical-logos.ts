// شرکت‌های زیرمجموعه هلدینگ خلیج فارس (ماهشهر) که لوگوی مشترک دارند
const persianGulfHoldingCompanies = [
  "اروند",
  "بندرامام",
  "بوعلی سینا",
  "خوزستان",
  "شهید تندگویان",
  "کارون",
  "الماس ماهشهر",
  "آپادانا",
];

// تابع helper برای دریافت مسیر لوگوی پتروشیمی‌ها
export function getPetrochemicalLogo(companyName: string): string | null {
  // اگر شرکت زیرمجموعه هلدینگ خلیج فارس است، لوگوی مشترک را برگردان
  if (persianGulfHoldingCompanies.includes(companyName)) {
    return "/petrochemical-logos/persian-gulf-holding.png";
  }

  const logoMap: { [key: string]: string } = {
    امیرکبیر: "/petrochemical-logos/amirkabir.png",
    مازون: "/petrochemical-logos/mazin.png",
    غدیر: "/petrochemical-logos/ghadir.png",
    مارون: "/petrochemical-logos/maron.png",
    رازی: "/petrochemical-logos/razi.png",
    فن‌آوران: "/petrochemical-logos/fanavaran.png",
    رجال: "/petrochemical-logos/rejal.png",
    "شیمی بافت": "/petrochemical-logos/shimibaft.png",
    فارابی: "/petrochemical-logos/farabi.png",
    لاله: "/petrochemical-logos/lale.png",
    نویدزرشیمی: "/petrochemical-logos/navidzar.png",
    "تخت جمشید": "/petrochemical-logos/takhtjamshid.png",
    "ابن سینا": "/petrochemical-logos/abinsina.png",
    "نخل اسماری": "/petrochemical-logos/nakhlesarmari.png",
    تکست‌آریا: "/petrochemical-logos/testaria.png",
    آریافسفریک‌جنوب: "/petrochemical-logos/ariafarsifghanob.png",
    "سلمان فارسی": "/petrochemical-logos/salamanfarsi.png",
  };

  return logoMap[companyName] || null;
}

// بررسی اینکه آیا یک شرکت پتروشیمی است یا نه
export function isPetrochemicalCompany(companyName: string): boolean {
  const petrochemicalCompanies = [
    ...persianGulfHoldingCompanies,
    "امیرکبیر",
    "مازون",
    "غدیر",
    "مارون",
    "رازی",
    "فن‌آوران",
    "رجال",
    "شیمی بافت",
    "فارابی",
    "لاله",
    "نویدزرشیمی",
    "تخت جمشید",
    "ابن سینا",
    "نخل اسماری",
    "تکست‌آریا",
    "آریافسفریک‌جنوب",
    "سلمان فارسی",
  ];

  return petrochemicalCompanies.includes(companyName);
}
