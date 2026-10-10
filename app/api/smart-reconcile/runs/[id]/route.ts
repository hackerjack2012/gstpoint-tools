import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Run ID is required" }, { status: 400 });
    }

    // Verify run belongs to user
    const run = await prisma.reconciliationRun.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json({ error: "Reconciliation run not found" }, { status: 404 });
    }

    if (run.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this run" }, { status: 403 });
    }

    // Delete associated matches, invoices, sources, then the run
    await prisma.$transaction([
      prisma.reconciliationMatch.deleteMany({ where: { runId: id } }),
      prisma.reconciliationInvoice.deleteMany({ where: { runId: id } }),
      prisma.reconciliationSource.deleteMany({ where: { runId: id } }),
      prisma.reconciliationRun.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: "Reconciliation run deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete reconciliation run:", error);
    return NextResponse.json({ error: error.message || "Failed to delete reconciliation run" }, { status: 500 });
  }
}
