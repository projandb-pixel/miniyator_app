import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { config } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

// Load environment variables
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  config({ path: envPath, override: false });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}

// Parse connection string
function parseConnectionString(connectionString: string) {
  const url = connectionString.replace(/^sqlserver:\/\//, "");
  const [hostPort, ...params] = url.split(";");
  const [server, portStr] = hostPort.split(":");
  const port = portStr ? Number.parseInt(portStr, 10) : 1433;

  const configObj: {
    server: string;
    port: number;
    database?: string;
    user?: string;
    password?: string;
    options?: {
      encrypt?: boolean;
      trustServerCertificate?: boolean;
    };
  } = {
    server,
    port,
    options: {},
  };

  for (const param of params) {
    const [key, value] = param.split("=");
    if (!key || !value) continue;

    switch (key.toLowerCase()) {
      case "database":
        configObj.database = value;
        break;
      case "user":
        configObj.user = value;
        break;
      case "password":
        configObj.password = value;
        break;
      case "encrypt":
        configObj.options!.encrypt = value.toLowerCase() === "true";
        break;
      case "trustservercertificate":
        configObj.options!.trustServerCertificate = value.toLowerCase() === "true";
        break;
    }
  }

  return configObj;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  console.error("Current working directory:", process.cwd());
  console.error(".env.local exists:", existsSync(envLocalPath));
  console.error(".env exists:", existsSync(envPath));
  process.exit(1);
}

const adapterConfig = parseConnectionString(DATABASE_URL);
const adapter = new PrismaMssql(adapterConfig);
const prisma = new PrismaClient({ adapter });

async function createTestAccount() {
  try {
    const testPhone = "09123456789";
    const testPassword = "test123456";
    const testCompanyName = "شرکت تست پیمانکاری";
    const testSupplierName = "شرکت تست تأمین‌کننده";

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test contractor account
    console.log("Creating test contractor account...");
    const contractorUser = await prisma.users.upsert({
      where: { phone: testPhone },
      update: {
        password: hashedPassword,
        role: "contractor",
        isVerified: true,
        profileCompleted: false,
        otpCode: null,
        otpExpiresAt: null,
      },
      create: {
        id: crypto.randomUUID(),
        phone: testPhone,
        password: hashedPassword,
        role: "contractor",
        isVerified: true,
        profileCompleted: false,
        updatedAt: new Date(),
      },
    });

    // Create contractor company
    const contractorCompany = await prisma.companies.upsert({
      where: { userId: contractorUser.id },
      update: {
        name: testCompanyName,
        city: "تهران",
        province: "تهران",
      },
      create: {
        id: crypto.randomUUID(),
        userId: contractorUser.id,
        name: testCompanyName,
        city: "تهران",
        province: "تهران",
        updatedAt: new Date(),
      },
    });

    console.log("✅ Contractor account created:");
    console.log(`   User ID: ${contractorUser.id}`);
    console.log(`   Phone: ${contractorUser.phone}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Company ID: ${contractorCompany.id}`);

    // Create test supplier account
    const testSupplierPhone = "09123456790";
    console.log("\nCreating test supplier account...");
    const supplierUser = await prisma.users.upsert({
      where: { phone: testSupplierPhone },
      update: {
        password: hashedPassword,
        role: "supplier",
        isVerified: true,
        profileCompleted: false,
        otpCode: null,
        otpExpiresAt: null,
      },
      create: {
        id: crypto.randomUUID(),
        phone: testSupplierPhone,
        password: hashedPassword,
        role: "supplier",
        isVerified: true,
        profileCompleted: false,
        updatedAt: new Date(),
      },
    });

    // Create supplier company
    const supplierCompany = await prisma.companies.upsert({
      where: { userId: supplierUser.id },
      update: {
        name: testSupplierName,
        city: "تهران",
        province: "تهران",
      },
      create: {
        id: crypto.randomUUID(),
        userId: supplierUser.id,
        name: testSupplierName,
        city: "تهران",
        province: "تهران",
        updatedAt: new Date(),
      },
    });

    console.log("✅ Supplier account created:");
    console.log(`   User ID: ${supplierUser.id}`);
    console.log(`   Phone: ${supplierUser.phone}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Company ID: ${supplierCompany.id}`);

    console.log("\n📝 Test Accounts Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("CONTRACTOR:");
    console.log(`   Phone: ${testPhone}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Login URL: /auth/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("SUPPLIER:");
    console.log(`   Phone: ${testSupplierPhone}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Login URL: /auth/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error creating test account:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestAccount();

