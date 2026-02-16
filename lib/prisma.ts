import { PrismaClient } from '@prisma/client'
import { PrismaMssql } from '@prisma/adapter-mssql'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

// Define env file paths at module level
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')
const envProductionPath = resolve(process.cwd(), '.env.production')

// Load environment variables
// Try to use Next.js loadEnvConfig if available, otherwise fall back to dotenv
try {
  // Try to use Next.js env loader (available in Next.js 13+)
  const { loadEnvConfig } = require('@next/env')
  const projectDir = process.cwd()
  loadEnvConfig(projectDir)
} catch {
  // Fall back to dotenv if @next/env is not available
  // Load .env.local first (higher priority), then .env
  // Only load if not already loaded by Next.js
  if (!process.env.DATABASE_URL) {
    if (existsSync(envPath)) {
      config({ path: envPath, override: false })
    }
    if (existsSync(envLocalPath)) {
      config({ path: envLocalPath, override: true }) // .env.local overrides .env
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Parse SQL Server connection string (sqlserver://host:port;database=db;user=user;password=pass;trustServerCertificate=true)
function parseConnectionString(connectionString: string) {
  // Remove sqlserver:// prefix
  const url = connectionString.replace(/^sqlserver:\/\//, '')
  
  // Split host:port and parameters
  const [hostPort, ...params] = url.split(';')
  const [server, portStr] = hostPort.split(':')
  const port = portStr ? Number.parseInt(portStr, 10) : 1433
  
  // Parse parameters
  const config: {
    server: string
    port: number
    database?: string
    user?: string
    password?: string
    options?: {
      encrypt?: boolean
      trustServerCertificate?: boolean
    }
  } = {
    server,
    port,
    options: {},
  }
  
  for (const param of params) {
    const [key, value] = param.split('=')
    if (!key || !value) continue
    
    switch (key.toLowerCase()) {
      case 'database':
        config.database = value
        break
      case 'user':
        config.user = value
        break
      case 'password':
        config.password = value
        break
      case 'encrypt':
        config.options!.encrypt = value.toLowerCase() === 'true'
        break
      case 'trustservercertificate':
        config.options!.trustServerCertificate = value.toLowerCase() === 'true'
        break
    }
  }
  
  return config
}

function getPrismaClient() {
  // Get DATABASE_URL from environment (lazy load)
  // Try to reload env files if DATABASE_URL is not found
  let DATABASE_URL = process.env.DATABASE_URL
  
  if (!DATABASE_URL) {
    // Try reloading environment variables with override
    // In production, try .env.production first, then .env, then .env.local
    if (process.env.NODE_ENV === 'production' && existsSync(envProductionPath)) {
      config({ path: envProductionPath, override: true })
      DATABASE_URL = process.env.DATABASE_URL
    }
    if (!DATABASE_URL && existsSync(envPath)) {
      config({ path: envPath, override: true })
      DATABASE_URL = process.env.DATABASE_URL
    }
    if (!DATABASE_URL && existsSync(envLocalPath)) {
      config({ path: envLocalPath, override: true })
      DATABASE_URL = process.env.DATABASE_URL
      
      // If dotenv didn't work, try reading the file directly (handles UTF-16 encoding)
      if (!DATABASE_URL) {
        try {
          const fs = require('fs');
          let content: string;
          try {
            content = fs.readFileSync(envLocalPath, 'utf-8');
            // Check if it looks like UTF-16
            if (content.charCodeAt(0) === 0xFEFF || content.includes('\u0000')) {
              const buffer = fs.readFileSync(envLocalPath);
              content = buffer.toString('utf16le');
            }
          } catch (e) {
            const buffer = fs.readFileSync(envLocalPath);
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
                // Set it in process.env for future use
                process.env.DATABASE_URL = DATABASE_URL;
                break;
              }
            }
          }
        } catch (readError) {
          // Ignore read errors, will throw below if DATABASE_URL is still not set
        }
      }
    }
  }

  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    console.error('Current working directory:', process.cwd())
    console.error('NODE_ENV:', process.env.NODE_ENV)
    console.error('.env.local exists:', existsSync(envLocalPath))
    console.error('.env exists:', existsSync(envPath))
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
    throw new Error('DATABASE_URL environment variable is required. Please check your .env.local or .env file.')
  }

  // Log connection info in development (without sensitive data)
  if (process.env.NODE_ENV === 'development') {
    const urlParts = DATABASE_URL.split(';')
    const serverPart = urlParts[0] || ''
    console.log('Connecting to database:', serverPart.replace(/password=[^;]*/i, 'password=***'))
  }

  // Parse connection string and create adapter
  const adapterConfig = parseConnectionString(DATABASE_URL)
  const adapter = new PrismaMssql(adapterConfig)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Lazy initialization - only create client when actually accessed
// Use a simple getter pattern instead of Proxy for better compatibility
let prismaInstance: PrismaClient | null = null

function getPrismaInstance(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  if (prismaInstance) {
    return prismaInstance
  }
  
  const client = getPrismaClient()
  
  // Always cache in global to avoid creating multiple instances
  globalForPrisma.prisma = client
  prismaInstance = client
  
  return client
}

// Export as a getter that creates the client lazily
// This ensures the client is only created when actually used
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaInstance()
    const value = (client as any)[prop]
    
    // If it's a function, bind it to the client to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    
    return value
  },
  // Support for 'in' operator
  has(_target, prop) {
    const client = getPrismaInstance()
    return prop in client
  },
  // Support for Object.keys and similar operations
  ownKeys(_target) {
    const client = getPrismaInstance()
    return Reflect.ownKeys(client)
  },
  getOwnPropertyDescriptor(_target, prop) {
    const client = getPrismaInstance()
    return Reflect.getOwnPropertyDescriptor(client, prop)
  }
})
