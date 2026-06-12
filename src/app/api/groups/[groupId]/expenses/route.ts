import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";

type ParamsInput = { params: Promise<{ groupId: string }> };

/**
 * GET: Retrieve a paginated list of expenses for a group.
 */
export async function GET(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Check membership
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

    // Parse pagination query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const totalCount = await prisma.expense.count({
      where: { groupId }
    });

    const expenses = await prisma.expense.findMany({
      where: { groupId },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        paidByUser: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      skip,
      take: limit
    });

    const hasNextPage = skip + expenses.length < totalCount;
    const nextPage = hasNextPage ? page + 1 : null;

    return NextResponse.json({
      expenses,
      totalCount,
      nextPage,
      page
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error listing group expenses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
