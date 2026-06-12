import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";

export async function GET(req: Request) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Search users matching email or username, excluding the active logged-in user
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } }
        ],
        NOT: {
          id: currentUser.id
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true
      },
      take: 10
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
