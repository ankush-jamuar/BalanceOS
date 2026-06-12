import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { calculateNetBalances, matchDebts } from "@/lib/split-utils";

type ParamsInput = { params: Promise<{ groupId: string }> };

/**
 * GET: Calculate dynamically net balances and debtor-creditor suggested settlements.
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

    // Fetch all members in this group
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    const memberUserIds = members.map(m => m.userId);
    const memberProfiles = members.reduce((acc, curr) => {
      acc[curr.userId] = curr.user;
      return acc;
    }, {} as Record<string, typeof members[0]["user"]>);

    // Fetch expenses and splits
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      select: {
        id: true,
        amount: true,
        paidByUserId: true,
        splits: {
          select: {
            userId: true,
            amountOwed: true
          }
        }
      }
    });

    // Fetch settlements
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      select: {
        id: true,
        payerUserId: true,
        receiverUserId: true,
        amount: true
      }
    });

    // Calculate dynamic net balances
    const netBalances = calculateNetBalances(memberUserIds, expenses, settlements);

    // Generate suggested direct settlements matches (who owes whom)
    const rawSuggestedPayments = matchDebts(netBalances);

    // Map profiles to suggested payments for rich UI rendering
    const suggestedPayments = rawSuggestedPayments.map(payment => ({
      fromUser: memberProfiles[payment.fromUserId],
      toUser: memberProfiles[payment.toUserId],
      amount: payment.amount
    }));

    // Map profiles to balances
    const balances = Object.keys(netBalances).map(userId => ({
      user: memberProfiles[userId],
      netBalance: netBalances[userId]
    }));

    return NextResponse.json({
      balances,
      suggestedPayments
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error calculating group balances:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
