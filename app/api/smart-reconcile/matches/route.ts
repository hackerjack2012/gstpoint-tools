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
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json({ error: "Missing runId parameter" }, { status: 400 });
    }

    const run = await prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        matches: true,
        invoices: true,
      },
    });

    if (!run || run.userId !== session.user.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    console.error("Fetch matches error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch matches" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { matchId, reviewStatus, remarks } = body;

    if (!matchId || !reviewStatus) {
      return NextResponse.json({ error: "Missing matchId or reviewStatus" }, { status: 400 });
    }

    const match = await prisma.reconciliationMatch.findUnique({
      where: { id: matchId },
      include: { run: true },
    });

    if (!match || match.run.userId !== session.user.id) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const updated = await prisma.reconciliationMatch.update({
      where: { id: matchId },
      data: {
        reviewStatus,
        remarks: remarks !== undefined ? remarks : match.remarks,
      },
    });

    return NextResponse.json({ success: true, match: updated });
  } catch (error: any) {
    console.error("Update match error:", error);
    return NextResponse.json({ error: error.message || "Failed to update match" }, { status: 500 });
  }
}
