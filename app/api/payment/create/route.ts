import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, plan, amount } = await request.json();

    if (!userId || !plan || !amount) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: "INR",
        plan: plan.toUpperCase() as "FREE" | "PRO" | "ENTERPRISE",
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { success: true, paymentId: payment.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
