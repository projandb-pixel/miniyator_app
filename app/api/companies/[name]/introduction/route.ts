import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bufferToBase64 } from "@/lib/file-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const introduction = await prisma.companyIntroductions.findUnique({
      where: {
        companyName: decodedName,
      },
    });

    if (!introduction) {
      return NextResponse.json(
        { error: "Introduction not found" },
        { status: 404 }
      );
    }

    // Convert image blob to base64
    const introductionWithImage = {
      ...introduction,
      image: introduction.image
        ? bufferToBase64(introduction.image as Buffer)
        : null,
    };

    return NextResponse.json({ introduction: introductionWithImage });
  } catch (error) {
    console.error("Error fetching company introduction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
