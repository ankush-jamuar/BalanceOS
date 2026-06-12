import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateSyncedUser } from "@/lib/user-sync";
import { calculateNetBalances } from "@/lib/split-utils";

type ParamsInput = { params: Promise<{ groupId: string; memberId: string }> };

/**
 * DELETE: Remove a member from a group.
 */
export async function DELETE(req: Request, { params }: ParamsInput) {
  try {
    const currentUser = await getOrCreateSyncedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId, memberId } = await params;

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    // Only OWNER can remove members
    if (group.ownerId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: Only the owner can remove members." }, { status: 403 });
    }

    // Find the target group member record
    const targetMember = await prisma.groupMember.findUnique({
      where: { id: memberId }
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found in this group." }, { status: 404 });
    }

    // The owner cannot remove themselves from the group
    if (targetMember.userId === group.ownerId) {
      return NextResponse.json({ error: "Conflict: The group owner cannot be removed from the group." }, { status: 400 });
    }

    // Fetch all members in this group to calculate net balances
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId }
    });
    const memberUserIds = allMembers.map(m => m.userId);

    // Fetch expenses and splits for dynamic balance checks
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

    // Fetch settlements for balance calculations
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      select: {
        id: true,
        payerUserId: true,
        receiverUserId: true,
        amount: true
      }
    });

    // Run dynamic balance calculation
    const netBalances = calculateNetBalances(memberUserIds, expenses, settlements);
    const targetUserBalance = netBalances[targetMember.userId] || 0;

    // Block removal if net balance is not exactly 0
    if (targetUserBalance !== 0) {
      const formattedBalance = (targetUserBalance / 100).toFixed(2);
      return NextResponse.json(
        { 
          error: `Cannot remove member: user has outstanding balances of ${formattedBalance} ${group.currency}. Settle all debts before removal.` 
        }, 
        { status: 400 }
      );
    }

    // Settle balance check passed -> Delete membership record
    await prisma.groupMember.delete({
      where: { id: memberId }
    });

    return NextResponse.json({ message: "Member removed successfully." }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error removing group member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
