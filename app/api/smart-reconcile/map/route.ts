import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("sourceType") || "PR";

    const templates = await prisma.reconciliationMappingTemplate.findMany({
      where: {
        userId: session.user.id,
        sourceType,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Fetch templates error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, sourceType, mapping } = body;

    if (!name || !sourceType || !mapping) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = await prisma.reconciliationMappingTemplate.create({
      data: {
        userId: session.user.id,
        name,
        sourceType,
        mappingJson: JSON.stringify(mapping),
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Save template error:", error);
    return NextResponse.json({ error: error.message || "Failed to save template" }, { status: 500 });
  }
}
