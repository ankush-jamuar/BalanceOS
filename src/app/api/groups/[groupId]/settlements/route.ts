import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";

type ParamsInput = { params: Promise<{ groupId: string }> };

/**
 * GET: Retrieve a paginated list of settlements for a group.
 */
export async function GET(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: currentUser.id
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this group." }, { status: 403 });
    }

    // Parse pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const totalCount = await prisma.settlement.count({
      where: { groupId }
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      include: {
        payerUser: {
          select: { id: true, email: true, username: true, fullName: true, avatarUrl: true }
        },
        receiverUser: {
          select: { id: true, email: true, username: true, fullName: true, avatarUrl: true }
        },
        createdByUser: {
          select: { id: true, fullName: true }
        }
      },
      skip,
      take: limit
    });

    const hasNextPage = skip + settlements.length < totalCount;
    const nextPage = hasNextPage ? page + 1 : null;

    return NextResponse.json({
      settlements,
      totalCount,
      nextPage,
      page
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error listing group settlements:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
