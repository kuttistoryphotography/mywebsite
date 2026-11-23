
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function requireFinalPackageAdmin() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        user: null,
        response: NextResponse.json(
          { success: false, message: "Authentication required." },
          { status: 401 }
        ),
      };
    }

    if (user.role !== "admin") {
      return {
        user: null,
        response: NextResponse.json(
          { success: false, message: "Administrator access required." },
          { status: 403 }
        ),
      };
    }

    return {
      user,
      response: null,
    };
  } catch {
    return {
      user: null,
      response: NextResponse.json(
        { success: false, message: "Authentication failed." },
        { status: 401 }
      ),
    };
  }
}
