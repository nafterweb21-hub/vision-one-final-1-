import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Validate type (PDF/Image)
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and Image files are allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitize filename but preserve dots
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const filename = `${uniqueSuffix}-${originalName}`;

    // Target directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error: unknown) {
    console.error("File upload error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
