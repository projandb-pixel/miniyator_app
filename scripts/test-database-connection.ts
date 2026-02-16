import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { config } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

// Load environment variables
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");
const envProductionPath = resolve(process.cwd(), ".env.production");

// Load .env first, then .env.local (which overrides .env)
if (existsSync(envPath)) {
  const result = config({ path: envPath, override: false });
  if (result.error) {
    console.warn("Warning loading .env:", result.error);
  }
}
if (existsSync(envLocalPath)) {
  const result = config({ path: envLocalPath, override: true });
  if (result.error) {
    console.warn("Warning loading .env.local:", result.error);
  }
}
if (process.env.NODE_ENV === 'production' && existsSync(envProductionPath)) {
  const result = config({ path: envProductionPath, override: true });
  if (result.error) {
    console.warn("Warning loading .env.production:", result.error);
  }
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

async function testDatabaseConnection() {
  // Try to manually read the file if dotenv didn't work
  let DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not found in process.env, trying to read from file...");
    const fs = require('fs');
    
    // Try reading .env.local first - handle both UTF-8 and UTF-16
    if (existsSync(envLocalPath)) {
      let content: string;
      try {
        // Try UTF-8 first
        content = fs.readFileSync(envLocalPath, 'utf-8');
        // Check if it looks like UTF-16 (has BOM or weird characters)
        if (content.charCodeAt(0) === 0xFEFF || content.includes('\u0000')) {
          // Try UTF-16LE
          const buffer = fs.readFileSync(envLocalPath);
          content = buffer.toString('utf16le');
        }
      } catch (e) {
        // If UTF-8 fails, try UTF-16
        const buffer = fs.readFileSync(envLocalPath);
        content = buffer.toString('utf16le');
      }
      
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL') || trimmed.startsWith('\uFEFFDATABASE_URL')) {
          const cleanLine = trimmed.replace(/^\uFEFF/, ''); // Remove BOM if present
          const parts = cleanLine.split('=');
          if (parts.length >= 2) {
            DATABASE_URL = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            console.log("✅ Found DATABASE_URL in .env.local");
            break;
          }
        }
      }
    }
    
    // If still not found, try .env
    if (!DATABASE_URL && existsSync(envPath)) {
      let content: string;
      try {
        content = fs.readFileSync(envPath, 'utf-8');
        if (content.charCodeAt(0) === 0xFEFF || content.includes('\u0000')) {
          const buffer = fs.readFileSync(envPath);
          content = buffer.toString('utf16le');
        }
      } catch (e) {
        const buffer = fs.readFileSync(envPath);
        content = buffer.toString('utf16le');
      }
      
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL') || trimmed.startsWith('\uFEFFDATABASE_URL')) {
          const cleanLine = trimmed.replace(/^\uFEFF/, '');
          const parts = cleanLine.split('=');
          if (parts.length >= 2) {
            DATABASE_URL = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            console.log("✅ Found DATABASE_URL in .env");
            break;
          }
        }
      }
    }
  }
  
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.error("Current working directory:", process.cwd());
    console.error(".env.local exists:", existsSync(envLocalPath));
    console.error(".env exists:", existsSync(envPath));
    console.error(".env.production exists:", existsSync(envProductionPath));
    console.error("All env vars:", Object.keys(process.env).filter(k => k.includes('DATABASE')));
    process.exit(1);
  }

  console.log("🔍 Testing Database Connection...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("DATABASE_URL:", DATABASE_URL.replace(/password=[^;]*/i, "password=***"));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const adapterConfig = parseConnectionString(DATABASE_URL);
  const adapter = new PrismaMssql(adapterConfig);
  const prisma = new PrismaClient({ 
    adapter,
    log: ['error', 'warn', 'info'],
  });

  try {
    // Test 1: Connect to database
    console.log("📡 Test 1: Connecting to database...");
    await prisma.$connect();
    console.log("✅ Successfully connected to database!\n");

    // Test 2: Query users table
    console.log("📊 Test 2: Querying users table...");
    const userCount = await prisma.users.count();
    console.log(`✅ Found ${userCount} users in database\n`);

    // Test 3: Query companies table
    console.log("🏢 Test 3: Querying companies table...");
    const companyCount = await prisma.companies.count();
    console.log(`✅ Found ${companyCount} companies in database\n`);

    // Test 4: Create test accounts
    console.log("👤 Test 4: Creating test accounts...");
    const testPhone = "09123456789";
    const testPassword = "test123456";
    const testCompanyName = "شرکت تست پیمانکاری";
    const testSupplierName = "شرکت تست تأمین‌کننده";

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test contractor account
    console.log("   Creating contractor account...");
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

    console.log("   ✅ Contractor account created");
    console.log(`      User ID: ${contractorUser.id}`);
    console.log(`      Phone: ${contractorUser.phone}`);
    console.log(`      Company ID: ${contractorCompany.id}\n`);

    // Create test supplier account
    const testSupplierPhone = "09123456790";
    console.log("   Creating supplier account...");
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

    console.log("   ✅ Supplier account created");
    console.log(`      User ID: ${supplierUser.id}`);
    console.log(`      Phone: ${testSupplierPhone}`);
    console.log(`      Company ID: ${supplierCompany.id}\n`);

    // Test 5: Test login query
    console.log("🔐 Test 5: Testing login query...");
    const testUser = await prisma.users.findUnique({
      where: { phone: testPhone },
      include: { Companies: true },
    });

    if (!testUser) {
      throw new Error("Test user not found!");
    }

    if (!testUser.password) {
      throw new Error("Test user password not set!");
    }

    const isPasswordValid = await bcrypt.compare(testPassword, testUser.password);
    if (!isPasswordValid) {
      throw new Error("Password verification failed!");
    }

    console.log("✅ Login query successful");
    console.log(`   User found: ${testUser.phone}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Company: ${testUser.Companies?.name || 'N/A'}\n`);

    // Test 6: Test complex queries
    console.log("🔍 Test 6: Testing complex queries...");
    const usersWithCompanies = await prisma.users.findMany({
      take: 5,
      include: {
        Companies: true,
      },
    });
    console.log(`✅ Retrieved ${usersWithCompanies.length} users with companies\n`);

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ ALL TESTS PASSED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📝 Test Accounts Created:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("CONTRACTOR:");
    console.log(`   Phone: ${testPhone}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Login URL: http://localhost:3000/auth/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("SUPPLIER:");
    console.log(`   Phone: ${testSupplierPhone}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Login URL: http://localhost:3000/auth/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await prisma.$disconnect();
    console.log("✅ Database connection closed successfully");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ ERROR OCCURRED:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error name:", error.name);
    
    if (error.meta) {
      console.error("Error meta:", JSON.stringify(error.meta, null, 2));
    }
    
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting:", disconnectError);
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();
