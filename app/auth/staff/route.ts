import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          detail: "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Failed to resolve auth session:", error);

    return NextResponse.json(
      {
        detail: "Unable to verify authentication",
      },
      {
        status: 401,
      }
    );
  }
}