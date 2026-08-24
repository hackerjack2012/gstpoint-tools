import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, setEmailToken } from "@/app/api/auth/[...nextauth]/route";
import { generate } from "otp-generator";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
});

// Generate OTP
const generateOTP = (): string => {
  return generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });
};

// Send verification email
const sendVerificationEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@gstpoint-tools.com",
    to: email,
    subject: "Your New Verification Code - GSTPoint Tools",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af; text-align: center;">GSTPoint Tools</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Here's your new verification code:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e40af;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          This OTP will expire in 15 minutes.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await findUserByEmail(email);

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

    // Generate new OTP
    const otp = generateOTP();

    // Store OTP in database
    await setEmailToken(user.id, otp);

    // Send verification email
const emailSent = await sendVerificationEmail(email, otp);

if (!emailSent) {
  return NextResponse.json(
    {
      success: false,
      error: "Unable to send verification email. Please try again.",
    },
    { status: 500 }
  );
}

return NextResponse.json(
  {
    success: true,
    message: "New verification email sent. Please check your inbox.",
  },
  { status: 200 }
);
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
