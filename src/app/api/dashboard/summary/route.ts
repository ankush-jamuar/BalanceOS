import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { calculateNetBalances } from "@/lib/split-utils";

/**
 * GET: Fetch dynamic personal dashboard balances and recent activity.
 */
export async function GET() {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all group memberships of the user
    const memberships = await prisma.groupMember.findMany({
      where: { userId: currentUser.id },
      select: { groupId: true }
    });

    const groupIds = memberships.map(m => m.groupId);

    let totalOwed = 0;
    let totalReceivable = 0;

    // Loop through each group to dynamically compute balances
    for (const groupId of groupIds) {
      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true }
      });
      const memberUserIds = groupMembers.map(m => m.userId);

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

      const settlements = await prisma.settlement.findMany({
        where: { groupId },
        select: {
          id: true,
          payerUserId: true,
          receiverUserId: true,
          amount: true
        }
      });

      const netBalances = calculateNetBalances(memberUserIds, expenses, settlements);
      const userBalance = netBalances[currentUser.id] || 0;

      if (userBalance < 0) {
        totalOwed += Math.abs(userBalance);
      } else if (userBalance > 0) {
        totalReceivable += userBalance;
      }
    }

    const netBalance = totalReceivable - totalOwed;

    // Fetch recent expenses across all groups the user belongs to
    const recentExpenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        paidByUser: { select: { id: true, fullName: true, avatarUrl: true } },
        group: { select: { name: true } }
      }
    });

    // Fetch recent settlements across all groups
    const recentSettlements = await prisma.settlement.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        payerUser: { select: { id: true, fullName: true } },
        receiverUser: { select: { id: true, fullName: true } },
        group: { select: { name: true } }
      }
    });

    // Combine and sort activities by date descending
    const activities = [
      ...recentExpenses.map(exp => ({
        id: exp.id,
        type: "EXPENSE" as const,
        title: exp.title,
        amount: exp.amount,
        groupName: exp.group.name,
        groupId: exp.groupId,
        date: exp.createdAt,
        user: exp.paidByUser.fullName
      })),
      ...recentSettlements.map(set => ({
        id: set.id,
        type: "SETTLEMENT" as const,
        title: `Settled up`,
        amount: set.amount,
        groupName: set.group.name,
        groupId: set.groupId,
        date: set.createdAt,
        user: `${set.payerUser.fullName} paid ${set.receiverUser.fullName}`
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

    return NextResponse.json({
      totalOwed,
      totalReceivable,
      netBalance,
      activeGroupsCount: groupIds.length,
      activities
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
