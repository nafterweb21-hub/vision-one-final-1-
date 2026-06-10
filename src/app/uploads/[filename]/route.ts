import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import fs from "fs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> | { filename: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const filename = resolvedParams.filename;
    
    // Prevent directory traversal attacks
    if (filename.includes("/") || filename.includes("..")) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const buffer = await readFile(filePath);
    
    // Determine content type
    let contentType = "application/octet-stream";
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.endsWith(".png")) contentType = "image/png";
    else if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lowerFilename.endsWith(".gif")) contentType = "image/gif";
    else if (lowerFilename.endsWith(".svg")) contentType = "image/svg+xml";
    else if (lowerFilename.endsWith(".pdf")) contentType = "application/pdf";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
