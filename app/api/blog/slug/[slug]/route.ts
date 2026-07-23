import { getBlogBySlug } from "@/lib/getBlog";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const blog = await getBlogBySlug(resolvedParams.slug);
    console.log("API BLOG:", blog);
    console.log("API IMAGE ALT:", blog?.image_alt);

    console.log('bllll------', blog);
    
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    return NextResponse.json({ blog });
  } catch (error) {
    console.error("Failed to fetch blog by slug", error);
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
  }
}
