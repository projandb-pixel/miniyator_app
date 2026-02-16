import { config } from 'dotenv'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Load environment variables explicitly
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: false })
}
if (existsSync(envPath)) {
  config({ path: envPath, override: false })
}

// Get DATABASE_URL from environment or use a placeholder for generate
// The actual connection is handled by the adapter in lib/prisma.ts
const DATABASE_URL = process.env.DATABASE_URL || 'sqlserver://localhost:1433;database=temp;user=sa;password=temp;trustServerCertificate=true'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: DATABASE_URL,
  },
})

