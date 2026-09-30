import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify logged-in user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Please login to use Payment Matcher." },
        { status: 401 }
      );
    }

    // 2. Read fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { detail: "User account not found." },
        { status: 404 }
      );
    }

    // 3. Enforce Free plan limit
    if (user.plan === "FREE" && user.usageCount >= 5) {
      return NextResponse.json(
        {
          detail:
            "You have reached your Free plan limit of 5 files. Please upgrade your plan.",
        },
        { status: 403 }
      );
    }

    // 4. Get uploaded file + settings
    const formData = await request.formData();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { detail: "Backend URL is not configured." },
        { status: 500 }
      );
    }

    // 5. Send file to Render backend
    const backendResponse = await fetch(
      `${backendUrl.replace(/\/$/, "")}/payment-matcher/`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();

      return NextResponse.json(
        {
          detail: errorText || "Payment Matcher processing failed.",
        },
        { status: backendResponse.status }
      );
    }

    // 6. Render successfully processed the file.
    // Record file in history and update usage in a transaction
    const formDataEntries = {
      ledgerType: formData.get("ledger_type") as string,
      gstRate: parseFloat(formData.get("gst_rate") as string || "18"),
      delayDays: parseInt(formData.get("delay_threshold") as string || "180"),
    };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          usageCount: {
            increment: 1,
          },
          lastUsedAt: new Date(),
        },
      });

      const fileField = formData.get("file");
      const originalName = fileField instanceof File ? fileField.name : "ledger.xlsx";
      const fileSize = fileField instanceof File ? fileField.size : 0;

      await tx.file.create({
        data: {
          userId: user.id,
          filename: `matched_${Date.now()}_${originalName}`,
          originalName: originalName,
          size: fileSize,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ledgerType: formDataEntries.ledgerType === "multi" ? "MULTI" : "SINGLE",
          gstRate: formDataEntries.gstRate,
          delayDays: formDataEntries.delayDays,
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });
    });

    // 7. Return generated Excel file to browser
    const fileBuffer = await backendResponse.arrayBuffer();

    const contentDisposition =
      backendResponse.headers.get("content-disposition") ||
      'attachment; filename="MatchedFIFO.xlsx"';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Payment Matcher API error:", error);

    return NextResponse.json(
      { detail: "Unable to process the file." },
      { status: 500 }
    );
  }
}