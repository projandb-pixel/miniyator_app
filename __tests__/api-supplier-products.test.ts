import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// Mock prisma (virtual to avoid path alias resolution issues)
vi.mock(
  "@/lib/prisma",
  () => ({
    prisma: {
      companies: {
        findUnique: vi.fn(),
      },
      products: {
        create: vi.fn(),
      },
    },
  }),
  { virtual: true }
);

// Mock file-utils to bypass alias resolution and heavy logic
vi.mock(
  "@/lib/file-utils",
  () => ({
    base64ToBuffer: vi.fn((val: string) => Buffer.from(val ?? "", "base64")),
    bufferToBase64: vi.fn((buf: Buffer) => `data:;base64,${buf.toString("base64")}`),
  }),
  { virtual: true }
);

// Import mocked prisma
import { prisma } from "@/lib/prisma";

// Lazy import of handler after mocks
let POST: typeof import("../app/api/supplier/products/route").POST;
beforeAll(async () => {
  const mod = await import("../app/api/supplier/products/route");
  POST = mod.POST;
});

const buildRequest = (body: any) =>
  new Request("http://localhost/api/supplier/products", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("POST /api/supplier/products", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(buildRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 404 when company not found", async () => {
    (prisma.companies.findUnique as any).mockResolvedValue(null);

    const res = await POST(
      buildRequest({
        companyId: "missing-company",
        name: "Sample",
        category: "برق",
      })
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/شرکت یافت نشد/);
  });

  it("returns 400 for invalid base64 image", async () => {
    (prisma.companies.findUnique as any).mockResolvedValue({ id: "c1" });
    const { base64ToBuffer } = await import("@/lib/file-utils");
    (base64ToBuffer as any).mockImplementation(() => {
      throw new Error("invalid base64");
    });

    const res = await POST(
      buildRequest({
        companyId: "c1",
        name: "Sample",
        category: "برق",
        image: "not-base64",
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/فرمت تصویر نامعتبر/);
  });

  it("creates product when payload is valid", async () => {
    (prisma.companies.findUnique as any).mockResolvedValue({ id: "c1" });
    (prisma.products.create as any).mockResolvedValue({ id: "p1" });

    const res = await POST(
      buildRequest({
        companyId: "c1",
        name: "نام محصول",
        category: "برق",
        brand: "برند",
        price: "1000",
        priceRange: "900-1100",
        unit: "عدد",
        description: "توضیح",
        specifications: "مشخصات",
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.product?.id).toBe("p1");
    expect(prisma.products.create).toHaveBeenCalled();
  });

  it("converts base64 image to Buffer before create", async () => {
    (prisma.companies.findUnique as any).mockResolvedValue({ id: "c1" });
    (prisma.products.create as any).mockResolvedValue({ id: "p-img" });

    const base64 = Buffer.from("demo-image").toString("base64");
    const res = await POST(
      buildRequest({
        companyId: "c1",
        name: "نام محصول",
        category: "برق",
        image: `data:image/png;base64,${base64}`,
      })
    );

    expect(res.status).toBe(201);
    const args = (prisma.products.create as any).mock.calls[0]?.[0];
    expect(args.data.image).toBeInstanceOf(Buffer);
    expect(args.data.image.toString("base64")).toBe(base64);
  });
});

