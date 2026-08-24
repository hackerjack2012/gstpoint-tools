import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, setEmailToken } from "@/app/api/auth/[...nextauth]/route";
import { generate } from "otp-generator";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
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
    subject: "Verify Your Email - GSTPoint Tools",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af; text-align: center;">GSTPoint Tools</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Thank you for signing up! Please use the following OTP to verify your email address:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e40af;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          This OTP will expire in 15 minutes.
        </p>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
          If you didn't request this, please ignore this email.
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
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await createUser(email, password, name);

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    await setEmailToken(newUser.id, otp);

    // Send verification email
const emailSent = await sendVerificationEmail(email, otp);

if (!emailSent) {
  console.error("Verification email could not be sent");
}

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
  {
    success: true,
    user: userWithoutPassword,
    message: "Verification email sent. Please check your inbox.",
  },
  { status: 201 }
);
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
