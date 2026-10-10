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

    const runs = await prisma.reconciliationRun.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sources: true,
      },
    });

    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    console.error("Fetch runs error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch runs" }, { status: 500 });
  }
}
