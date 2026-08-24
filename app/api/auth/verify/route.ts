import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { success: false, error: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    // Find user and check token
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email already verified" },
        { status: 400 }
      );
    }

    // Check if token matches and is not expired
    if (user.emailToken !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (user.tokenExpires && user.tokenExpires < new Date()) {
      return NextResponse.json(
        { success: false, error: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailToken: null,
        tokenExpires: null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
