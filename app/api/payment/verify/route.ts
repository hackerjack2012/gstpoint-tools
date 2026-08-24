import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Find and update payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "COMPLETED",
        verifiedAt: new Date(),
      },
    });

    // Update user plan
    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        plan: payment.plan as "FREE" | "PRO" | "ENTERPRISE",
      },
    });

    return NextResponse.json(
      { success: true, message: "Payment verified and plan upgraded" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
