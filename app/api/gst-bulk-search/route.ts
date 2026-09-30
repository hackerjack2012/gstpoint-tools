import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Please login to use GST Bulk Search." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { detail: "User account not found." },
        { status: 404 }
      );
    }

    if (user.plan === "FREE" && user.usageCount >= 5) {
      return NextResponse.json(
        {
          detail: "You have reached your Free plan limit of 5 requests. Please upgrade your plan.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { detail: "Backend URL is not configured." },
        { status: 500 }
      );
    }

    const backendResponse = await fetch(
      `${backendUrl.replace(/\/$/, "")}/gst-bulk-search/`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { detail: errorText || "GST Bulk Search processing failed." },
        { status: backendResponse.status }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      const fileField = formData.get("file");
      const originalName = fileField instanceof File ? fileField.name : "bulk_gstins.xlsx";
      const fileSize = fileField instanceof File ? fileField.size : 0;

      await tx.file.create({
        data: {
          userId: user.id,
          filename: `bulk_search_${Date.now()}_${originalName}`,
          originalName: originalName,
          size: fileSize,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ledgerType: "SINGLE",
          gstRate: 0,
          delayDays: 0,
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });
    });

    const fileBuffer = await backendResponse.arrayBuffer();
    const contentDisposition =
      backendResponse.headers.get("content-disposition") ||
      'attachment; filename="GST_Bulk_Search_Report.xlsx"';

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
    console.error("GST Bulk Search API error:", error);
    return NextResponse.json(
      { detail: "Unable to process the bulk search request." },
      { status: 500 }
    );
  }
}
