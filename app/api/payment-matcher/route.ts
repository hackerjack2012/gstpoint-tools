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

    // 5. Send file to Railway backend
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

    // 6. Railway successfully processed the file.
    // Only now count usage.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
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