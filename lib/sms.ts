interface SMSParams {
  ApiKey: string;
  Text: string;
  Sender: string;
  Recipients: string;
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    // اطمینان از فرمت صحیح شماره موبایل
    const cleanPhone = phoneNumber.replace(/\D/g, ""); // حذف تمام کاراکترهای غیر عددی

    const smsParams: SMSParams = {
      ApiKey: "272458-71781b19fd0845ee99ded2104fca2453",
      Text: message,
      Sender: "30006721606060",
      Recipients: cleanPhone,
    };

    // ساخت URL با پارامترها
    const url = new URL("http://api.sms-webservice.com/api/V3/Send");
    Object.entries(smsParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log("ارسال پیامک به:", phoneNumber, "->", cleanPhone);
    console.log("متن پیامک:", message);
    console.log("URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "خطا در ارسال پیامک:",
        response.status,
        response.statusText
      );
      return false;
    }

    const result = await response.text();
    console.log("نتیجه ارسال پیامک:", result);

    // بررسی نتیجه - API جدید ممکن است JSON یا متن برگرداند
    try {
      const jsonResult = JSON.parse(result);
      // اگر JSON بود، بررسی می‌کنیم که آیا موفقیت‌آمیز بوده یا نه
      if (
        jsonResult.Success ||
        jsonResult.success ||
        jsonResult.Status === "OK"
      ) {
        return true;
      }
    } catch {
      // اگر JSON نبود، بررسی می‌کنیم که آیا شامل کلمات موفقیت است
      const lowerResult = result.toLowerCase();
      if (
        lowerResult.includes("success") ||
        lowerResult.includes("ok") ||
        lowerResult.includes("sent")
      ) {
        return true;
      }
    }

    // اگر هیچ‌کدام از موارد بالا نبود، بررسی می‌کنیم که آیا کد عددی موفقیت است
    const resultCode = parseInt(result.trim());
    if (!isNaN(resultCode) && resultCode >= 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("خطا در ارسال پیامک:", error);
    return false;
  }
}

export async function sendVerificationCode(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const message = `کد تأیید شما: ${code}\nاین کد تا 10 دقیقه معتبر است.\n\nوین تندر - شبکه هوشمند مناقصات و تأمین صنعتی`;
  return await sendSMS(phoneNumber, message);
}
