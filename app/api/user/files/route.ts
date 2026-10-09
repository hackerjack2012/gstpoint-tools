import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      );
    }

    const files = await prisma.file.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedFiles = files.map((file) => ({
      id: file.id,
      filename: file.originalName || file.filename,
      status: file.status,
      date: new Date(file.createdAt).toISOString().split("T")[0],
      size: file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "0.0 MB",
    }));

    return NextResponse.json({ files: formattedFiles }, { status: 200 });
  } catch (error) {
    console.error("Fetch user files error:", error);
    return NextResponse.json(
      { detail: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { detail: "File ID is required" },
        { status: 400 }
      );
    }

    // Verify file belongs to user
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.userId !== session.user.id) {
      return NextResponse.json(
        { detail: "File not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete user file error:", error);
    return NextResponse.json(
      { detail: "Failed to delete file" },
      { status: 500 }
    );
  }
}
