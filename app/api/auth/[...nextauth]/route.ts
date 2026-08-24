import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Extend the session user type
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    plan: "FREE" | "PRO" | "ENTERPRISE";
    usageCount: number;
    emailVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      plan: "FREE" | "PRO" | "ENTERPRISE";
      usageCount: number;
      emailVerified: boolean;
    };
  }
}

// Helper functions
export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

export const createUser = async (email: string, password: string, name: string) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  return await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      plan: "FREE",
      usageCount: 0,
    },
  });
};

export const incrementUsage = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
};

export const verifyUserEmail = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailToken: null,
      tokenExpires: null,
    },
  });
};

export const setEmailToken = async (userId: string, token: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailToken: token,
      tokenExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
};

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await findUserByEmail(credentials.email);
        if (!user) throw new Error("No user found with this email");

        const isValidPassword = bcrypt.compareSync(credentials.password, user.password);
        if (!isValidPassword) throw new Error("Invalid password");

        if (!user.emailVerified) throw new Error("Please verify your email before logging in");

        

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          plan: user.plan as "FREE" | "PRO" | "ENTERPRISE",
          usageCount: user.usageCount,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.usageCount = user.usageCount;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as "FREE" | "PRO" | "ENTERPRISE";
        session.user.usageCount = token.usageCount as number;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Handler for Next.js App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
